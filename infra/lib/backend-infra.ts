import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as rds from "aws-cdk-lib/aws-rds";
import * as logs from "aws-cdk-lib/aws-logs";
import * as constants from "./constant";

interface BackendInfraStackProps extends cdk.StackProps {
  stage: string;
}

export class BackendInfraStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly database: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly backendService: ecsPatterns.ApplicationLoadBalancedFargateService;
  public readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: BackendInfraStackProps) {
    super(scope, id, props);

    const environment = props.stage;

    this.vpc = new ec2.Vpc(this, "RmsVpc", {
      maxAzs: 2,
      natGateways: environment === "production" ? 2 : 1,
    });

    this.dbSecret = new secretsmanager.Secret(this, "RmsDbSecret", {
      secretName: `rms-db-credentials-${environment}`,
      description: `RMS Database credentials for ${environment} environment`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: "rmsadmin",
        }),
        generateStringKey: "password",
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, "RmsDbSecurityGroup", {
      vpc: this.vpc,
      description: "Security group for RMS RDS database",
      allowAllOutbound: false,
    });

    this.database = new rds.DatabaseInstance(this, "RMSDatabase", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        environment === "production"
          ? ec2.InstanceSize.SMALL
          : ec2.InstanceSize.MICRO,
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: "rmsdb",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention:
        environment === "production"
          ? cdk.Duration.days(7)
          : cdk.Duration.days(1),
      deletionProtection: environment === "production",
      removalPolicy:
        environment === "production"
          ? cdk.RemovalPolicy.SNAPSHOT
          : cdk.RemovalPolicy.DESTROY,
      multiAz: environment === "production",
      storageEncrypted: true,
      enablePerformanceInsights: environment === "production",
      cloudwatchLogsExports: ["postgresql"],
      autoMinorVersionUpgrade: true,
    });

    this.cluster = new ecs.Cluster(this, "RMSCluster", {
      vpc: this.vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    const backendSecurityGroup = new ec2.SecurityGroup(
      this,
      "RmsBackendSecurityGroup",
      {
        vpc: this.vpc,
        description: "Security group for RMS backend service",
        allowAllOutbound: true,
      },
    );

    dbSecurityGroup.addIngressRule(
      backendSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access from backend service",
    );

    const ecsConfig =
      constants.ECSConfig[environment] || constants.ECSConfig.development;

    this.backendService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      "RMSBackendService",
      {
        cluster: this.cluster,
        cpu: ecsConfig.cpu,
        memoryLimitMiB: ecsConfig.memory,
        desiredCount: ecsConfig.desiredCount,
        securityGroups: [backendSecurityGroup],
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset("../backend"),
          containerPort: 8000,
          environment: {
            ENVIRONMENT: environment,
            DATABASE_HOST: this.database.dbInstanceEndpointAddress,
            DATABASE_PORT: this.database.dbInstanceEndpointPort,
            DATABASE_NAME: "rmsdb",
            DATABASE_USERNAME: "rmsadmin",
          },
          secrets: {
            DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(
              this.dbSecret,
              "password",
            ),
          },
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: "rms-backend",
            logRetention: logs.RetentionDays.ONE_WEEK,
          }),
        },
        publicLoadBalancer: true,
        healthCheckGracePeriod: cdk.Duration.seconds(60),
      },
    );
    this.dbSecret.grantRead(this.backendService.taskDefinition.executionRole!);

    this.backendService.targetGroup.configureHealthCheck({
      path: "/auth/ping-db",
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    new cdk.CfnOutput(this, "BackendURL", {
      value: `http://${this.backendService.loadBalancer.loadBalancerDnsName}`,
      description: "Backend API URL",
      exportName: `${id}-BackendURL`,
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: this.database.dbInstanceEndpointAddress,
      description: "RDS PostgreSQL Database Endpoint",
      exportName: `${id}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, "DatabaseSecretArn", {
      value: this.dbSecret.secretArn,
      description: "ARN of the database credentials secret",
      exportName: `${id}-DatabaseSecretArn`,
    });
  }
}
