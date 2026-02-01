#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { RmsPipelineStack } from "../lib/rms-app-infra";
import "source-map-support/register";
import * as constants from "../lib/constant";

const account = constants.AWS_ACCOUNT_ID.toString();
const region = constants.AWS_REGION.toString();

if (!account || !region) {
  throw new Error(
    "Missing required environment variables: AWS_ACCOUNT_ID, AWS_REGION",
  );
}

const app = new cdk.App();

// Pipeline stack (deploys other stacks)
new RmsPipelineStack(app, "RmsPipelineStack", {
  env: {
    account: account,
    region: region,
  },
  description: "RMS Infrastructure Pipeline",
  tags: {
    Project: "Rms",
    ManagedBy: "CDK-Pipeline",
  },
});

app.synth();
