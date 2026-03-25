# 🐳 Docker & Terraform Deployment Guide

## Overview

This guide covers deploying the Integrated Wellness Platform using Docker containers and Terraform infrastructure as code on AWS.

## 🏗️ Architecture

### Infrastructure Components
- **ECS Fargate**: Serverless container hosting
- **Application Load Balancer**: Traffic distribution and SSL termination
- **DocumentDB**: MongoDB-compatible database cluster
- **ECR**: Container image registry
- **VPC**: Isolated network environment
- **Secrets Manager**: Secure credential storage
- **CloudWatch**: Monitoring and logging

### Container Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Gateway App   │
│    (Port 80/443)│    │   (Port 3000)   │
└─────────────────┘    └─────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼───┐ ┌───▼───┐ ┌───▼───┐
            │Healthcare │ │Fitness│ │Culinary│
            │(Port 3002)│ │(3003) │ │(3004) │
            └───────────┘ └───────┘ └───────┘
                    │         │         │
                    └─────────┼─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   DocumentDB      │
                    │   (Port 27017)    │
                    └───────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Docker installed
- Terraform >= 1.0 installed
- Git repository access

### 1. Clone and Setup
```bash
git clone <repository-url>
cd integrated-wellness-platform
```

### 2. Deploy Infrastructure
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy infrastructure (creates AWS resources)
./scripts/deploy.sh dev plan    # Review changes
./scripts/deploy.sh dev apply   # Apply changes
```

### 3. Build and Deploy Applications
```bash
# Build and push Docker images to ECR
./scripts/build-and-push.sh dev

# Update ECS services with new images
./scripts/update-services.sh dev
```

### 4. Access Application
```bash
# Get application URL
cd terraform
terraform output application_url
```

## 📋 Detailed Deployment Steps

### Step 1: Infrastructure Deployment

#### Configure Variables
Edit `terraform/terraform.tfvars`:
```hcl
# Environment configuration
environment = "dev"
project_name = "wellness-platform"
aws_region = "us-west-2"

# Networking
vpc_cidr = "10.0.0.0/16"
availability_zones = 2

# Container resources
container_cpu = 512
container_memory = 1024
min_capacity = 1
max_capacity = 10
desired_capacity = 2

# Database
mongodb_instance_class = "db.t3.medium"
mongodb_cluster_size = 1
mongodb_username = "wellness_admin"

# Security
enable_ssl = true
enable_monitoring = true

# Optional: Custom domain
# domain_name = "wellness.example.com"
# certificate_arn = "arn:aws:acm:..."
```

#### Deploy Infrastructure
```bash
cd terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="terraform.tfvars"

# Apply changes
terraform apply -var-file="terraform.tfvars"
```

### Step 2: Container Deployment

#### Build Images Locally
```bash
# Gateway application
cd main-app
docker build -t wellness-gateway:latest .

# Healthcare application
cd ../apps/healthcare
docker build -t wellness-healthcare:latest .

# Fitness application
cd ../apps/fitness
docker build -t wellness-fitness:latest .

# Culinary application
cd ../apps/culinary
docker build -t wellness-culinary:latest .
```

#### Push to ECR
```bash
# Get ECR login
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# Tag and push images
docker tag wellness-gateway:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/wellness-platform-dev-gateway:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/wellness-platform-dev-gateway:latest

