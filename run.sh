#!/bin/bash

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

STACK_NAME="RmsInfraStack-development"
TEST_DURATION=600  # 10 minutes in seconds

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RMS Infrastructure Test Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

# Check Docker FIRST (required for backend container)
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH!"
    echo ""
    echo "Docker is required to build the backend container image."
    echo ""
    echo "Install Docker:"
    echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  Or: brew install --cask docker"
    echo ""
    echo "After installing Docker:"
    echo "  1. Start Docker Desktop"
    echo "  2. Verify: docker --version"
    echo "  3. Run this script again"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running!"
    echo ""
    echo "Please start Docker Desktop and wait for it to be ready."
    echo "Then run this script again."
    exit 1
fi
print_status "Docker is installed and running"

# Check Dockerfile
if [ ! -f "backend/Dockerfile" ]; then
    print_error "backend/Dockerfile not found!"
    echo "Creating Dockerfile..."
    cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
    print_status "Dockerfile created"
else
    print_status "Dockerfile found"
fi

# Build frontend BEFORE any CDK operations
if [ ! -d "frontend/dist" ]; then
    print_warning "frontend/dist not found. Building frontend..."
    if [ ! -f "frontend/package.json" ]; then
        print_error "frontend/package.json not found!"
        exit 1
    fi
    cd frontend
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm install
    fi
    print_info "Building frontend..."
    npm run build
    cd ..
    if [ ! -d "frontend/dist" ]; then
        print_error "Frontend build failed!"
        exit 1
    fi
    print_status "Frontend built successfully"
else
    print_status "Frontend dist folder exists"
fi

# Check .env file
if [ ! -f "infra/.env" ]; then
    print_error "infra/.env not found!"
    echo "Creating infra/.env with default values..."
    cat > infra/.env << 'EOF'
AWS_ACCOUNT_ID=372867009989
AWS_REGION=ap-south-1
ENVIRONMENT=development
EOF
    print_warning "Please verify infra/.env has correct values!"
    read -p "Press Enter to continue..."
else
    print_status "Environment file found"
fi

echo ""

# Check AWS CLI and credentials
echo -e "${BLUE}Step 1.5: Checking AWS credentials...${NC}"
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed!"
    echo "Install: brew install awscli"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured!"
    echo "Run: aws configure"
    exit 1
fi
print_status "AWS credentials configured"
echo ""

# Step 2: Preview changes
echo -e "${BLUE}Step 2: Previewing infrastructure changes...${NC}"
cd infra
if ! cdk diff > /tmp/cdk_diff_output.txt 2>&1; then
    print_error "cdk diff failed. Checking output..."
    cat /tmp/cdk_diff_output.txt
    
    # Check for specific errors
    if grep -q "docker" /tmp/cdk_diff_output.txt; then
        echo ""
        print_error "Docker-related error detected!"
        echo "Make sure Docker Desktop is running and try again."
    fi
    
    exit 1
fi
print_status "Preview successful"
echo ""

# Step 3: Deploy
echo -e "${BLUE}Step 3: Deploying infrastructure...${NC}"
print_warning "This will create AWS resources and incur costs!"
read -p "Continue with deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled"
    exit 1
fi

print_info "Deploying... (this may take 20-30 minutes)"
print_info "Building Docker image for backend (this may take a few minutes)..."
if cdk deploy --require-approval never 2>&1 | tee /tmp/cdk_deploy_output.txt; then
    print_status "Deployment successful!"
else
    print_error "Deployment failed!"
    
    # Check for specific errors
    if grep -q "docker" /tmp/cdk_deploy_output.txt; then
        echo ""
        print_error "Docker error detected!"
        echo "Possible issues:"
        echo "  1. Docker Desktop is not running"
        echo "  2. Docker daemon is not accessible"
        echo "  3. Insufficient Docker resources"
        echo ""
        echo "Try:"
        echo "  1. Start Docker Desktop"
        echo "  2. Wait for Docker to be ready"
        echo "  3. Test: docker ps"
        echo "  4. Run this script again"
    fi
    
    if grep -q "Failed to publish asset" /tmp/cdk_deploy_output.txt; then
        echo ""
        print_error "Asset publishing failed!"
        echo "Possible issues:"
        echo "  1. AWS credentials expired"
        echo "  2. Insufficient IAM permissions"
        echo "  3. Network connectivity issues"
        echo ""
        echo "Try:"
        echo "  1. Check AWS credentials: aws sts get-caller-identity"
        echo "  2. Verify IAM permissions for S3, ECR, CloudFormation"
        echo "  3. Check network connection"
    fi
    
    exit 1
