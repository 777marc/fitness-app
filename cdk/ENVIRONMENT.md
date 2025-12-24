# Environment Variables for AWS Deployment

## Required Environment Variables

The following environment variables are automatically configured by the CDK stack:

### Application Variables

- `NODE_ENV=production` - Sets Node.js environment
- `NEXTAUTH_URL` - **MUST BE UPDATED** after first deployment with Load Balancer DNS
- `NEXTAUTH_SECRET` - Auto-generated via AWS Secrets Manager

### Database Variables

- `DATABASE_URL` - Auto-configured from RDS instance and Secrets Manager

## Post-Deployment Configuration

After your first deployment:

1. Get your Load Balancer DNS:

   ```bash
   aws cloudformation describe-stacks \
     --stack-name FitnessAppStack \
     --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
     --output text
   ```

2. Update `NEXTAUTH_URL` in `cdk/lib/fitness-app-stack.ts`:

   ```typescript
   NEXTAUTH_URL: 'http://your-alb-dns-here.us-east-1.elb.amazonaws.com',
   ```

3. Redeploy:
   ```bash
   cd cdk
   npm run deploy
   ```

## Managing Secrets

### View Secrets

```bash
# NextAuth Secret
aws secretsmanager get-secret-value --secret-id fitness-app/nextauth-secret

# Database Credentials
aws secretsmanager get-secret-value --secret-id fitness-app/db-credentials
```

### Update Secrets

```bash
aws secretsmanager update-secret \
  --secret-id fitness-app/nextauth-secret \
  --secret-string '{"secret":"your-new-secret-here"}'
```

### Rotate Secrets

AWS Secrets Manager supports automatic rotation. Configure in the AWS Console:

1. Go to Secrets Manager
2. Select your secret
3. Enable automatic rotation
4. Configure rotation Lambda function

## Additional Environment Variables (Optional)

If you need additional environment variables:

1. Add to the CDK stack (`cdk/lib/fitness-app-stack.ts`):

   ```typescript
   environment: {
     NODE_ENV: 'production',
     NEXTAUTH_URL: 'http://your-url',
     YOUR_NEW_VAR: 'value',
   },
   ```

2. Or use Secrets Manager for sensitive values:
   ```typescript
   secrets: {
     YOUR_SECRET: ecs.Secret.fromSecretsManager(yourSecret),
   },
   ```

## Environment-Specific Configuration

To deploy to multiple environments (dev, staging, prod):

1. Create separate stacks in `cdk/bin/fitness-app.ts`:

   ```typescript
   new FitnessAppStack(app, 'FitnessAppDev', { ... });
   new FitnessAppStack(app, 'FitnessAppProd', { ... });
   ```

2. Deploy specific stack:
   ```bash
   cdk deploy FitnessAppDev
   cdk deploy FitnessAppProd
   ```
