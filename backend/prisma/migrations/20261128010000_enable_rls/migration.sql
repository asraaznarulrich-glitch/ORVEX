-- Establish a database role that is subject to RLS. Supabase projects already provide it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE "User", "Organization", "Membership", "Invitation", "AuditEvent" TO authenticated;

-- The backend must switch to this role inside every user-scoped transaction.
-- FORCE also protects against accidental table-owner access (superusers still bypass RLS).
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Membership" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" FORCE ROW LEVEL SECURITY;

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_self"
  ON "User" FOR SELECT TO authenticated
  USING (id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid);

CREATE POLICY "organization_read_member"
  ON "Organization" FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Membership" m
      WHERE m."organizationId" = "Organization".id
        AND m."userId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
    )
  );

CREATE POLICY "membership_read_self"
  ON "Membership" FOR SELECT TO authenticated
  USING ("userId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid);

CREATE POLICY "invitation_read_admin"
  ON "Invitation" FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Membership" m
      WHERE m."organizationId" = "Invitation"."organizationId"
        AND m."userId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
        AND m.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "audit_event_read_member"
  ON "AuditEvent" FOR SELECT TO authenticated
  USING (
    "organizationId" IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM "Membership" m
      WHERE m."organizationId" = "AuditEvent"."organizationId"
        AND m."userId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
    )
  );

-- No INSERT/UPDATE/DELETE grants are given to authenticated in this first pass.
-- Dedicated, narrowly-scoped write workflows will be added with their own policies.