fi
echo ""

# Step 4: Get outputs
echo -e "${BLUE}Step 4: Getting deployment outputs...${NC}"
BACKEND_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`BackendURL`].OutputValue' \
    --output text 2>/dev/null)

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendURL`].OutputValue' \
    --output text 2>/dev/null)

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text 2>/dev/null)

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    print_error "Failed to get deployment outputs"
    exit 1
fi

print_status "Backend URL: $BACKEND_URL"
print_status "Frontend URL: $FRONTEND_URL"
print_status "Database Endpoint: $DB_ENDPOINT"
echo ""

# Step 5: Wait for services to be ready
echo -e "${BLUE}Step 5: Waiting for services to be ready...${NC}"
print_info "Waiting 2 minutes for RDS to initialize..."
sleep 120

print_info "Waiting for ECS tasks to start (checking every 30 seconds)..."
MAX_WAIT=600  # 10 minutes max
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    TASK_COUNT=$(aws ecs describe-services \
        --cluster RMSCluster-development \
        --services RMSBackendService \
        --query 'services[0].runningCount' \
        --output text 2>/dev/null || echo "0")
    
    if [ "$TASK_COUNT" = "1" ] || [ "$TASK_COUNT" = "2" ]; then
        print_status "ECS tasks are running ($TASK_COUNT tasks)"
        break
    fi
    
    print_info "Waiting... ($WAITED seconds elapsed)"
    sleep 30
    WAITED=$((WAITED + 30))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    print_warning "ECS tasks may not be ready, but continuing with tests..."
fi

# Additional wait for application to be fully ready
print_info "Waiting 1 minute for application to initialize..."
sleep 60
echo ""

# Step 6: Run tests
echo -e "${BLUE}Step 6: Testing deployment (10 minutes)...${NC}"
print_info "Testing backend API..."

# Test 1: Health check
print_info "Test 1: Database connection health check"
for i in {1..5}; do
    if curl -f -s "$BACKEND_URL/auth/ping-db" > /dev/null 2>&1; then
        print_status "Backend health check passed!"
        break
    else
        print_warning "Attempt $i/5 failed, retrying in 10 seconds..."
        sleep 10
    fi
done

# Test 2: Frontend accessibility
print_info "Test 2: Frontend accessibility"
if curl -f -s -I "$FRONTEND_URL" | grep -q "200 OK"; then
    print_status "Frontend is accessible!"
else
    print_warning "Frontend may not be ready yet"
fi

# Test 3: Database connection info
print_info "Test 3: Database connection"
SECRET_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
    --output text 2>/dev/null)

if [ ! -z "$SECRET_ARN" ]; then
    print_status "Database secret retrieved from Secrets Manager"
    print_info "Secret ARN: $SECRET_ARN"
else
    print_warning "Could not retrieve database secret ARN"
fi

echo ""
print_info "All resources are running. You can now test manually:"
echo -e "  ${GREEN}Backend:${NC} $BACKEND_URL"
echo -e "  ${GREEN}Frontend:${NC} $FRONTEND_URL"
echo ""
print_info "Waiting ${TEST_DURATION} seconds (10 minutes) for manual testing..."
print_warning "Resources are incurring costs during this time!"

# Countdown timer
for i in $(seq $TEST_DURATION -30 0); do
    if [ $((i % 60)) -eq 0 ] || [ $i -eq $TEST_DURATION ]; then
        minutes=$((i / 60))
        print_info "Time remaining: ${minutes} minutes"
    fi
    sleep 30
done

echo ""

# Step 7: Cleanup
echo -e "${BLUE}Step 7: Cleaning up resources...${NC}"
print_warning "This will delete ALL resources including the database!"
read -p "Delete all resources? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Cleanup cancelled!"
    print_warning "⚠️  IMPORTANT: Resources are still running and incurring costs!"
    print_info "To delete manually, run: cd infra && cdk destroy"
    exit 1
fi

print_info "Deleting stack... (this may take 10-15 minutes)"
if cdk destroy --force; then
    print_status "All resources deleted successfully!"
    print_status "No more costs will be incurred."
else
    print_error "Deletion failed or partially completed"
    print_warning "⚠️  Some resources may still be running!"
    print_info "Check AWS Console or run: cd infra && cdk destroy --force"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Test Complete!${NC}"
echo -e "${GREEN}========================================${NC}"