#!/bin/bash

# Deploy Wellness Platform using Terraform
# Usage: ./scripts/deploy.sh [environment] [action]

set -e

ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

echo "🚀 Deploying Wellness Platform - Environment: $ENVIRONMENT, Action: $ACTION"

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    exit 1
fi

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install AWS CLI first."
    exit 1
fi

# Verify AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

cd "$TERRAFORM_DIR"

# Initialize Terraform
echo "🔧 Initializing Terraform..."
terraform init

# Validate Terraform configuration
echo "✅ Validating Terraform configuration..."
terraform validate

# Create terraform.tfvars if it doesn't exist
if [ ! -f "terraform.tfvars" ]; then
    echo "📝 Creating terraform.tfvars file..."
    cat > terraform.tfvars << EOF
# Terraform variables for Wellness Platform
environment = "$ENVIRONMENT"
project_name = "wellness-platform"
aws_region = "us-west-2"

# Networking
vpc_cidr = "10.0.0.0/16"
availability_zones = 2

# Container configuration
container_cpu = 512
container_memory = 1024
min_capacity = 1
max_capacity = 10
desired_capacity = 2

# Database configuration
mongodb_instance_class = "db.t3.medium"
mongodb_cluster_size = 1
mongodb_username = "wellness_admin"

# Security
enable_ssl = true
enable_monitoring = true
log_retention_days = 14
backup_retention_period = 7

# Domain (optional - set if you have a domain)
# domain_name = "wellness.example.com"
# certificate_arn = "arn:aws:acm:us-west-2:123456789012:certificate/12345678-1234-1234-1234-123456789012"
EOF
    echo "📝 Please review and update terraform.tfvars with your specific values"
fi

# Execute Terraform action
case $ACTION in
    "plan")
        echo "📋 Running Terraform plan..."
        terraform plan -var-file="terraform.tfvars"
        ;;
    "apply")
        echo "🚀 Applying Terraform configuration..."
        terraform apply -var-file="terraform.tfvars" -auto-approve
        
        echo "✅ Deployment completed!"
        echo "📊 Getting outputs..."
        terraform output
        
        echo ""
        echo "🎉 Wellness Platform deployed successfully!"
        echo "📱 Application URL: $(terraform output -raw application_url)"
        echo "🏥 Load Balancer DNS: $(terraform output -raw load_balancer_dns_name)"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Build and push Docker images: ./scripts/build-and-push.sh $ENVIRONMENT"
        echo "   2. Update ECS services with new images"
        echo "   3. Configure domain name (if applicable)"
        echo "   4. Set up monitoring and alerts"
        ;;
    "destroy")
        echo "🗑️  Destroying Terraform infrastructure..."
        echo "⚠️  This will delete all resources. Are you sure? (y/N)"
        read -r confirmation
        if [[ $confirmation =~ ^[Yy]$ ]]; then
            terraform destroy -var-file="terraform.tfvars" -auto-approve
            echo "✅ Infrastructure destroyed successfully!"
        else
            echo "❌ Destruction cancelled."
        fi
        ;;
    "output")
        echo "📊 Terraform outputs:"
        terraform output
        ;;
    *)
        echo "❌ Invalid action: $ACTION"
        echo "Valid actions: plan, apply, destroy, output"
        exit 1
        ;;
esac

echo "✅ Script completed successfully!"