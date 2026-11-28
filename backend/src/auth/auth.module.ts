import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { SupabaseAuthGuard } from "./supabase-auth.guard.js";
import { SupabaseJwtService } from "./supabase-jwt.service.js";

@Global()
@Module({
  providers: [
    SupabaseJwtService,
    SupabaseAuthGuard,
    {
      provide: APP_GUARD,
      useExisting: SupabaseAuthGuard,
    },
  ],
  exports: [SupabaseJwtService, SupabaseAuthGuard],
})
export class AuthModule {}
