import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  UserPlusIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  userRole: 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';
  userEmail: string;
  userName: string;
  organizationLogo?: string;
}

export const Sidebar = ({ userRole, userEmail, userName, organizationLogo }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Contactos', href: '/contacts', icon: UserGroupIcon },
    { name: 'Leads', href: '/leads', icon: UserPlusIcon },
    { name: 'Presupuestos', href: '/budgets', icon: DocumentTextIcon },
    ...(userRole !== 'sales_agent'
      ? [{ name: 'Administración', href: '/admin', icon: Cog6ToothIcon }]
      : []),
  ];

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      
      // Primero intentamos obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await signOut();
      }
      
      // Independientemente de si había sesión o no, redirigimos al login
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Si hay un error, intentamos redirigir al login de todos modos
      router.push('/auth/login');
    }
  };

  return (
    <div
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } fixed h-full transition-all duration-300 ease-in-out flex flex-col bg-white border-r border-gray-200 shadow-sm`}
    >
      {/* Logo y Toggle */}
      <div className="p-3 flex items-center justify-between border-b border-gray-100 bg-gray-50">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            {organizationLogo ? (
              <img src={organizationLogo} alt="Logo" className="h-7 w-7" />
            ) : (
              <div className="h-7 w-7 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-full shadow-sm" />
            )}
            <span className="text-sm font-semibold text-gray-800">CRM Viajes</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-all duration-200 ease-in-out"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Información del usuario */}
      <div className={`p-3 border-b border-gray-100 bg-gray-50 ${isCollapsed ? 'text-center' : ''}`}>
        {!isCollapsed && (
          <>
            <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out`}
            >
              <item.icon
                className={`${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                } ${isCollapsed ? 'mx-auto' : 'mr-2'} h-4 w-4 flex-shrink-0 transition-colors duration-200`}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Botón de Cerrar Sesión */}
      <div className="p-2 border-t border-gray-100 bg-gray-50">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 ease-in-out"
        >
          <ArrowRightOnRectangleIcon
            className={`${isCollapsed ? 'mx-auto' : 'mr-2'} h-4 w-4 flex-shrink-0`}
          />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}; 