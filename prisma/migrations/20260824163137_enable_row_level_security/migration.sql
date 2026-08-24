-- Supabase exposes every table in the public schema through its PostgREST API by
-- default, regardless of whether the app uses the Supabase client (this app doesn't —
-- Prisma connects directly via DATABASE_URL/DIRECT_URL as the postgres superuser role,
-- which always bypasses RLS). Without RLS enabled, anyone holding the project's anon
-- key could read or write these tables directly over that REST API, bypassing the
-- app's own ADMIN_MODE gate entirely. No policies are added, so PostgREST denies all
-- anon/authenticated access by default; Prisma is unaffected.
ALTER TABLE "Hero" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lane" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Competition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Season" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamSeason" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Series" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ban" ENABLE ROW LEVEL SECURITY;
