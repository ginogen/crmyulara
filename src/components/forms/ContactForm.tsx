import React, { useState } from 'react';
import { Contact } from '@/types/supabase';
import { isValidEmail, isValidPhone } from '@/lib/utils/validations';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (contact: Omit<Contact, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}

export const ContactForm = ({ contact, onSubmit, onCancel }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    full_name: contact?.full_name || '',
    city: contact?.city || '',
    province: contact?.province || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    tag: contact?.tag || '',
    assigned_to: contact?.assigned_to || '',
    organization_id: contact?.organization_id || '',
    branch_id: contact?.branch_id || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error("El nombre es requerido");
      return false;
    }

    if (!formData.city.trim()) {
      toast.error("La ciudad es requerida");
      return false;
    }

    if (!formData.province.trim()) {
      toast.error("La provincia es requerida");
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error("El teléfono es requerido");
      return false;
    }

    if (formData.phone !== contact?.phone && !isValidPhone(formData.phone)) {
      toast.error("El formato del teléfono no es válido");
      return false;
    }

    if (formData.email && formData.email !== contact?.email && !isValidEmail(formData.email)) {
      toast.error("El formato del email no es válido");
      return false;
    }

    if (!formData.tag.trim()) {
      toast.error("La etiqueta es requerida");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      toast.success(contact ? "Contacto actualizado correctamente" : "Contacto creado correctamente");
    } catch (error: any) {
      console.error('Error submitting contact:', error);
      toast.error(error.message || "Error al guardar el contacto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ingrese el nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ejemplo@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ingrese la ciudad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Ingrese la provincia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag">Etiqueta</Label>
              <Input
                id="tag"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                placeholder="Ej: Cliente VIP, Referido, etc."
              />
            </div>
          </div>
        </CardContent>
        <Separator className="my-4" />
        <CardFooter className="flex justify-end space-x-4 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : contact ? 'Actualizar' : 'Crear'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}; 