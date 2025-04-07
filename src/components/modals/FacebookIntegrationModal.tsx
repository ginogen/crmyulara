import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FacebookService } from '@/services/facebook.service';
import { FacebookDBService } from '@/services/facebook-db.service';
import { FacebookAccount, FacebookForm } from '@/types/facebook';
import { useAuth } from '@/contexts/AuthContext';

interface FacebookIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FacebookIntegrationModal = ({
  isOpen,
  onClose,
}: FacebookIntegrationModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<FacebookAccount | null>(null);
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const { currentOrganization } = useAuth();

  useEffect(() => {
    if (isOpen) {
      initializeFacebook();
    }
  }, [isOpen]);

  const initializeFacebook = async () => {
    try {
      await FacebookService.initialize();
    } catch (error) {
      console.error('Error initializing Facebook:', error);
      setError('Error al inicializar la conexión con Facebook');
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await FacebookService.login();
      const accounts = await FacebookService.getAccounts();
      setAccounts(accounts);
    } catch (error: any) {
      console.error('Error en login de Facebook:', error);
      setError(error.message || 'Error al conectar con Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelect = async (account: FacebookAccount) => {
    setSelectedAccount(account);
    setSelectedForms(new Set());
  };

  const handleFormToggle = (formId: string) => {
    const newSelectedForms = new Set(selectedForms);
    if (newSelectedForms.has(formId)) {
      newSelectedForms.delete(formId);
    } else {
      newSelectedForms.add(formId);
    }
    setSelectedForms(newSelectedForms);
  };

  const handleSave = async () => {
    if (!selectedAccount || !currentOrganization) return;

    setIsLoading(true);
    setError(null);

    try {
      // Guardar la conexión en la base de datos
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60); // Token válido por 60 días

      const connection = await FacebookDBService.saveConnection(
        currentOrganization.id,
        selectedAccount.id,
        selectedAccount.name,
        'access_token_here', // TODO: Guardar el token real
        expiresAt
      );

      // Guardar los formularios seleccionados
      const selectedFormsList = selectedAccount.forms.filter(form => 
        selectedForms.has(form.id)
      );
      await FacebookDBService.saveForms(connection.id, selectedFormsList);

      // Configurar webhook para los formularios seleccionados
      await FacebookService.subscribeToFormLeads(
        selectedAccount.id,
        Array.from(selectedForms)
      );

      onClose();
    } catch (error: any) {
      console.error('Error guardando la configuración:', error);
      setError(error.message || 'Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Conectar con Facebook
                    </Dialog.Title>

                    <div className="mt-4">
                      {error && (
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                {error}
                              </h3>
                            </div>
                          </div>
                        </div>
                      )}

                      {!accounts.length ? (
                        <button
                          type="button"
                          onClick={handleFacebookLogin}
                          disabled={isLoading}
                          className="w-full flex justify-center items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          {isLoading ? 'Conectando...' : 'Iniciar sesión con Facebook'}
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Selecciona una página
                            </label>
                            <select
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={selectedAccount?.id || ''}
                              onChange={(e) => {
                                const account = accounts.find(a => a.id === e.target.value);
                                if (account) handleAccountSelect(account);
                              }}
                            >
                              <option value="">Seleccionar página...</option>
                              {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedAccount && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selecciona los formularios
                              </label>
                              <div className="space-y-2">
                                {selectedAccount.forms.map((form) => (
                                  <label
                                    key={form.id}
                                    className="flex items-center space-x-3"
                                  >
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={selectedForms.has(form.id)}
                                      onChange={() => handleFormToggle(form.id)}
                                    />
                                    <span className="text-sm text-gray-700">
                                      {form.name}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="button"
                              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                              onClick={handleSave}
                              disabled={isLoading || !selectedAccount || selectedForms.size === 0}
                            >
                              {isLoading ? 'Guardando...' : 'Guardar configuración'}
                            </button>
                            <button
                              type="button"
                              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                              onClick={onClose}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}; 