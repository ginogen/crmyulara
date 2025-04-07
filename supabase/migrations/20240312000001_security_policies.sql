-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Asegurar que las tablas de auth sean accesibles
ALTER TABLE IF EXISTS auth.users FORCE ROW LEVEL SECURITY;

-- Eliminar políticas existentes de auth.users
DROP POLICY IF EXISTS "Allow individual auth.users to view their own data" ON auth.users;
DROP POLICY IF EXISTS "Allow individual auth.users to update their own data" ON auth.users;

-- Crear políticas para auth.users
CREATE POLICY "Allow individual auth.users to view their own data"
ON auth.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow individual auth.users to update their own data"
ON auth.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;

-- Create policies for public.users
CREATE POLICY "Enable read access for authenticated users"
    ON public.users FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for users registering"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Super admins can view all data" ON public.users;
DROP POLICY IF EXISTS "Org admins can view organization data" ON public.users;
DROP POLICY IF EXISTS "Branch managers can view branch data" ON public.users;
DROP POLICY IF EXISTS "Super admins can do everything with organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Super admins and org admins can manage branches" ON branches;
DROP POLICY IF EXISTS "Users can view branches in their organization" ON branches;
DROP POLICY IF EXISTS "Users can manage contacts in their organization and branch" ON contacts;
DROP POLICY IF EXISTS "Users can manage leads in their organization and branch" ON leads;
DROP POLICY IF EXISTS "Users can manage tasks in their organization" ON tasks;
DROP POLICY IF EXISTS "Users can manage budgets in their organization" ON budgets;

-- Política para permitir a los super admins ver todos los datos
CREATE POLICY "Super admins can view all data"
ON public.users FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

-- Política para permitir a los org admins ver datos de su organización
CREATE POLICY "Org admins can view organization data"
ON public.users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'org_admin'
        AND users.organization_id = public.users.organization_id
    )
);

-- Política para permitir a los branch managers ver datos de su sucursal
CREATE POLICY "Branch managers can view branch data"
ON public.users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'branch_manager'
        AND users.branch_id = public.users.branch_id
    )
);

-- Políticas para organizaciones
CREATE POLICY "Super admins can do everything with organizations"
ON organizations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

CREATE POLICY "Users can view their own organization"
ON organizations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.organization_id = organizations.id
    )
);

-- Políticas para sucursales
CREATE POLICY "Super admins and org admins can manage branches"
ON branches FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND (
            users.role = 'super_admin'
            OR (users.role = 'org_admin' AND users.organization_id = branches.organization_id)
        )
    )
);

CREATE POLICY "Users can view branches in their organization"
ON branches FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.organization_id = branches.organization_id
    )
);

-- Políticas para contactos
CREATE POLICY "Users can manage contacts in their organization and branch"
ON contacts FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.organization_id = contacts.organization_id
        AND (
            users.role IN ('super_admin', 'org_admin')
            OR users.branch_id = contacts.branch_id
        )
    )
);

-- Políticas para leads
CREATE POLICY "Users can manage leads in their organization and branch"
ON leads FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.organization_id = leads.organization_id
        AND (
            users.role IN ('super_admin', 'org_admin')
            OR users.branch_id = leads.branch_id
            OR leads.assigned_to = users.id
        )
    )
);

-- Políticas para tareas
CREATE POLICY "Users can manage tasks in their organization"
ON tasks FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.organization_id = tasks.organization_id
        AND (
            users.role IN ('super_admin', 'org_admin')
            OR users.branch_id = tasks.branch_id
            OR tasks.assigned_to = users.id
        )
    )
);

-- Políticas para presupuestos
CREATE POLICY "Users can manage budgets in their organization"
ON budgets FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.organization_id = budgets.organization_id
        AND (
            users.role IN ('super_admin', 'org_admin')
            OR users.branch_id = budgets.branch_id
            OR budgets.created_by = users.id
        )
    )
);

-- Políticas para permitir el registro de usuarios
DROP POLICY IF EXISTS "Enable insert for authentication service" ON auth.users;
CREATE POLICY "Enable insert for authentication service" ON auth.users
FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for public registration" ON public.users;
CREATE POLICY "Enable insert for public registration" ON public.users
FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for identities" ON auth.identities;
CREATE POLICY "Enable insert for identities" ON auth.identities
FOR INSERT TO anon
WITH CHECK (true);

-- Deshabilitar temporalmente RLS para auth.users durante el desarrollo
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Asegurarse de que la tabla public.users tenga RLS habilitado pero permita inserciones anónimas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public registration" ON public.users
FOR INSERT TO anon
WITH CHECK (true);

-- Política para permitir que los usuarios vean y actualicen sus propios datos
DROP POLICY IF EXISTS "Users can manage their own data" ON public.users;
CREATE POLICY "Users can manage their own data" ON public.users
FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para permitir la inserción de usuarios durante el registro
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
CREATE POLICY "Allow user registration" ON public.users
FOR INSERT TO anon
WITH CHECK (true);

-- Política para permitir la inserción de usuarios durante el registro en auth.users
DROP POLICY IF EXISTS "Allow auth user registration" ON auth.users;
CREATE POLICY "Allow auth user registration" ON auth.users
FOR INSERT TO anon
WITH CHECK (true); 