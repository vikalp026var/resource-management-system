import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { BackendInfraStack } from "./backend-infra";
import { FrontendInfraStack } from "./frontend-infra";

export interface RmsAppStageProps extends cdk.StageProps {
  readonly stage: string;
}

export class RmsAppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: RmsAppStageProps) {
    super(scope, id, props);

    const backendStack = new BackendInfraStack(
      this,
      `RmsBackendStack-${props.stage}`,
      {
        stage: props.stage,
        env: props.env,
      },
    );

    new FrontendInfraStack(this, `RmsFrontendStack-${props.stage}`, {
      stage: props.stage,
      backendStack: backendStack,
      env: props.env,
    });
  }
}
