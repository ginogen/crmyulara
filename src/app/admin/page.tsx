'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';
import { UserIcon, BuildingOfficeIcon, BuildingStorefrontIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';

const modules = [
  {
    name: 'Organizaciones',
    description: 'Gestionar organizaciones y sus configuraciones',
    href: '/admin/organizations',
    icon: BuildingOfficeIcon,
    color: 'bg-blue-500',
    role: 'super_admin' as UserRole,
  },
  {
    name: 'Sucursales',
    description: 'Administrar sucursales y sus detalles',
    href: '/admin/branches',
    icon: BuildingStorefrontIcon,
    color: 'bg-green-500',
    role: 'org_admin' as UserRole,
  },
  {
    name: 'Usuarios',
    description: 'Gestionar usuarios y sus roles',
    href: '/admin/users',
    icon: UsersIcon,
    color: 'bg-purple-500',
    role: 'org_admin' as UserRole,
  },
  {
    name: 'Mi Perfil',
    description: 'Ver y editar tu información personal',
    href: '/admin/profile',
    icon: UserIcon,
    color: 'bg-yellow-500',
    role: 'sales_agent' as UserRole,
  },
];

export default function AdminPage() {
  const { user, currentOrganization, currentBranch, userRole } = useAuth();

  const availableModules = modules.filter((module) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'org_admin') return module.role !== 'super_admin';
    if (userRole === 'branch_manager') return module.role === 'sales_agent';
    return module.role === 'sales_agent';
  });

  return (
    <MainLayout 
      user={{
        role: userRole as UserRole,
        email: user?.email || '',
        name: user?.full_name || '',
      }}
      organization={currentOrganization ? {
        name: currentOrganization.custom_name
      } : undefined}
      branch={currentBranch ? {
        name: currentBranch.name
      } : undefined}
    >
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Administración</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableModules.map((module) => (
            <Link
              key={module.name}
              href={module.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg overflow-hidden hover:bg-gray-50"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ring-4 ring-white ${module.color}`}>
                  <module.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {module.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{module.description}</p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                aria-hidden="true"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 