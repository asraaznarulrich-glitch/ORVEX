import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configuredOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === "production" && configuredOrigins.length === 0) {
    throw new Error(
      "CORS_ORIGINS must contain at least one trusted frontend origin in production.",
    );
  }

  app.enableCors({
    origin:
      configuredOrigins.length > 0
        ? configuredOrigins
        : ["http://localhost:3000"],
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
