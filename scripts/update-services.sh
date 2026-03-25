#!/bin/bash

# Update ECS services with new Docker images
# Usage: ./scripts/update-services.sh [environment] [region]

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-west-2}
PROJECT_NAME="wellness-platform"

echo "🔄 Updating ECS services for $PROJECT_NAME-$ENVIRONMENT"

# Get cluster name
CLUSTER_NAME="$PROJECT_NAME-$ENVIRONMENT-cluster"

# Services to update
SERVICES=("gateway" "healthcare" "fitness" "culinary")

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

for service in "${SERVICES[@]}"; do
    echo "🔄 Updating $service service..."
    
    SERVICE_NAME="$PROJECT_NAME-$ENVIRONMENT-$service"
    ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME-$ENVIRONMENT-$service:latest"
    
    # Force new deployment
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --force-new-deployment \
        --region $REGION
    
    echo "✅ $service service update initiated"
done

echo "⏳ Waiting for services to stabilize..."

# Wait for all services to become stable
for service in "${SERVICES[@]}"; do
    SERVICE_NAME="$PROJECT_NAME-$ENVIRONMENT-$service"
    
    echo "⏳ Waiting for $service to stabilize..."
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION
    
    echo "✅ $service is now stable"
done

echo "🎉 All services updated and stable!"

# Show service status
echo "📊 Service Status:"
aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $(printf "$PROJECT_NAME-$ENVIRONMENT-%s " "${SERVICES[@]}") \
    --region $REGION \
    --query 'services[*].[serviceName,status,runningCount,desiredCount]' \
    --output table