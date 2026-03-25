# Deploy Wellness Platform using Terraform (PowerShell version)
# Usage: .\scripts\deploy.ps1 [environment] [action]

param(
    [string]$Environment = "dev",
    [string]$Action = "plan"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Wellness Platform - Environment: $Environment, Action: $Action" -ForegroundColor Green

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$TerraformDir = Join-Path $ProjectRoot "terraform"

# Check if Terraform is installed
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Terraform is not installed. Please install Terraform first." -ForegroundColor Red
    exit 1
}

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI is not installed. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Verify AWS credentials
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "❌ AWS credentials not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

Set-Location $TerraformDir

# Initialize Terraform
Write-Host "🔧 Initializing Terraform..." -ForegroundColor Yellow
terraform init

# Validate Terraform configuration
Write-Host "✅ Validating Terraform configuration..." -ForegroundColor Yellow
terraform validate

# Create terraform.tfvars if it doesn't exist
$TfVarsFile = Join-Path $TerraformDir "terraform.tfvars"
if (-not (Test-Path $TfVarsFile)) {
    Write-Host "📝 Creating terraform.tfvars file..." -ForegroundColor Yellow
    
    $TfVarsContent = @"
# Terraform variables for Wellness Platform
environment = "$Environment"
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
"@
    
    Set-Content -Path $TfVarsFile -Value $TfVarsContent
    Write-Host "📝 Please review and update terraform.tfvars with your specific values" -ForegroundColor Yellow
}

# Execute Terraform action
switch ($Action.ToLower()) {
    "plan" {
        Write-Host "📋 Running Terraform plan..." -ForegroundColor Yellow
        terraform plan -var-file="terraform.tfvars"
    }
    "apply" {
        Write-Host "🚀 Applying Terraform configuration..." -ForegroundColor Yellow
        terraform apply -var-file="terraform.tfvars" -auto-approve
        
        Write-Host "✅ Deployment completed!" -ForegroundColor Green
        Write-Host "📊 Getting outputs..." -ForegroundColor Yellow
        terraform output
        
        Write-Host ""
        Write-Host "🎉 Wellness Platform deployed successfully!" -ForegroundColor Green
        $AppUrl = terraform output -raw application_url
        $LbDns = terraform output -raw load_balancer_dns_name
        Write-Host "📱 Application URL: $AppUrl" -ForegroundColor Cyan
        Write-Host "🏥 Load Balancer DNS: $LbDns" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Build and push Docker images: .\scripts\build-and-push.ps1 $Environment" -ForegroundColor White
        Write-Host "   2. Update ECS services with new images" -ForegroundColor White
        Write-Host "   3. Configure domain name (if applicable)" -ForegroundColor White
        Write-Host "   4. Set up monitoring and alerts" -ForegroundColor White
    }
    "destroy" {
        Write-Host "🗑️  Destroying Terraform infrastructure..." -ForegroundColor Red
        $confirmation = Read-Host "⚠️  This will delete all resources. Are you sure? (y/N)"
        if ($confirmation -match "^[Yy]$") {
            terraform destroy -var-file="terraform.tfvars" -auto-approve
            Write-Host "✅ Infrastructure destroyed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Destruction cancelled." -ForegroundColor Yellow
        }
    }
    "output" {
        Write-Host "📊 Terraform outputs:" -ForegroundColor Yellow
        terraform output
    }
    default {
        Write-Host "❌ Invalid action: $Action" -ForegroundColor Red
        Write-Host "Valid actions: plan, apply, destroy, output" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Script completed successfully!" -ForegroundColor Green