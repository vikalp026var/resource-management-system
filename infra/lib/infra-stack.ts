import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as rds from "aws-cdk-lib/aws-rds";
import * as logs from "aws-cdk-lib/aws-logs";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = id.includes("production")
      ? "production"
      : "development";

    const vpc = new ec2.Vpc(this, "RmsVpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    // Database credentials secret - AWS best practice: use Secrets Manager
    const dbSecret = new secretsmanager.Secret(this, "RmsDbSecret", {
      secretName: `rms-db-credentials-${environment}`,
      description: `RMS Database credentials for ${environment} environment`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: "rmsadmin",
        }),
        generateStringKey: "password",
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32, // Strong password length
      },
    });

    // Security group for RDS - AWS best practice: least privilege
    const dbSecurityGroup = new ec2.SecurityGroup(this, "RmsDbSecurityGroup", {
      vpc,
      description: "Security group for RMS RDS database",
      allowAllOutbound: false, // Best practice: restrict outbound
    });

    // RDS PostgreSQL Database - AWS best practices applied
    const database = new rds.DatabaseInstance(this, "RMSDatabase", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15, // PostgreSQL 15 (latest 15.x)
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO, // Cost-effective for development
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Best practice: private subnets
      },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: "rmsdb",
      allocatedStorage: 20, // GB
      maxAllocatedStorage: 100, // Auto-scaling storage
      backupRetention:
        environment === "production"
          ? cdk.Duration.days(7)
          : cdk.Duration.days(1), // Cost optimization for dev
      deletionProtection: environment === "production", // Protect production
      removalPolicy:
        environment === "production"
          ? cdk.RemovalPolicy.SNAPSHOT
          : cdk.RemovalPolicy.DESTROY, // Cost optimization for dev
      multiAz: environment === "production", // High availability for production only
      storageEncrypted: true, // Best practice: encrypt at rest
      enablePerformanceInsights: environment === "production", // Monitoring for production
      cloudwatchLogsExports: ["postgresql"], // Enable PostgreSQL logs
      autoMinorVersionUpgrade: true, // Security: auto-update minor versions
    });

    // ECS Cluster - AWS best practice: enable Container Insights
    const cluster = new ecs.Cluster(this, "RMSCluster", {
      vpc,
      containerInsights: true, // Enable CloudWatch Container Insights
      enableFargateCapacityProviders: true, // Best practice for Fargate
    });

    // Security group for backend service
    const backendSecurityGroup = new ec2.SecurityGroup(
      this,
      "RmsBackendSecurityGroup",
      {
        vpc,
        description: "Security group for RMS backend service",
        allowAllOutbound: true,
      },
    );

    // Allow backend to access database - AWS best practice: security group rules
    dbSecurityGroup.addIngressRule(
      backendSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access from backend service",
    );

    // Backend API Service (Fargate) - AWS best practices applied
    const backendService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "RMSBackendService",
        {
          cluster,
          cpu: 256, // 0.25 vCPU
          memoryLimitMiB: 512, // 0.5 GB RAM
          desiredCount: environment === "production" ? 2 : 1, // High availability for production
          securityGroups: [backendSecurityGroup],
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset("../backend"),
            containerPort: 8000,
            environment: {
              ENVIRONMENT: environment,
              // Provide individual components - backend will construct DATABASE_URL
              DATABASE_HOST: database.dbInstanceEndpointAddress,
              DATABASE_PORT: database.dbInstanceEndpointPort,
              DATABASE_NAME: "rmsdb",
              DATABASE_USERNAME: "rmsadmin",
            },
            secrets: {
              // Store password securely from Secrets Manager
              DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(
                dbSecret,
                "password",
              ),
            },
            logDriver: ecs.LogDrivers.awsLogs({
              streamPrefix: "rms-backend",
              logRetention: logs.RetentionDays.ONE_WEEK,
            }),
          },
          publicLoadBalancer: true,
          healthCheckGracePeriod: cdk.Duration.seconds(60), // Allow time for startup
        },
      );

    // Grant backend service access to database secret (after service is created)
    dbSecret.grantRead(backendService.taskDefinition.executionRole!);

    // Health check configuration - AWS best practice
    backendService.targetGroup.configureHealthCheck({
      path: "/auth/ping-db",
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    const frontendBucket = new s3.Bucket(this, "RMSFrontendBucket", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, "RMSDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      sources: [s3deploy.Source.asset("../frontend/dist")],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // Outputs - AWS best practice: provide useful deployment information
    new cdk.CfnOutput(this, "BackendURL", {
      value: `http://${backendService.loadBalancer.loadBalancerDnsName}`,
      description: "Backend API URL (HTTP - use HTTPS in production)",
      exportName: `${id}-BackendURL`,
    });

    new cdk.CfnOutput(this, "FrontendURL", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Frontend CloudFront Distribution URL",
      exportName: `${id}-FrontendURL`,
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: database.dbInstanceEndpointAddress,
      description: "RDS PostgreSQL Database Endpoint",
      exportName: `${id}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, "DatabasePort", {
      value: database.dbInstanceEndpointPort,
      description: "RDS PostgreSQL Database Port",
    });

    new cdk.CfnOutput(this, "DatabaseSecretArn", {
      value: dbSecret.secretArn,
      description: "ARN of the database credentials secret in Secrets Manager",
      exportName: `${id}-DatabaseSecretArn`,
    });

    new cdk.CfnOutput(this, "DatabaseConnectionInfo", {
      value: `postgresql://rmsadmin@${database.dbInstanceEndpointAddress}:${database.dbInstanceEndpointPort}/rmsdb`,
      description:
        "Database connection string template (password in Secrets Manager)",
    });
  }
}
