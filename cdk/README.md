# AWS CDK Deployment Guide - Fitness App

This guide will help you deploy the Fitness App to AWS using ECS Fargate with a PostgreSQL RDS database.

## Architecture Overview

The CDK stack creates:

- **VPC**: Multi-AZ VPC with public, private, and isolated subnets (or uses an existing VPC)
- **ECS Fargate**: Containerized Next.js application
- **Application Load Balancer**: Public-facing load balancer
- **RDS PostgreSQL**: Managed database in isolated subnets
- **Secrets Manager**: Secure storage for credentials
- **CloudWatch**: Container and application logs
- **Auto-scaling**: CPU and memory-based scaling (1-4 tasks)

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured:
   ```bash
   aws configure
   ```
3. **Node.js** 20+ installed
4. **Docker** installed and running
5. **AWS CDK CLI** installed globally:
   ```bash
   npm install -g aws-cdk
   ```

## Configuration Options

### Using an Existing VPC

By default, the stack creates a new VPC. To use an existing VPC instead, provide the VPC ID using either:

**Option 1: Environment Variable**

```bash
export VPC_ID=vpc-xxxxxxxxxxxxxxxxx
npm run deploy
```

**Option 2: CDK Context**

```bash
cdk deploy -c vpcId=vpc-xxxxxxxxxxxxxxxxx
```

**Option 3: cdk.context.json**
Create or edit `cdk.context.json`:

```json
{
  "vpcId": "vpc-xxxxxxxxxxxxxxxxx"
}
```

> **Note**: When using an existing VPC, ensure it has:
>
> - At least 2 availability zones
> - Public subnets (for the load balancer)
> - Private subnets with NAT gateway access (for ECS tasks)
> - Isolated subnets (for RDS database)

## Initial Setup

1. **Bootstrap your AWS environment** (one-time per account/region):

   ```bash
   cd cdk
   cdk bootstrap
   ```

2. **Install CDK dependencies**:

   ```bash
   npm install
   ```

3. **Build the CDK app**:
   ```bash
   npm run build
   ```

## Deployment Steps

### 1. Review the Stack

Preview the resources that will be created:

```bash
npm run synth
```

Check the differences before deployment:

```bash
npm run diff
```

### 2. Deploy the Stack

Deploy all infrastructure:

```bash
npm run deploy
```

This will:

- Create VPC and networking resources
- Set up RDS PostgreSQL database
- Build and push Docker image to ECR
- Create ECS cluster and Fargate service
- Configure Application Load Balancer
- Set up auto-scaling policies

The deployment typically takes 10-15 minutes.

### 3. Configure Environment Variables

After deployment, you'll receive outputs including:

- `LoadBalancerDNS`: The ALB DNS name
- `ServiceURL`: Your application URL
- `DatabaseEndpoint`: RDS endpoint
- `DatabaseSecretArn`: Credentials location

**Important**: Update the `NEXTAUTH_URL` environment variable in the stack:

1. Edit `cdk/lib/fitness-app-stack.ts`
2. Replace the placeholder URL:
   ```typescript
   NEXTAUTH_URL: 'http://your-load-balancer-dns',
   ```
3. Redeploy:
   ```bash
   npm run deploy
   ```

### 4. Run Database Migrations

Run Prisma migrations on the deployed database:

```bash
cd cdk/scripts
chmod +x deploy.sh
./deploy.sh
```

This script will:

- Fetch database credentials from Secrets Manager
- Run Prisma migrations
- Optionally seed the database

**Alternative manual approach**:

```bash
# Get DB credentials from Secrets Manager
DB_SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name FitnessAppStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
  --output text)

# Retrieve credentials
aws secretsmanager get-secret-value --secret-id "$DB_SECRET_ARN"

# Set DATABASE_URL and run migrations
export DATABASE_URL="postgresql://username:password@endpoint:5432/fitnessapp"
cd ../..
npx prisma migrate deploy
```

### 5. Verify Deployment

Check the health endpoint:

```bash
LOAD_BALANCER=$(aws cloudformation describe-stacks \
  --stack-name FitnessAppStack \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

curl http://$LOAD_BALANCER/api/health
```

Access your application:

```bash
open http://$LOAD_BALANCER
```

## Monitoring

### View Logs

```bash
aws logs tail /ecs/fitness-app --follow
```

### Check Service Status

```bash
aws ecs describe-services \
  --cluster fitness-app-cluster \
  --services fitness-app-service
```

### View Metrics

Navigate to CloudWatch in AWS Console to view:

- Container CPU/Memory utilization
- Request count and latency
- Error rates

## Updating the Application

1. Make code changes
2. Redeploy:
   ```bash
   cd cdk
   npm run deploy
   ```

CDK will automatically:

- Rebuild the Docker image
- Push to ECR
- Update the ECS service with zero-downtime deployment

## Custom Domain (Optional)

To use a custom domain:

1. Add Route53 hosted zone and certificate in the stack
2. Update the ALB listener with HTTPS
3. Configure NEXTAUTH_URL with your domain

## Cost Optimization

Current configuration costs approximately **$30-50/month**:

- RDS db.t4g.micro: ~$15/month
- NAT Gateway: ~$32/month
- Fargate (512 CPU, 1GB RAM): ~$15/month
- ALB: ~$16/month

**To reduce costs**:

- Use Aurora Serverless v2 instead of RDS
- Remove NAT Gateway (public subnet only)
- Reduce Fargate resources

## Cleanup

To destroy all resources:

```bash
npm run destroy
```

⚠️ **Warning**: This will delete:

- All ECS tasks and services
- Load balancer
- Database (snapshot will be created)
- VPC and networking resources

## Troubleshooting

### Container fails to start

1. Check CloudWatch logs: `/ecs/fitness-app`
2. Verify environment variables in task definition
3. Check database connectivity

### Database connection issues

1. Verify security group rules
2. Check RDS endpoint availability
3. Validate credentials in Secrets Manager

### Health check failures

1. Ensure `/api/health` endpoint returns 200
2. Check container logs for errors
3. Verify port 3000 is exposed

## Production Recommendations

1. **Enable deletion protection** on RDS
2. **Increase backup retention** (currently 7 days)
3. **Add CloudWatch alarms** for critical metrics
4. **Enable AWS WAF** on the ALB
5. **Use HTTPS** with ACM certificate
6. **Configure custom domain** with Route53
7. **Implement CI/CD** with CodePipeline or GitHub Actions
8. **Enable VPC Flow Logs** for security analysis
9. **Use AWS Systems Manager** for secrets rotation
10. **Configure RDS Multi-AZ** for high availability

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy CDK
        run: |
          cd cdk
          npm install
          npm run deploy -- --require-approval never
```

## Support

For issues or questions:

1. Check AWS CloudWatch logs
2. Review ECS task events
3. Verify Secrets Manager configurations
4. Check VPC and security group settings
