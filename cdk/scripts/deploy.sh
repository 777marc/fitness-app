#!/bin/bash

# Fitness App - ECS Fargate Deployment Script
# This script handles database migrations and environment setup

set -e

echo "Starting Fitness App deployment..."

# Get the database URL from AWS Secrets Manager
DB_SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name FitnessAppStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
  --output text)

# Retrieve database credentials
DB_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id "$DB_SECRET_ARN" \
  --query 'SecretString' \
  --output text)

DB_USERNAME=$(echo "$DB_SECRET" | jq -r '.username')
DB_PASSWORD=$(echo "$DB_SECRET" | jq -r '.password')

# Get database endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name FitnessAppStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

# Construct database URL
export DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:5432/fitnessapp"

echo "Database URL configured"

# Run Prisma migrations
cd ..
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Optional: Run seeds
read -p "Do you want to seed the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Seeding database..."
    npx prisma db seed
fi

echo "Deployment preparation complete!"
echo "Your app will be available at:"
aws cloudformation describe-stacks \
  --stack-name FitnessAppStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ServiceURL`].OutputValue' \
  --output text
