import React, { useState } from 'react';
import { isValidEmail } from '@/lib/utils/validations';

interface Organization {
  id: string;
  created_at: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (organization: Omit<Organization, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}

export const OrganizationForm = ({ organization, onSubmit, onCancel }: OrganizationFormProps) => {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    status: organization?.status || 'active',
    contact_name: organization?.contact_name || '',
    contact_email: organization?.contact_email || '',
    contact_phone: organization?.contact_phone || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'El nombre del contacto es requerido';
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'El email del contacto es requerido';
    } else if (!isValidEmail(formData.contact_email)) {
      newErrors.contact_email = 'El formato del email no es válido';
    }

    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = 'El teléfono del contacto es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Enviando datos del formulario:', formData);
      
      // Asegurarnos de que todos los campos estén correctamente formateados
      const formattedData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        contact_name: formData.contact_name.trim(),
        contact_email: formData.contact_email.trim().toLowerCase(),
        contact_phone: formData.contact_phone.trim(),
      };

      await onSubmit(formattedData);
      console.log('Formulario enviado exitosamente');
      onCancel(); // Cerramos el modal después de un envío exitoso
    } catch (error) {
      console.error('Error en el formulario:', error);
      
      // Mostrar el error en el formulario
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al guardar la organización';
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
      
      // También establecer el error general
      setError(errorMessage);
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
        <div className="sm:col-span-2 form-group">
          <label htmlFor="name" className="form-label">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            placeholder="Ingrese el nombre de la organización"
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div className="sm:col-span-2 form-group">
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
            placeholder="Describa la organización"
          />
          {errors.description && <p className="form-error">{errors.description}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="status" className="form-label">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Organization['status'] })}
            className="form-select"
          >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </select>
        </div>

        <div className="sm:col-span-2 mt-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Información de contacto</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="form-group">
              <label htmlFor="contact_name" className="form-label">
                Nombre del contacto
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="form-input"
                placeholder="Ingrese el nombre del contacto"
              />
              {errors.contact_name && <p className="form-error">{errors.contact_name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="contact_email" className="form-label">
                Email del contacto
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="form-input"
                placeholder="contacto@empresa.com"
              />
              {errors.contact_email && <p className="form-error">{errors.contact_email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="contact_phone" className="form-label">
                Teléfono del contacto
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="form-input"
                placeholder="+54 9 11 1234-5678"
              />
              {errors.contact_phone && <p className="form-error">{errors.contact_phone}</p>}
            </div>
          </div>
        </div>
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
          {isSubmitting ? 'Guardando...' : organization ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
};
