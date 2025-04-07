-- Function to create super_admin
CREATE OR REPLACE FUNCTION create_super_admin()
RETURNS void AS $$
DECLARE
    _user_id uuid;
BEGIN
    -- Generate UUID for the new user
    _user_id := gen_random_uuid();

    -- Delete existing user if exists
    DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@example.com');
    DELETE FROM public.users WHERE email = 'admin@example.com';
    DELETE FROM auth.users WHERE email = 'admin@example.com';

    -- Create user in auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        is_super_admin,
        raw_app_meta_data,
        raw_user_meta_data,
        role,
        created_at,
        updated_at,
        aud,
        confirmation_sent_at,
        recovery_sent_at,
        instance_id
    ) VALUES (
        _user_id,
        'admin@example.com',
        crypt('Admin123456', gen_salt('bf')),
        now(),
        true,
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email']::text[],
            'role', 'super_admin'
        ),
        jsonb_build_object(
            'full_name', 'Super Admin',
            'role', 'super_admin'
        ),
        'authenticated',
        now(),
        now(),
        'authenticated',
        now(),
        now(),
        '00000000-0000-0000-0000-000000000000'
    );

    -- Create identity in auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        _user_id,
        _user_id,
        jsonb_build_object(
            'sub', _user_id,
            'email', 'admin@example.com',
            'email_verified', true,
            'phone_verified', false,
            'full_name', 'Super Admin',
            'role', 'super_admin'
        ),
        'email',
        'admin@example.com',
        now(),
        now(),
        now()
    );

    -- Create user in public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        created_at
    ) VALUES (
        _user_id,
        'admin@example.com',
        'Super Admin',
        'super_admin',
        now()
    );
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_super_admin();

-- Drop the function
DROP FUNCTION create_super_admin(); 