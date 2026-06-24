import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { initializeFirebase } from "./config/firebase.config";

async function bootstrap() {
  // Initialize Firebase Admin configuration before nest setup
  initializeFirebase();

  const app = await NestFactory.create(AppModule);

  // Set global API routing prefix
  app.setGlobalPrefix("api/v1");

  // Configure Cross-Origin Resource Sharing (CORS) for Next.js frontend communication
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);
  console.info(`NestJS Backend Core running on: http://localhost:${PORT}/api/v1`);
}

bootstrap();
