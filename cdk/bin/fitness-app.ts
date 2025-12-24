#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FitnessAppStack } from "../lib/fitness-app-stack";

const app = new cdk.App();

new FitnessAppStack(app, "FitnessAppStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  description:
    "Fitness App - Next.js application on ECS Fargate with RDS PostgreSQL",
});

app.synth();
