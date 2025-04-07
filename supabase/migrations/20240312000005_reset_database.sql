-- Desactivar RLS para todas las tablas públicas
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets DISABLE ROW LEVEL SECURITY;

-- Eliminar tipos enumerados personalizados si existen
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Eliminar funciones personalizadas
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.hash_password(text) CASCADE;
DROP FUNCTION IF EXISTS public.verify_password(text, text) CASCADE;

-- Limpiar políticas de RLS existentes si las tablas existen
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
        DROP POLICY IF EXISTS "Enable insert for users registering" ON public.users;
        DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
        DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
        DROP POLICY IF EXISTS "Users can insert their own user data" ON public.users;
        DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
    END IF;
END $$;

-- Eliminar todas las tablas públicas
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE; 