import { useState, Fragment } from 'react';
import { BellIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import { useContacts } from '@/hooks/useContacts';
import { formatPhoneNumber } from '@/lib/utils/strings';
import { Contact } from '@/types/supabase';

interface Organization {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  organization_id: string;
}

interface TopbarProps {
  notifications?: number;
  onContactSelect?: (contact: Contact) => void;
}

export const Topbar = ({ notifications = 0, onContactSelect }: TopbarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { contacts } = useContacts();
  const { 
    user, 
    userRole, 
    currentOrganization, 
    currentBranch,
    organizations,
    branches,
    setCurrentOrganization,
    setCurrentBranch 
  } = useAuth();

  const handleOrganizationChange = (selectedOrg: Organization) => {
    setCurrentOrganization(selectedOrg);
    // Al cambiar la organización, seleccionar la primera sucursal disponible
    const firstBranch = branches.find(branch => branch.organization_id === selectedOrg.id);
    if (firstBranch) {
      setCurrentBranch(firstBranch);
    }
  };

  const handleBranchChange = (selectedBranch: Branch) => {
    setCurrentBranch(selectedBranch);
  };

  const filteredContacts = contacts.filter((contact) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      contact.full_name.toLowerCase().includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchTerm))
    );
  }).slice(0, 5); // Limitamos a 5 resultados

  const canChangeOrganization = userRole === 'super_admin';
  const canChangeBranch = userRole === 'super_admin' || userRole === 'org_admin';

  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Vista Switcher */}
        <div className="flex items-center space-x-2">
          {/* Selector de Organización */}
          {currentOrganization && (
            <Menu as="div" className="relative">
              <Menu.Button
                disabled={!canChangeOrganization}
                className="inline-flex items-center h-8 px-3 text-xs font-medium text-gray-700 rounded-lg border-0 bg-white/50 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-white/80 focus:ring-2 focus:ring-[#34495E] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentOrganization.name}
                {canChangeOrganization && (
                  <ChevronDownIcon className="w-4 h-4 ml-1 -mr-1 text-gray-400" aria-hidden="true" />
                )}
              </Menu.Button>
              {canChangeOrganization && (
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute left-0 z-10 mt-1 w-48 origin-top-left rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      {organizations.map((org) => (
                        <Menu.Item key={org.id}>
                          {({ active }) => (
                            <button
                              onClick={() => handleOrganizationChange(org)}
                              className={`${
                                active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                              } ${
                                currentOrganization.id === org.id ? 'bg-gray-50' : ''
                              } group flex w-full items-center px-4 py-2 text-xs`}
                            >
                              {org.name}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              )}
            </Menu>
          )}

          {/* Selector de Sucursal */}
          {currentBranch && (
            <Menu as="div" className="relative">
              <Menu.Button
                disabled={!canChangeBranch}
                className="inline-flex items-center h-8 px-3 text-xs font-medium text-gray-700 rounded-lg border-0 bg-white/50 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-white/80 focus:ring-2 focus:ring-[#34495E] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentBranch.name}
                {canChangeBranch && (
                  <ChevronDownIcon className="w-4 h-4 ml-1 -mr-1 text-gray-400" aria-hidden="true" />
                )}
              </Menu.Button>
              {canChangeBranch && (
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute left-0 z-10 mt-1 w-48 origin-top-left rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      {branches
                        .filter(branch => !currentOrganization || branch.organization_id === currentOrganization.id)
                        .map((branch) => (
                          <Menu.Item key={branch.id}>
                            {({ active }) => (
                              <button
                                onClick={() => handleBranchChange(branch)}
                                className={`${
                                  active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                } ${
                                  currentBranch.id === branch.id ? 'bg-gray-50' : ''
                                } group flex w-full items-center px-4 py-2 text-xs`}
                              >
                                {branch.name}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                    </div>
                  </Menu.Items>
                </Transition>
              )}
            </Menu>
          )}
        </div>

        {/* Barra de búsqueda */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="h-8 block w-full pl-8 pr-3 text-xs border-0 bg-white/50 backdrop-blur-sm text-gray-900 rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-[#34495E] hover:bg-white/80 transition-all duration-200"
              placeholder="Buscar contactos por nombre, email o teléfono..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(e.target.value.length > 0);
              }}
              onBlur={() => {
                // Pequeño delay para permitir que se detecte el clic en los resultados
                setTimeout(() => setIsSearching(false), 200);
              }}
              onFocus={() => setIsSearching(searchQuery.length > 0)}
            />
            
            {/* Resultados de búsqueda */}
            {isSearching && filteredContacts.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto z-50">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    onClick={() => {
                      if (onContactSelect) {
                        onContactSelect(contact);
                      }
                      setSearchQuery('');
                      setIsSearching(false);
                    }}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {contact.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {contact.email && <span className="mr-2">{contact.email}</span>}
                      {contact.phone && <span>{formatPhoneNumber(contact.phone)}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notificaciones */}
        <Menu as="div" className="relative">
          <Menu.Button className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#34495E] transition-all duration-200">
            <BellIcon className="h-4 w-4 text-gray-500" />
            {notifications > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#34495E] ring-2 ring-white animate-pulse" />
            )}
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-1 w-72 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
              <div className="p-2">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } flex items-center px-3 py-2 text-xs font-medium text-gray-700 rounded-md transition-colors duration-150`}
                    >
                      Tareas pendientes del día
                    </a>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
}; 