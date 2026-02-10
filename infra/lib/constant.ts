export const AWS_ACCOUNT_ID = 372867009989;
export const AWS_REGION = "ap-south-1";
export const ENVIRONMENT = "development";

export const GITHUB_OWNER = "vikalp026var";
export const GITHUB_REPO = "resource-management-system";
export const GITHUB_BRANCH = "main";
export const GITHUB_CONNECTION_ARN =
  "rn:aws:codeconnections:ap-south-1:372867009989:connection/88d59c3e-295e-4bc2-a130-a4c991243be3";

export const InstanceTypes: { [key: string]: string } = {
  development: "t3.small",
  production: "t3.small",
};

export const AutoScalingMaxConf: { [key: string]: string } = {
  development: "2",
  production: "5",
};

export const ECSConfig: {
  [key: string]: { cpu: number; memory: number; desiredCount: number };
} = {
  development: { cpu: 256, memory: 512, desiredCount: 1 },
  production: { cpu: 512, memory: 1024, desiredCount: 2 },
};
