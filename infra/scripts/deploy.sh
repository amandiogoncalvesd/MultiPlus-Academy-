#!/usr/bin/env sh
set -e

echo "🌩️ Commencing Google Cloud Deployment Sequence for MultiPlus Academy..."

# Target project credentials
export GCP_PROJECT="multiplus-academy-prod"
export GCP_REGION="europe-west2"

# 1. Building and tagging container images
echo "🏗️ Constructing production Docker images..."
docker build -f infra/docker/Dockerfile.web -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/multiplus-academy-registry/web:latest .
docker build -f infra/docker/Dockerfile.api -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/multiplus-academy-registry/api:latest .

# 2. Pushing to Docker Artifact Registry
echo "📤 Submitting images to private Artifact Registry..."
docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/multiplus-academy-registry/web:latest
docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/multiplus-academy-registry/api:latest

# 3. Applying Terraform plans
echo "⚙️ Initializing and running Terraform infrastructure update..."
cd infra/terraform
terraform init
terraform apply -auto-approve

echo "🎉 Success: Cloud deployment sequence concluded!"
