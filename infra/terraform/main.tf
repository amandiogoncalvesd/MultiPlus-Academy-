provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# 1. Google Artifact Registry for docker images
resource "google_artifact_registry_repository" "multiplus_repo" {
  location      = var.gcp_region
  repository_id = "multiplus-academy-registry"
  description   = "Docker repositories for MultiPlus Academy monorepo applications"
  format        = "DOCKER"
}

# 2. Cloud SQL Database instance running PostgreSQL
resource "google_sql_database_instance" "multiplus_db_instance" {
  name             = "multiplus-postgres-instance"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier = "db-f1-micro" # Developer Tier Scale to zero compliant
    ip_configuration {
      ipv4_enabled    = true
    }
  }
}

resource "google_sql_database" "multiplus_db" {
  name     = "multiplus_production"
  instance = google_sql_database_instance.multiplus_db_instance.name
}

# 3. Google Cloud Run for Next.js Web (Frontend Client)
resource "google_cloud_run_v2_service" "web_service" {
  name     = "multiplus-web-service"
  location = var.gcp_region

  template {
    containers {
      image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.multiplus_repo.repository_id}/web:latest"
      ports {
        container_port = 3000
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }
}

# 4. Google Cloud Run for NestJS API (Backend Core)
resource "google_cloud_run_v2_service" "api_service" {
  name     = "multiplus-api-service"
  location = var.gcp_region

  template {
    containers {
      image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.multiplus_repo.repository_id}/api:latest"
      ports {
        container_port = 4000
      }
      env {
        name  = "PORT"
        value = "4000"
      }
      env {
        name  = "DATABASE_URL"
        value = "postgresql://postgres:...@/multiplus_production"
      }
    }
  }
}
