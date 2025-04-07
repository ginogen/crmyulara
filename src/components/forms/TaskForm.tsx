import React, { useState } from 'react';
import { Task } from '@/types/supabase';

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}

export const TaskForm = ({ task, onSubmit, onCancel }: TaskFormProps) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    due_date: task?.due_date || '',
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    related_to_type: task?.related_to_type || 'lead',
    related_to_id: task?.related_to_id || '',
    assigned_to: task?.assigned_to || '',
    organization_id: task?.organization_id || '',
    branch_id: task?.branch_id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'La fecha de vencimiento es requerida';
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
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting task:', error);
      setErrors({
        submit: 'Ocurrió un error al guardar la tarea. Por favor, intente nuevamente.',
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
            placeholder="Ingrese el título de la tarea"
          />
          {errors.title && <p className="form-error">{errors.title}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="due_date" className="form-label">
            Fecha de vencimiento
          </label>
          <input
            type="datetime-local"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="form-input"
          />
          {errors.due_date && <p className="form-error">{errors.due_date}</p>}
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
            placeholder="Describa la tarea en detalle"
          />
          {errors.description && <p className="form-error">{errors.description}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="priority" className="form-label">
            Prioridad
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
            className="form-select"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status" className="form-label">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
            className="form-select"
          >
            <option value="pending">Pendiente</option>
            <option value="completed">Completada</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="related_to_type" className="form-label">
            Relacionado a
          </label>
          <select
            id="related_to_type"
            name="related_to_type"
            value={formData.related_to_type}
            onChange={(e) => setFormData({ ...formData, related_to_type: e.target.value as Task['related_to_type'] })}
            className="form-select"
          >
            <option value="lead">Lead</option>
            <option value="contact">Contacto</option>
          </select>
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
          {isSubmitting ? 'Guardando...' : task ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}; 