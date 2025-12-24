import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class FitnessAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, "FitnessAppVpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: "Database",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create secret for NextAuth
    const nextAuthSecret = new secretsmanager.Secret(this, "NextAuthSecret", {
      secretName: "fitness-app/nextauth-secret",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ secret: "" }),
        generateStringKey: "secret",
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Create RDS PostgreSQL database
    const dbSecret = new secretsmanager.Secret(this, "DBSecret", {
      secretName: "fitness-app/db-credentials",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "postgres" }),
        generateStringKey: "password",
        excludePunctuation: true,
        excludeCharacters: '"@/\\',
      },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, "DBSecurityGroup", {
      vpc,
      description: "Security group for RDS PostgreSQL",
      allowAllOutbound: false,
    });

    const database = new rds.DatabaseInstance(this, "FitnessAppDB", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: "fitnessapp",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      deletionProtection: false,
      publiclyAccessible: false,
    });

    // Create ECS Cluster
    const cluster = new ecs.Cluster(this, "FitnessAppCluster", {
      vpc,
      clusterName: "fitness-app-cluster",
    });

    // Create log group for container logs
    const logGroup = new logs.LogGroup(this, "FitnessAppLogGroup", {
      logGroupName: "/ecs/fitness-app",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Fargate service with ALB
    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "FitnessAppService",
        {
          cluster,
          serviceName: "fitness-app-service",
          cpu: 512,
          memoryLimitMiB: 1024,
          desiredCount: 1,
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset("..", {
              file: "Dockerfile",
              exclude: ["cdk", "node_modules", ".git", ".next", "out"],
            }),
            containerPort: 3000,
            environment: {
              NODE_ENV: "production",
              NEXTAUTH_URL: "http://localhost:3000", // Will be updated after deployment
              DB_HOST: database.dbInstanceEndpointAddress,
              DB_PORT: database.dbInstanceEndpointPort,
              DB_NAME: "fitnessapp",
            },
            secrets: {
              NEXTAUTH_SECRET: ecs.Secret.fromSecretsManager(
                nextAuthSecret,
                "secret"
              ),
              DB_USER: ecs.Secret.fromSecretsManager(dbSecret, "username"),
              DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, "password"),
            },
            logDriver: ecs.LogDrivers.awsLogs({
              streamPrefix: "fitness-app",
              logGroup,
            }),
          },
          publicLoadBalancer: true,
          assignPublicIp: false,
        }
      );

    // Allow ECS tasks to connect to RDS
    dbSecurityGroup.addIngressRule(
      fargateService.service.connections.securityGroups[0],
      ec2.Port.tcp(5432),
      "Allow ECS tasks to connect to RDS"
    );

    // Configure health check
    fargateService.targetGroup.configureHealthCheck({
      path: "/api/health",
      interval: cdk.Duration.seconds(60),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // Auto-scaling configuration
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Outputs
    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: "Load Balancer DNS Name",
      exportName: "FitnessAppLoadBalancerDNS",
    });

    new cdk.CfnOutput(this, "ServiceURL", {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
      description: "Fitness App URL",
      exportName: "FitnessAppURL",
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: database.dbInstanceEndpointAddress,
      description: "RDS Database Endpoint",
      exportName: "FitnessAppDatabaseEndpoint",
    });

    new cdk.CfnOutput(this, "DatabaseSecretArn", {
      value: dbSecret.secretArn,
      description: "Database Credentials Secret ARN",
      exportName: "FitnessAppDatabaseSecretArn",
    });

    new cdk.CfnOutput(this, "ClusterName", {
      value: cluster.clusterName,
      description: "ECS Cluster Name",
      exportName: "FitnessAppClusterName",
    });
  }
}
