import React, { useState, useEffect } from 'react';
import { Budget, Contact } from '@/types/supabase';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

interface BudgetFormProps {
  budget?: Budget;
  onSubmit: (budget: Omit<Budget, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}

export const BudgetForm = ({ budget, onSubmit, onCancel }: BudgetFormProps) => {
  const { user, currentOrganization, currentBranch } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [formData, setFormData] = useState({
    title: budget?.title || '',
    description: budget?.description || '',
    rates: budget?.rates || '',
    status: budget?.status || 'draft',
    contact_id: budget?.contact_id || '',
    organization_id: budget?.organization_id || currentOrganization?.id || '',
    branch_id: budget?.branch_id || currentBranch?.id || '',
    created_by: budget?.created_by || user?.id || '',
    responsible: budget?.responsible || user?.full_name || '',
    valid_until: budget?.valid_until || '',
    payment_terms: budget?.payment_terms || '',
    notes: budget?.notes || '',
    slug: budget?.slug || '',
    theme_settings: budget?.theme_settings || {
      logo_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      font_family: 'Inter',
      header_style: 'modern'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Asegurarse de que los IDs de organización y sucursal estén siempre establecidos
    if (!formData.organization_id && currentOrganization?.id) {
      setFormData(prev => ({
        ...prev,
        organization_id: currentOrganization.id
      }));
    }
    if (!formData.branch_id && currentBranch?.id) {
      setFormData(prev => ({
        ...prev,
        branch_id: currentBranch.id
      }));
    }
  }, [currentOrganization?.id, currentBranch?.id]);

  useEffect(() => {
    const fetchContacts = async () => {
      const supabase = createClient();
      
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('organization_id', currentOrganization?.id)
          .order('full_name');
        
        if (error) {
          console.error('Error fetching contacts:', error);
          return;
        }

        setContacts(data || []);

        // Si estamos editando un presupuesto existente, seleccionar el contacto
        if (budget?.contact_id && data) {
          const existingContact = data.find(c => c.id === budget.contact_id);
          if (existingContact) {
            setSelectedContact(existingContact);
          }
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    if (currentOrganization?.id) {
      fetchContacts();
    }
  }, [budget?.contact_id, currentOrganization?.id]);

  const filteredContacts = query === ''
    ? contacts
    : contacts.filter((contact) => {
        const searchTerm = query.toLowerCase();
        return (
          contact.full_name.toLowerCase().includes(searchTerm) ||
          contact.email.toLowerCase().includes(searchTerm) ||
          contact.phone.toLowerCase().includes(searchTerm)
        );
      });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.contact_id) {
      newErrors.contact_id = 'El contacto es requerido';
    }

    if (!formData.organization_id) {
      newErrors.organization_id = 'La organización es requerida';
    }

    if (!formData.branch_id) {
      newErrors.branch_id = 'La sucursal es requerida';
    }

    if (!formData.valid_until) {
      newErrors.valid_until = 'La fecha de validez es requerida';
    }

    if (!formData.payment_terms.trim()) {
      newErrors.payment_terms = 'Los términos de pago son requeridos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate slug from contact name
      if (!selectedContact) {
        throw new Error('Debe seleccionar un contacto');
      }

      const slug = selectedContact.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      await onSubmit({
        ...formData,
        slug
      });
    } catch (error) {
      console.error('Error submitting budget:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Ocurrió un error al guardar el presupuesto. Por favor, intente nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="form-group sm:col-span-2">
          <label htmlFor="contact" className="form-label">
            Contacto
          </label>
          <Combobox value={selectedContact} onChange={(contact: Contact | null) => {
            setSelectedContact(contact);
            if (contact) {
              setFormData(prev => ({
                ...prev,
                contact_id: contact.id
              }));
            }
          }}>
            <div className="relative mt-1">
              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                <Combobox.Input
                  className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                  displayValue={(contact: Contact | null) => contact?.full_name || ''}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar contacto..."
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </Combobox.Button>
              </div>
              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                {filteredContacts.length === 0 && query !== '' ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    No se encontraron contactos.
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <Combobox.Option
                      key={contact.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-blue-600 text-white' : 'text-gray-900'
                        }`
                      }
                      value={contact}
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {contact.full_name} - {contact.email}
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? 'text-white' : 'text-blue-600'
                              }`}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
          {errors.contact_id && <p className="form-error">{errors.contact_id}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Título
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="form-input"
            placeholder="Ingrese el título del presupuesto"
          />
          {errors.title && <p className="form-error">{errors.title}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="responsible" className="form-label">
            Responsable
          </label>
          <input
            type="text"
            id="responsible"
            name="responsible"
            value={formData.responsible}
            readOnly
            className="form-input bg-gray-50"
          />
        </div>

        <div className="form-group sm:col-span-2">
          <label htmlFor="description" className="form-label">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-input"
            placeholder="Describa los detalles del presupuesto"
          />
          {errors.description && <p className="form-error">{errors.description}</p>}
        </div>

        <div className="form-group sm:col-span-2">
          <label htmlFor="rates" className="form-label">
            Tarifas
          </label>
          <textarea
            id="rates"
            name="rates"
            rows={4}
            value={formData.rates}
            onChange={(e) => setFormData({ ...formData, rates: e.target.value })}
            className="form-input"
            placeholder="Detalle las tarifas del presupuesto"
          />
        </div>

        <div className="form-group">
          <label htmlFor="valid_until" className="form-label">
            Válido hasta
          </label>
          <input
            type="date"
            id="valid_until"
            name="valid_until"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            className="form-input"
          />
          {errors.valid_until && <p className="form-error">{errors.valid_until}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="payment_terms" className="form-label">
            Términos de pago
          </label>
          <input
            type="text"
            id="payment_terms"
            name="payment_terms"
            value={formData.payment_terms}
            onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
            className="form-input"
            placeholder="Ej: 50% adelanto, 50% antes del viaje"
          />
          {errors.payment_terms && <p className="form-error">{errors.payment_terms}</p>}
        </div>

        <div className="form-group sm:col-span-2">
          <label htmlFor="notes" className="form-label">
            Notas adicionales
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="form-input"
            placeholder="Agregue notas o comentarios adicionales"
          />
        </div>

        <div className="form-group sm:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personalización del presupuesto</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="logo_url" className="form-label">
                URL del Logo
              </label>
              <input
                type="text"
                id="logo_url"
                name="logo_url"
                value={formData.theme_settings.logo_url}
                onChange={(e) => setFormData({
                  ...formData,
                  theme_settings: {
                    ...formData.theme_settings,
                    logo_url: e.target.value
                  }
                })}
                className="form-input"
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>

            <div>
              <label htmlFor="font_family" className="form-label">
                Tipografía
              </label>
              <select
                id="font_family"
                name="font_family"
                value={formData.theme_settings.font_family}
                onChange={(e) => setFormData({
                  ...formData,
                  theme_settings: {
                    ...formData.theme_settings,
                    font_family: e.target.value
                  }
                })}
                className="form-select"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Open Sans">Open Sans</option>
              </select>
            </div>

            <div>
              <label htmlFor="primary_color" className="form-label">
                Color Principal
              </label>
              <input
                type="color"
                id="primary_color"
                name="primary_color"
                value={formData.theme_settings.primary_color}
                onChange={(e) => setFormData({
                  ...formData,
                  theme_settings: {
                    ...formData.theme_settings,
                    primary_color: e.target.value
                  }
                })}
                className="form-input h-10"
              />
            </div>

            <div>
              <label htmlFor="secondary_color" className="form-label">
                Color Secundario
              </label>
              <input
                type="color"
                id="secondary_color"
                name="secondary_color"
                value={formData.theme_settings.secondary_color}
                onChange={(e) => setFormData({
                  ...formData,
                  theme_settings: {
                    ...formData.theme_settings,
                    secondary_color: e.target.value
                  }
                })}
                className="form-input h-10"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="header_style" className="form-label">
                Estilo del Encabezado
              </label>
              <select
                id="header_style"
                name="header_style"
                value={formData.theme_settings.header_style}
                onChange={(e) => setFormData({
                  ...formData,
                  theme_settings: {
                    ...formData.theme_settings,
                    header_style: e.target.value
                  }
                })}
                className="form-select"
              >
                <option value="modern">Moderno</option>
                <option value="classic">Clásico</option>
                <option value="minimal">Minimalista</option>
              </select>
            </div>
          </div>
        </div>

        {budget && (
          <div className="form-group">
            <label htmlFor="status" className="form-label">
              Estado
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Budget['status'] })}
              className="form-select"
            >
              <option value="draft">Borrador</option>
              <option value="sent">Enviado</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="expired">Vencido</option>
            </select>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="form-button-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="form-button-primary"
        >
          {isSubmitting ? 'Guardando...' : budget ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}; 