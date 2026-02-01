import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  ManualApprovalStep,
} from "aws-cdk-lib/pipelines";
import * as iam from "aws-cdk-lib/aws-iam";
import { RmsAppStage } from "./rms-app-stage-infra";
import * as constants from "./constant";
import { LinuxBuildImage, ComputeType } from "aws-cdk-lib/aws-codebuild";

export class RmsPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Add default tags
    cdk.Tags.of(this).add("cost-category", "rms-infrastructure");
    cdk.Tags.of(this).add("cost-name", "rms-pipeline");
    cdk.Tags.of(this).add("ManagedBy", "CDK-Pipeline");

    const stages = ["development", "production"];

    // Determine source - GitHub or CodeCommit
    const source = constants.GITHUB_CONNECTION_ARN
      ? CodePipelineSource.connection(
          `${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}`,
          constants.GITHUB_BRANCH,
          {
            connectionArn: constants.GITHUB_CONNECTION_ARN,
          },
        )
      : CodePipelineSource.gitHub(
          `${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}`,
          constants.GITHUB_BRANCH,
        );

    // Create pipeline
    const pipeline = new CodePipeline(this, "RmsPipeline", {
      pipelineName: "RmsInfrastructurePipeline",
      synth: new ShellStep("Synth", {
        input: source,
        commands: [
          // Install Python dependencies (if needed)
          "python3 --version",

          // Build frontend
          "cd frontend",
          "npm ci",
          "npm run build",
          "cd ..",

          // Verify frontend build exists
          '[ -d "frontend/dist" ] && echo "Frontend build directory exists." || { echo "Frontend build directory does not exist."; exit 1; }',

          // Install CDK dependencies
          "cd infra",
          "npm ci",
          "npm run build",

          // Synthesize CDK
          "npx cdk synth",
        ],
      }),
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: LinuxBuildImage.STANDARD_7_0,
          computeType: ComputeType.MEDIUM,
          environmentVariables: {
            NODE_OPTIONS: { value: "--max_old_space_size=2048" },
          },
        },
        rolePolicy: [
          new iam.PolicyStatement({
            actions: [
              // ECS permissions
              "ecs:CreateCluster",
              "ecs:CreateService",
              "ecs:UpdateService",
              "ecs:DescribeServices",
              "ecs:RegisterTaskDefinition",

              // ECR permissions
              "ecr:GetAuthorizationToken",
              "ecr:BatchCheckLayerAvailability",
              "ecr:GetDownloadUrlForLayer",
              "ecr:BatchGetImage",
              "ecr:PutImage",

              // RDS permissions
              "rds:CreateDBInstance",
              "rds:DescribeDBInstances",
              "rds:ModifyDBInstance",

              // VPC/EC2 permissions
              "ec2:CreateSecurityGroup",
              "ec2:DescribeSecurityGroups",
              "ec2:AuthorizeSecurityGroupIngress",
              "ec2:AuthorizeSecurityGroupEgress",
              "ec2:DescribeVpcs",
              "ec2:DescribeSubnets",
              "ec2:DescribeAvailabilityZones",

              // S3 permissions
              "s3:PutObject",
              "s3:GetObject",
              "s3:CreateBucket",
              "s3:ListBucket",

              // CloudFront permissions
              "cloudfront:CreateDistribution",
              "cloudfront:GetDistribution",
              "cloudfront:UpdateDistribution",
              "cloudfront:CreateInvalidation",

              // Secrets Manager
              "secretsmanager:CreateSecret",
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret",

              // IAM permissions
              "iam:CreateRole",
              "iam:PutRolePolicy",
              "iam:PassRole",
              "iam:AttachRolePolicy",

              // CloudWatch Logs
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            resources: ["*"],
          }),
        ],
      },
    });

    // Add stages
    for (const stage of stages) {
      const approvalStep =
        stage === "production"
          ? [new ManualApprovalStep("PromoteToProduction")]
          : [];

      pipeline.addStage(
        new RmsAppStage(this, stage, {
          env: {
            account: constants.AWS_ACCOUNT_ID.toString(),
            region: constants.AWS_REGION.toString(),
          },
          stage: stage,
        }),
        { pre: approvalStep },
      );
    }
  }
}
