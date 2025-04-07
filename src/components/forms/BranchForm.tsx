import React, { useState, useEffect } from 'react';
import { isValidEmail } from '@/lib/utils/validations';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  created_at: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  manager_id: string | null;
  organization_id: string;
}

interface BranchFormProps {
  branch?: Branch;
  onSubmit: (branch: Omit<Branch, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}

export const BranchForm = ({ branch, onSubmit, onCancel }: BranchFormProps) => {
  const { organizations, currentOrganization, userRole } = useAuth();
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    description: branch?.description || '',
    status: branch?.status || 'active',
    address: branch?.address || '',
    city: branch?.city || '',
    province: branch?.province || '',
    phone: branch?.phone || '',
    email: branch?.email || '',
    manager_id: branch?.manager_id || null,
    organization_id: branch?.organization_id || currentOrganization?.id || '',
  });

  useEffect(() => {
    if (!branch && currentOrganization) {
      setFormData(prev => ({
        ...prev,
        organization_id: currentOrganization.id
      }));
    }
  }, [currentOrganization, branch]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.province.trim()) {
      newErrors.province = 'La provincia es requerida';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (!formData.organization_id) {
      newErrors.organization_id = 'Debe seleccionar una organización';
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
    setErrors({});

    try {
      const submitData = {
        ...formData,
        manager_id: formData.manager_id || null,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting branch:', error);
      setErrors({
        submit: 'Ocurrió un error al guardar la sucursal. Por favor, intente nuevamente.',
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
        {userRole === 'super_admin' && (
          <div className="sm:col-span-2 form-group">
            <label htmlFor="organization_id" className="form-label">
              Organización
            </label>
            <select
              id="organization_id"
              name="organization_id"
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              className="form-select"
              disabled={userRole !== 'super_admin'}
            >
              <option value="">Seleccione una organización</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {errors.organization_id && (
              <p className="form-error">{errors.organization_id}</p>
            )}
          </div>
        )}

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
            placeholder="Ingrese el nombre de la sucursal"
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
            placeholder="Describa la sucursal"
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
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Branch['status'] })}
            className="form-select"
          >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </select>
        </div>

        <div className="sm:col-span-2 form-group">
          <label htmlFor="address" className="form-label">
            Dirección
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="form-input"
            placeholder="Ingrese la dirección completa"
          />
          {errors.address && <p className="form-error">{errors.address}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="city" className="form-label">
            Ciudad
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="form-input"
            placeholder="Ingrese la ciudad"
          />
          {errors.city && <p className="form-error">{errors.city}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="province" className="form-label">
            Provincia
          </label>
          <input
            type="text"
            id="province"
            name="province"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            className="form-input"
            placeholder="Ingrese la provincia"
          />
          {errors.province && <p className="form-error">{errors.province}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="form-input"
            placeholder="+54 9 11 1234-5678"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="form-input"
            placeholder="sucursal@empresa.com"
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
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
          {isSubmitting ? 'Guardando...' : branch ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}; 