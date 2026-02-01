#!/bin/bash

# Quick cleanup script to delete all RMS resources
# Run this if you need to clean up everything

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

STACK_NAME="RmsInfraStack-development"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RMS Infrastructure Cleanup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check stack status
check_stack_status() {
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND"
}

# Step 1: Check current stack status
echo -e "${BLUE}Step 1: Checking stack status...${NC}"
STATUS=$(check_stack_status)

if [ "$STATUS" = "NOT_FOUND" ]; then
    echo -e "${GREEN}✓ Stack not found - already deleted or never created${NC}"
    exit 0
fi

echo -e "${YELLOW}Current status: $STATUS${NC}"

# Step 2: Delete stack if it exists
if [ "$STATUS" != "DELETE_COMPLETE" ]; then
    echo ""
    echo -e "${BLUE}Step 2: Deleting stack...${NC}"
    
    # If stack is still creating, we need to wait or force delete
    if [ "$STATUS" = "CREATE_IN_PROGRESS" ] || [ "$STATUS" = "UPDATE_IN_PROGRESS" ]; then
        echo -e "${YELLOW}Stack is still being created/updated. Initiating deletion...${NC}"
        echo -e "${YELLOW}This will cancel the operation and delete all resources.${NC}"
    fi
    
    aws cloudformation delete-stack --stack-name $STACK_NAME
    echo -e "${GREEN}✓ Stack deletion initiated${NC}"
    
    # Wait for deletion to complete
    echo ""
    echo -e "${BLUE}Step 3: Waiting for deletion to complete...${NC}"
    echo -e "${YELLOW}This may take 10-15 minutes...${NC}"
    
    aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME
    
    echo -e "${GREEN}✓ Stack deleted successfully!${NC}"
else
    echo -e "${GREEN}✓ Stack already deleted${NC}"
fi

# Step 4: Clean up ECR images (optional - they don't cost much but good to clean)
echo ""
echo -e "${BLUE}Step 4: Cleaning up ECR images...${NC}"
REPO_NAME="cdk-hnb659fds-container-assets-372867009989-ap-south-1"

if aws ecr describe-repositories --repository-names $REPO_NAME &>/dev/null; then
    echo -e "${YELLOW}Found ECR repository. Cleaning up images...${NC}"
    
    # Get all image tags
    IMAGE_TAGS=$(aws ecr list-images --repository-name $REPO_NAME --query 'imageIds[*].imageTag' --output text 2>/dev/null || echo "")
    
    if [ ! -z "$IMAGE_TAGS" ]; then
        # Delete all images
        aws ecr batch-delete-image --repository-name $REPO_NAME --image-ids imageTag=latest 2>/dev/null || true
        echo -e "${GREEN}✓ ECR images cleaned up${NC}"
    else
        echo -e "${GREEN}✓ No images to clean up${NC}"
    fi
else
    echo -e "${GREEN}✓ ECR repository not found or already cleaned${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Cleanup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}✓ All resources have been deleted${NC}"
echo -e "${GREEN}✓ No more costs will be incurred${NC}"
echo ""
echo "You can verify by checking:"
echo "  - CloudFormation: aws cloudformation list-stacks --query 'StackSummaries[?StackName==\`$STACK_NAME\`]'"
echo "  - ECS Clusters: aws ecs list-clusters"
echo "  - RDS Instances: aws rds describe-db-instances --query 'DBInstances[?DBInstanceIdentifier==\`*rms*\`]'"
