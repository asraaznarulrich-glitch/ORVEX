import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module.js";

function getAllowedOrigins(): string[] {
  const rawOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === "production" && rawOrigins.length === 0) {
    throw new Error(
      "CORS_ORIGINS must contain at least one trusted frontend origin in production.",
    );
  }

  const origins = rawOrigins.map((origin) => {
    let parsed: URL;

    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`Invalid CORS origin: "${origin}". Use a complete HTTP(S) origin.`);
    }

    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== origin ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(
        `Invalid CORS origin: "${origin}". Provide only an origin, without a path, query, or wildcard.`,
      );
    }

    return parsed.origin;
  });

  return [...new Set(origins)];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === "production") {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }

  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = getAllowedOrigins();
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : ["http://localhost:3000"],
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid integer between 1 and 65535.");
  }

  await app.listen(port, "0.0.0.0");
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`ORVEX API failed to start: ${message}`);
  process.exit(1);
});
