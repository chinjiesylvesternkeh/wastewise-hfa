#!/bin/bash

# Build and push Docker images to ECR
# Usage: ./scripts/build-and-push.sh [environment] [region]

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-west-2}
PROJECT_NAME="wellness-platform"

echo "🚀 Building and pushing Docker images for $PROJECT_NAME-$ENVIRONMENT"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECR login
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and push each application
APPS=("gateway:main-app" "healthcare:apps/healthcare" "fitness:apps/fitness" "culinary:apps/culinary")

for app_info in "${APPS[@]}"; do
    IFS=':' read -r app_name app_path <<< "$app_info"
    
    echo "📦 Building $app_name..."
    
    # Build Docker image
    docker build -t $PROJECT_NAME-$ENVIRONMENT-$app_name:latest $app_path/
    
    # Tag for ECR
    ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME-$ENVIRONMENT-$app_name"
    docker tag $PROJECT_NAME-$ENVIRONMENT-$app_name:latest $ECR_URI:latest
    docker tag $PROJECT_NAME-$ENVIRONMENT-$app_name:latest $ECR_URI:$(git rev-parse --short HEAD)
    
    echo "🚢 Pushing $app_name to ECR..."
    docker push $ECR_URI:latest
    docker push $ECR_URI:$(git rev-parse --short HEAD)
    
    echo "✅ $app_name pushed successfully"
done

echo "🎉 All images built and pushed successfully!"
echo "📝 Next steps:"
echo "   1. Update ECS services to use new images"
echo "   2. Monitor deployment in AWS Console"
echo "   3. Run health checks"