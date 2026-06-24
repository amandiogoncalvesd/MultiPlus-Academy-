variable "gcp_project_id" {
  type        = string
  description = "The target Google Cloud Project ID to provision resources into"
  default     = "multiplus-academy-prod"
}

variable "gcp_region" {
  type        = string
  description = "The target GCP region"
  default     = "europe-west2"
}
