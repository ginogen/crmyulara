"use client"

import React, { useState } from 'react';
import { Lead } from '@/types/supabase';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (lead: Omit<Lead, 'id' | 'created_at' | 'inquiry_number'>) => Promise<void>;
  onCancel: () => void;
  organizationId: string;
  branchId: string;
}

export const LeadForm = ({ lead, onSubmit, onCancel, organizationId, branchId }: LeadFormProps) => {
  const [formData, setFormData] = useState<Omit<Lead, 'id' | 'created_at' | 'inquiry_number'>>({
    full_name: lead?.full_name || '',
    phone: lead?.phone || '',
    status: lead?.status || 'new',
    assigned_to: lead?.assigned_to || '',
    origin: lead?.origin || '',
    province: lead?.province || '',
    pax_count: lead?.pax_count || 1,
    estimated_travel_date: lead?.estimated_travel_date || '',
    organization_id: organizationId,
    branch_id: branchId,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error("El nombre completo es requerido");
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error("El teléfono es requerido");
      return false;
    }

    if (!formData.origin.trim()) {
      toast.error("El origen es requerido");
      return false;
    }

    if (!formData.province.trim()) {
      toast.error("La provincia es requerida");
      return false;
    }

    if (!formData.estimated_travel_date) {
      toast.error("La fecha estimada de viaje es requerida");
      return false;
    }

    if (!organizationId || !branchId) {
      toast.error("Faltan datos de organización o sucursal");
      return false;
    }

    return true;
  };

  const handleChange = (name: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...formData,
        organization_id: organizationId,
        branch_id: branchId,
      };
      await onSubmit(dataToSubmit);
      toast.success(lead ? "Lead actualizado correctamente" : "Lead creado correctamente");
    } catch (error: any) {
      console.error('Error en el formulario:', error);
      toast.error(error.message || "Error al guardar el lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{lead ? 'Editar Lead' : 'Nuevo Lead'}</CardTitle>
          <CardDescription>
            Complete los datos del lead para {lead ? 'actualizarlo' : 'crearlo'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Ingrese el nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="assigned">Asignado</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="followed">Seguido</SelectItem>
                  <SelectItem value="interested">Interesado</SelectItem>
                  <SelectItem value="reserved">Reservado</SelectItem>
                  <SelectItem value="liquidated">Liquidado</SelectItem>
                  <SelectItem value="effective_reservation">Reserva Efectiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origen</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                placeholder="Ej: Facebook, Instagram, Referido"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => handleChange('province', e.target.value)}
                placeholder="Ingrese la provincia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pax_count">Cantidad de pasajeros</Label>
              <Input
                id="pax_count"
                type="number"
                min="1"
                value={formData.pax_count}
                onChange={(e) => handleChange('pax_count', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_travel_date">Fecha estimada de viaje</Label>
              <Input
                id="estimated_travel_date"
                type="text"
                value={formData.estimated_travel_date}
                onChange={(e) => handleChange('estimated_travel_date', e.target.value)}
                placeholder="Ej: 15/10/2024 o Diciembre 2024"
              />
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-end space-x-4 pt-6">
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
            {isSubmitting ? 'Guardando...' : lead ? 'Actualizar' : 'Crear'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}; 