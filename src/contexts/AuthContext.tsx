'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as AuthUser, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Database } from '@/lib/supabase/database.types';

type DBUser = Database['public']['Tables']['users']['Row'];

interface Organization {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  organization_id: string;
}

interface AuthContextType {
  user: DBUser | null;
  loading: boolean;
  currentOrganization: Organization | null;
  currentBranch: Branch | null;
  organizations: Organization[];
  branches: Branch[];
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  setCurrentOrganization: (org: Organization) => void;
  setCurrentBranch: (branch: Branch) => void;
  userRole: string | null;
  refreshSession: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Función para refrescar la sesión
  const refreshSession = useCallback(async () => {
    try {
      console.log('Intentando refrescar la sesión en AuthContext...');
      
      // Añadir un timeout para evitar que la operación se quede colgada
      const maxTimeout = 10000; // 10 segundos
      
      const refreshPromise = supabase.auth.refreshSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al refrescar la sesión')), maxTimeout)
      );
      
      // Competir entre ambas promesas
      const { data, error } = await Promise.race([
        refreshPromise,
        timeoutPromise.then(() => ({ 
          data: { session: null }, 
          error: new Error('Timeout al refrescar la sesión') 
        }))
      ]) as any;
      
      if (error) {
        console.error('Error al refrescar la sesión:', error);
        
        // Si el error es de JWT expirado o inválido
        if (error.message.includes('JWT') || 
            error.message.includes('token') || 
            error.message.includes('expired') || 
            error.message.includes('invalid') ||
            error.message.includes('Timeout')) {
          console.log('Token expirado o inválido, redirigiendo a login...');
          await signOut();
          router.push('/login');
          return null;
        }
        
        throw error;
      }
      
      if (!data?.session) {
        console.warn('No se pudo obtener una sesión nueva');
        return null;
      }
      
      // Si se refrescó la sesión exitosamente pero el usuario no está cargado
      // (esto puede pasar si la aplicación estuvo inactiva mucho tiempo)
      if (!user && data.session) {
        console.log('Sesión refrescada pero el usuario no estaba cargado, recargando datos de usuario...');
        
        // También agregar timeout para la carga de usuario
        const userPromise = supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        const userTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout al cargar datos de usuario')), maxTimeout)
        );
        
        const { data: userData, error: userError } = await Promise.race([
          userPromise,
          userTimeoutPromise.then(() => ({ 
            data: null, 
            error: new Error('Timeout al cargar datos de usuario') 
          }))
        ]) as any;

        if (!userError && userData) {
          setUser(userData);
          setUserRole(userData.role);
          await loadOrganizationsAndBranches(userData);
        }
      }
      
      console.log('Sesión refrescada exitosamente.');
      return data.session;
    } catch (error) {
      console.error('Error inesperado al refrescar la sesión:', error);
      return null;
    }
  }, [router, user]);

  // Configurar un intervalo para refrescar la sesión antes de que expire
  useEffect(() => {
    if (!user) return;
    
    // Refrescar cada 50 minutos (los tokens suelen durar 1 hora)
    const intervalId = setInterval(async () => {
      console.log('Refrescando sesión preventivamente...');
      await refreshSession();
    }, 50 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user, refreshSession]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Intentar recuperar la sesión existente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error al recuperar la sesión:', sessionError);
          return;
        }

        if (session) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.error('Error al obtener datos del usuario:', userError);
            return;
          }

          setUser(userData);
          setUserRole(userData.role);

          // Cargar organizaciones y sucursales según el rol
          await loadOrganizationsAndBranches(userData);
        }
      } catch (error) {
        console.error('Error al inicializar la autenticación:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.error('Error al obtener datos del usuario:', userError);
            return;
          }

          setUser(userData);
          setUserRole(userData.role);
          await loadOrganizationsAndBranches(userData);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        setOrganizations([]);
        setBranches([]);
        setCurrentOrganization(null);
        setCurrentBranch(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadOrganizationsAndBranches = async (userData: DBUser) => {
    try {
      // Si es super_admin, cargar todas las organizaciones y sucursales
      if (userData.role === 'super_admin') {
        const { data: allOrgs, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name');

        if (orgsError) {
          console.error('Error obteniendo organizaciones:', orgsError);
        } else if (allOrgs && allOrgs.length > 0) {
          setOrganizations(allOrgs);
          setCurrentOrganization(allOrgs[0]);

          // Cargar todas las sucursales
          const { data: allBranches, error: branchesError } = await supabase
            .from('branches')
            .select('id, name, organization_id')
            .order('name');

          if (branchesError) {
            console.error('Error obteniendo sucursales:', branchesError);
          } else if (allBranches && allBranches.length > 0) {
            setBranches(allBranches);
            // Seleccionar la primera sucursal de la organización seleccionada
            const firstBranch = allBranches.find(branch => branch.organization_id === allOrgs[0].id);
            if (firstBranch) {
              setCurrentBranch(firstBranch);
            }
          }
        }
        return;
      }

      // Para otros roles, cargar solo su organización y sucursal
      if (userData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', userData.organization_id)
          .single();

        if (orgError) {
          console.error('Error obteniendo organización:', orgError);
        } else if (orgData) {
          setCurrentOrganization(orgData);
          setOrganizations([orgData]);

          // Para org_admin, cargar todas las sucursales de su organización
          if (userData.role === 'org_admin') {
            const { data: orgBranches, error: branchesError } = await supabase
              .from('branches')
              .select('id, name, organization_id')
              .eq('organization_id', userData.organization_id)
              .order('name');

            if (branchesError) {
              console.error('Error obteniendo sucursales:', branchesError);
            } else if (orgBranches) {
              setBranches(orgBranches);
              // Si el usuario no tiene una sucursal asignada, seleccionar la primera
              if (!userData.branch_id && orgBranches.length > 0) {
                setCurrentBranch(orgBranches[0]);
              }
            }
          }
        }
      }

      // Cargar sucursal específica para branch_manager y sales_agent
      if (userData.branch_id) {
        const { data: branchData, error: branchError } = await supabase
          .from('branches')
          .select('id, name, organization_id')
          .eq('id', userData.branch_id)
          .single();

        if (branchError) {
          console.error('Error obteniendo sucursal:', branchError);
        } else if (branchData) {
          setCurrentBranch(branchData);
          setBranches([branchData]);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      setUser(null);
      setUserRole(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      console.error('Error en signIn:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCurrentOrganization(null);
      setCurrentBranch(null);
      setOrganizations([]);
      setBranches([]);
      setUserRole(null);
    } catch (error) {
      console.error('Error en signOut:', error);
    }
  };

  const value = {
    user,
    loading,
    currentOrganization,
    currentBranch,
    organizations,
    branches,
    signIn,
    signOut,
    setCurrentOrganization,
    setCurrentBranch,
    userRole,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 