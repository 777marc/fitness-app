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

    // Look up existing VPC or create a new one
    // To use an existing VPC, set the VPC_ID environment variable or context value
    const vpcId = process.env.VPC_ID || "vpc-0c32ccef46a5aa87b"; //this.node.tryGetContext("vpcId");

    let vpc: ec2.IVpc;
    if (vpcId) {
      // Use existing VPC
      vpc = ec2.Vpc.fromLookup(this, "ExistingVpc", {
        vpcId: vpcId,
      });
      console.log(`Using existing VPC: ${vpcId}`);
    } else {
      // Create new VPC with public and private subnets
      vpc = new ec2.Vpc(this, "FitnessAppVpc", {
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
      console.log("Created new VPC");
    }

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

    // Determine subnet selection based on VPC type
    let dbSubnets: ec2.SubnetSelection;
    if (vpcId) {
      // For existing VPCs, try to use the best available subnet type
      const hasIsolatedSubnets = vpc.isolatedSubnets.length > 0;
      const hasPrivateSubnets = vpc.privateSubnets.length > 0;
      const hasPublicSubnets = vpc.publicSubnets.length > 0;

      if (hasIsolatedSubnets) {
        dbSubnets = { subnetType: ec2.SubnetType.PRIVATE_ISOLATED };
        console.log("Using isolated subnets for database");
      } else if (hasPrivateSubnets) {
        dbSubnets = { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS };
        console.log("Using private subnets for database");
      } else if (hasPublicSubnets) {
        // Last resort: use public subnets (not recommended for production)
        dbSubnets = { subnetType: ec2.SubnetType.PUBLIC };
        console.warn(
          "WARNING: Using public subnets for database. This is not recommended for production!"
        );
      } else {
        throw new Error(
          "VPC has no suitable subnets. Please use a VPC with private or isolated subnets."
        );
      }
    } else {
      // For newly created VPCs, use isolated subnets
      dbSubnets = {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      };
    }

    const database = new rds.DatabaseInstance(this, "FitnessAppDB", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: dbSubnets,
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

    // Determine if we need to assign public IPs to ECS tasks
    const needsPublicIp = vpcId && vpc.privateSubnets.length === 0;
    if (needsPublicIp) {
      console.log(
        "ECS tasks will be assigned public IPs (VPC has no private subnets)"
      );
    }

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
          // Assign public IP if using public subnets, otherwise don't
          assignPublicIp: needsPublicIp,
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
