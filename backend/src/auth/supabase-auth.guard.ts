import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./public.decorator.js";
import { SupabaseJwtService } from "./supabase-jwt.service.js";
import type { AuthenticatedUser } from "./authenticated-user.js";

interface AuthenticatedRequest {
  headers: { authorization?: string };
  user?: AuthenticatedUser;
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: SupabaseJwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("A valid bearer access token is required.");
    }

    request.user = await this.jwt.verifyAccessToken(token);
    return true;
  }
}
