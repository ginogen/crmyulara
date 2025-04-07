-- Desactivar RLS en todas las tablas públicas
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users registering" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;

-- Dar permisos completos al rol anónimo y autenticado en tablas públicas
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.organizations TO anon;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.branches TO anon;
GRANT ALL ON public.branches TO authenticated;
GRANT ALL ON public.contacts TO anon;
GRANT ALL ON public.contacts TO authenticated;
GRANT ALL ON public.leads TO anon;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.tasks TO anon;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.budgets TO anon;
GRANT ALL ON public.budgets TO authenticated;

-- Dar permisos en el esquema auth
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT ALL ON auth.users TO anon;
GRANT ALL ON auth.users TO authenticated;
GRANT ALL ON auth.refresh_tokens TO anon;
GRANT ALL ON auth.refresh_tokens TO authenticated;
GRANT ALL ON auth.sessions TO anon;
GRANT ALL ON auth.sessions TO authenticated;
GRANT ALL ON auth.mfa_factors TO anon;
GRANT ALL ON auth.mfa_factors TO authenticated;
GRANT ALL ON auth.mfa_challenges TO anon;
GRANT ALL ON auth.mfa_challenges TO authenticated;
GRANT ALL ON auth.mfa_amr_claims TO anon;
GRANT ALL ON auth.mfa_amr_claims TO authenticated;
GRANT ALL ON auth.identities TO anon;
GRANT ALL ON auth.identities TO authenticated;

-- Asegurar que el esquema auth está accesible
ALTER SCHEMA auth OWNER TO supabase_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_admin; 