# Repeat for other applications...
```

#### Update ECS Services
```bash
# Force new deployment with updated images
aws ecs update-service --cluster wellness-platform-dev-cluster --service wellness-platform-dev-gateway --force-new-deployment
aws ecs update-service --cluster wellness-platform-dev-cluster --service wellness-platform-dev-healthcare --force-new-deployment
aws ecs update-service --cluster wellness-platform-dev-cluster --service wellness-platform-dev-fitness --force-new-deployment
aws ecs update-service --cluster wellness-platform-dev-cluster --service wellness-platform-dev-culinary --force-new-deployment
```

## 🔧 Configuration

### Environment Variables
Each application supports these environment variables:

#### Gateway App
- `NODE_ENV`: Environment (production/development)
- `PORT`: Application port (default: 3000)
- `JWT_SECRET`: JWT signing secret (from Secrets Manager)
- `MONGODB_URI`: Database connection string (from Secrets Manager)

#### Individual Apps (Healthcare/Fitness/Culinary)
- `NODE_ENV`: Environment (production/development)
- `PORT`: Application port (3002/3003/3004)
- `MONGODB_URI`: Database connection string (from Secrets Manager)

### Secrets Management
Sensitive data is stored in AWS Secrets Manager:
- JWT secret key
- MongoDB credentials
- Database connection strings

### Database Configuration
DocumentDB cluster with:
- TLS encryption enabled
- Automated backups
- Multi-AZ deployment (production)
- Performance monitoring

## 📊 Monitoring & Logging

### CloudWatch Integration
- Container logs automatically sent to CloudWatch
- Custom metrics for application performance
- Alarms for critical thresholds

### Health Checks
- Application-level health endpoints
- Load balancer health checks
- ECS service health monitoring

### Log Groups
- `/aws/ecs/wellness-platform-{env}`: Application logs
- `/aws/docdb/wellness-platform-{env}/audit`: Database audit logs
- `/aws/docdb/wellness-platform-{env}/profiler`: Database performance logs

## 🔒 Security

### Network Security
- Private subnets for applications
- Database in isolated subnets
- Security groups with minimal required access
- NAT gateways for outbound internet access

### Data Security
- Encryption at rest (EBS, DocumentDB, S3)
- Encryption in transit (TLS/SSL)
- Secrets stored in AWS Secrets Manager
- KMS keys for encryption management

### Access Control
- IAM roles with least privilege
- ECS task roles for service-to-service communication
- No hardcoded credentials

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
1. **Test**: Run unit tests and linting
2. **Security Scan**: Vulnerability scanning with Trivy
3. **Build**: Create Docker images
4. **Push**: Upload images to ECR
5. **Deploy**: Update infrastructure and services

### Required Secrets
Configure these in GitHub repository secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `JWT_SECRET`
- `MONGODB_PASSWORD`

## 🛠️ Maintenance

### Scaling
```bash
# Update desired capacity
aws ecs update-service --cluster wellness-platform-dev-cluster --service wellness-platform-dev-gateway --desired-count 4
```

### Updates
```bash
# Update application code
./scripts/build-and-push.sh dev
./scripts/update-services.sh dev

# Update infrastructure
cd terraform
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

### Backup & Recovery
- Automated DocumentDB backups (7-day retention)
- Point-in-time recovery available
- Cross-region backup replication (production)

## 🧪 Testing

### Local Testing with Docker Compose
```bash
# Start all services locally
docker-compose up -d

# Run tests
docker-compose exec gateway npm test

# View logs
docker-compose logs -f gateway
```

### Production Testing
```bash
# Health check
curl https://your-domain.com/health

# API testing
curl https://your-domain.com/api/auth/profile
```

## 📈 Cost Optimization

### Development Environment
- Use smaller instance types
- Single AZ deployment
- Reduced backup retention
- Spot instances for non-critical workloads

### Production Environment
- Multi-AZ for high availability
- Reserved instances for predictable workloads
- Auto-scaling based on demand
- CloudWatch cost monitoring

## 🚨 Troubleshooting

### Common Issues

#### ECS Service Won't Start
```bash
# Check service events
aws ecs describe-services --cluster wellness-platform-dev-cluster --services wellness-platform-dev-gateway

# Check task definition
aws ecs describe-task-definition --task-definition wellness-platform-dev-gateway
```

#### Database Connection Issues
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Test connectivity from ECS task
aws ecs execute-command --cluster wellness-platform-dev-cluster --task task-id --container gateway --interactive --command "/bin/bash"
```

#### Load Balancer Issues
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...

# Check ALB logs in S3
aws s3 ls s3://wellness-platform-dev-alb-logs/
```

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

## 🎉 Success!

Your Integrated Wellness Platform is now deployed with:
- ✅ Containerized microservices architecture
- ✅ Infrastructure as Code with Terraform
- ✅ Auto-scaling and high availability
- ✅ Comprehensive monitoring and logging
- ✅ Security best practices
- ✅ CI/CD pipeline integration

The platform is production-ready and can scale to handle thousands of users! 🚀