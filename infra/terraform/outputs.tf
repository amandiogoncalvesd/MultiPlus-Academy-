output "web_service_url" {
  value       = google_cloud_run_v2_service.web_service.uri
  description = "The publicly accessible URL of the MultiPlus Next.js web application"
}

output "api_service_url" {
  value       = google_cloud_run_v2_service.api_service.uri
  description = "The internal/external API endpoint url of NestJS service"
}

output "postgresql_instance_connection_name" {
  value       = google_sql_database_instance.multiplus_db_instance.connection_name
  description = "GCP Cloud SQL instance connection string descriptor"
}
