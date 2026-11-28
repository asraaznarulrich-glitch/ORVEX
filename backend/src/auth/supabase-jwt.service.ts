import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { AuthenticatedUser } from "./authenticated-user.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class SupabaseJwtService implements OnModuleInit {
  private issuer: string | undefined;
  private jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

  onModuleInit(): void {
    const rawUrl = process.env.SUPABASE_URL;

    if (!rawUrl) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("SUPABASE_URL is required in production.");
      }
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error("SUPABASE_URL must be a valid absolute URL.");
    }

    if (
      !["https:", "http:"].includes(parsed.protocol) ||
      parsed.origin !== rawUrl.replace(/\/$/, "") ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")
    ) {
      throw new Error("SUPABASE_URL must be a trusted HTTPS project origin in production.");
    }

    this.issuer = `${parsed.origin}/auth/v1`;
    this.jwks = createRemoteJWKSet(
      new URL("/auth/v1/.well-known/jwks.json", parsed.origin),
    );
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    if (!this.issuer || !this.jwks) {
      throw new UnauthorizedException("Authentication is not configured.");
    }

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: "authenticated",
        algorithms: ["ES256", "RS256"],
        requiredClaims: ["exp", "iat", "sub", "role"],
      });

      const user = this.toAuthenticatedUser(payload);
      if (!user) {
        throw new Error("Required user claims are missing.");
      }

      return user;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token.");
    }
  }

  private toAuthenticatedUser(payload: JWTPayload): AuthenticatedUser | null {
    if (
      typeof payload.sub !== "string" ||
      !UUID_PATTERN.test(payload.sub) ||
      payload.role !== "authenticated"
    ) {
      return null;
    }

    return {
      id: payload.sub,
      ...(typeof payload.email === "string" ? { email: payload.email } : {}),
      role: "authenticated",
    };
  }
}
