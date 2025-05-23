import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface MainLayoutProps {
  children: ReactNode;
  user: {
    role: 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';
    email: string;
    name: string;
  };
  organization?: {
    name: string;
    logo?: string;
  };
  branch?: {
    name: string;
  };
  notifications?: number;
}

export const MainLayout = ({
  children,
  user,
  organization,
  branch,
  notifications,
}: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <Sidebar
        userRole={user.role}
        userEmail={user.email}
        userName={user.name}
        organizationLogo={organization?.logo}
      />
      <div className="pl-64">
        <div className="sticky top-0 z-10 backdrop-blur-sm bg-white/70 border-b border-gray-200/80 shadow-sm">
          <Topbar
            notifications={notifications}
          />
        </div>
        <main className="p-4">
          <div className="space-y-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}; 