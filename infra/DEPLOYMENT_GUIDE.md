# AWS Infrastructure Deployment Guide

## 🎯 Overview

This guide covers deploying the RMS infrastructure to AWS using CDK, following AWS best practices.

## 📋 Prerequisites

1. **AWS Account** configured with credentials
2. **AWS CLI** installed and configured
3. **Node.js** (v18+) and npm installed
4. **Docker** installed (for building backend image)
5. **CDK CLI** installed globally: `npm install -g aws-cdk`

## 🚀 Step-by-Step Deployment

### 1. Configure Environment

Create `infra/.env` file:

```bash
AWS_ACCOUNT_ID=372867009989
AWS_REGION=ap-south-1
ENVIRONMENT=development
```

### 2. Bootstrap CDK (One-time per account/region)

```bash
cd infra
cdk bootstrap aws://372867009989/ap-south-1
```

### 3. Install Dependencies

```bash
cd infra
npm install
```

### 4. Build Frontend (Required before deployment)

```bash
cd ../frontend
npm install
npm run build
# This creates frontend/dist folder
```

### 5. Preview Changes

```bash
cd infra
cdk diff
```

This shows what resources will be created/modified.

### 6. Deploy Infrastructure

```bash
cdk deploy
```

**Approval Required**: CDK will prompt for approval before creating resources.

**Deployment Time**: ~20-30 minutes (RDS takes longest)

### 7. Get Deployment Outputs

After deployment, CDK outputs will show:

- `BackendURL` - Your backend API endpoint
- `FrontendURL` - Your frontend CloudFront URL
- `DatabaseEndpoint` - RDS PostgreSQL endpoint
- `DatabasePort` - Database port (5432)
- `DatabaseSecretArn` - Secrets Manager ARN for credentials

## 🔍 Verifying Database Connection via AWS CLI

### 1. Get Database Endpoint

```bash
aws cloudformation describe-stacks \
  --stack-name RmsInfraStack-development \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text
```

### 2. Get Database Credentials from Secrets Manager

```bash
# Get the secret ARN from stack outputs
SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name RmsInfraStack-development \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
  --output text)

# Retrieve the secret
aws secretsmanager get-secret-value \
  --secret-id $SECRET_ARN \
  --query SecretString \
  --output text | jq .
```

Output will look like:

```json
{
  "username": "rmsadmin",
  "password": "generated-password-here"
}
```

### 3. Test Database Connection

**Option A: Using psql (if installed locally)**

```bash
# Extract credentials
DB_HOST=$(aws cloudformation describe-stacks \
  --stack-name RmsInfraStack-development \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id $SECRET_ARN \
  --query SecretString \
  --output text | jq -r .password)

# Connect to database
psql -h $DB_HOST -U rmsadmin -d rmsdb -p 5432
# Enter password when prompted: $DB_PASSWORD
```

**Option B: Using AWS Systems Manager Session Manager**

```bash
# Connect to ECS task (if backend is running)
aws ecs list-tasks --cluster RMSCluster-development

# Or use AWS RDS Query Editor (in AWS Console)
# Navigate to: RDS → Query Editor → Connect to database
```

**Option C: Test via Backend API**

```bash
# Get backend URL
BACKEND_URL=$(aws cloudformation describe-stacks \
  --stack-name RmsInfraStack-development \
  --query 'Stacks[0].Outputs[?OutputKey==`BackendURL`].OutputValue' \
  --output text)

# Test database connection endpoint
curl $BACKEND_URL/auth/ping-db
# Should return: {"ok": true}
```

## 🏗️ AWS Best Practices Implemented

### ✅ Security

- **Secrets Manager**: Database credentials stored securely
- **Private Subnets**: RDS in private subnets (no public access)
- **Security Groups**: Least privilege access rules
- **Encryption**: RDS encrypted at rest
- **IAM Roles**: Proper role-based access for ECS tasks

### ✅ High Availability

- **Multi-AZ**: Enabled for production (disabled for dev to save costs)
- **Auto Scaling**: Storage auto-scales up to 100GB
- **Backup Retention**: 7 days for production, 1 day for dev
- **Health Checks**: Configured for ECS service

### ✅ Monitoring & Logging

- **CloudWatch Logs**: PostgreSQL logs exported
- **Container Insights**: Enabled for ECS cluster
- **Performance Insights**: Enabled for production RDS
- **Log Retention**: 1 week for CloudWatch logs

### ✅ Cost Optimization

- **Development**: Single AZ, minimal resources
- **Production**: Multi-AZ, proper scaling
- **Auto Scaling**: Storage scales automatically
- **Resource Cleanup**: Auto-delete for dev environment

### ✅ Operational Excellence

- **Infrastructure as Code**: All resources defined in CDK
- **Environment Separation**: Dev/Prod environments
- **Tagging**: Resources tagged for management
- **Outputs**: Useful information exported

## 📊 Resource Costs (ap-south-1 Mumbai)

### Development Environment (~₹2,500/month)

| Service         | Configuration    | Monthly Cost |
| --------------- | ---------------- | ------------ |
| RDS t3.micro    | Single AZ, 20GB  | ₹1,200       |
| ECS Fargate     | 0.25 vCPU, 0.5GB | ₹800         |
| ALB             | Load Balancer    | ₹1,500       |
| NAT Gateway     | 1 gateway        | ₹3,000       |
| S3 + CloudFront | Static hosting   | ₹200         |
| **Total**       |                  | **₹6,700**   |

**Note**: First 12 months may qualify for AWS Free Tier discounts.

### Production Environment (~₹8,000/month)

- Multi-AZ RDS: +₹1,200
- 2x ECS tasks: +₹800
- Additional monitoring: +₹300

## 🔧 Troubleshooting

### Database Connection Issues

1. **Check Security Groups**:

```bash
aws ec2 describe-security-groups \
  --filters "Name=tag:aws:cloudformation:stack-name,Values=RmsInfraStack-development"
```

2. **Check RDS Status**:

```bash
aws rds describe-db-instances \
  --db-instance-identifier RmsInfraStack-developmentRMSDatabase*
```

3. **Check ECS Task Logs**:

```bash
aws logs tail /aws/ecs/rms-backend --follow
```

### Common Issues

**Issue**: `cdk deploy` fails with "VPC not found"

- **Solution**: Ensure you're in the correct region (ap-south-1)

**Issue**: Database connection timeout

- **Solution**: Check security group rules allow port 5432 from ECS security group

**Issue**: Frontend not loading

- **Solution**: Ensure `frontend/dist` folder exists (run `npm run build`)

## 🗑️ Cleanup (Destroy Resources)

**⚠️ WARNING**: This will delete ALL resources including the database!

```bash
cd infra
cdk destroy
```

For production, you may want to create a snapshot first:

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier <instance-id> \
  --db-snapshot-identifier rms-backup-$(date +%Y%m%d)
```

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/intro.html)
- [Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)

## ✅ Verification Checklist

After deployment, verify:

- [ ] RDS instance is running and accessible
- [ ] Database credentials retrieved from Secrets Manager
- [ ] Backend API responds at `/auth/ping-db`
- [ ] Frontend loads at CloudFront URL
- [ ] ECS tasks are running and healthy
- [ ] CloudWatch logs are being generated
- [ ] Security groups are properly configured

---

**Last Updated**: 2024
**Maintained By**: RMS Infrastructure Team
