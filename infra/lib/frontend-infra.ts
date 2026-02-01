import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { BackendInfraStack } from "./backend-infra";

interface FrontendInfraStackProps extends cdk.StackProps {
  stage: string;
  backendStack: BackendInfraStack;
}

export class FrontendInfraStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: FrontendInfraStackProps) {
    super(scope, id, props);

    const environment = props.stage;
    const backendUrl = `http://${props.backendStack.backendService.loadBalancer.loadBalancerDnsName}`;

    this.bucket = new s3.Bucket(this, "RMSFrontendBucket", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        environment === "production"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== "production",
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });
    this.distribution = new cloudfront.Distribution(this, "RMSDistribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      sources: [s3deploy.Source.asset("../frontend/dist")],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "FrontendURL", {
      value: `https://${this.distribution.distributionDomainName}`,
      description: "Frontend CloudFront Distribution URL",
      exportName: `${id}-FrontendURL`,
    });

    new cdk.CfnOutput(this, "BackendURL", {
      value: backendUrl,
      description: "Backend API URL",
      exportName: `${id}-BackendURL`,
    });
  }
}
