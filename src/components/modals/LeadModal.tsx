"use client"

import { Fragment } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lead } from '@/types/supabase';
import { LeadForm } from '@/components/forms/LeadForm';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead;
  onSubmit: (lead: Omit<Lead, 'id' | 'created_at' | 'inquiry_number'>) => Promise<void>;
  organizationId: string;
  branchId: string;
}

export const LeadModal = ({
  isOpen,
  onClose,
  lead,
  onSubmit,
  organizationId,
  branchId,
}: LeadModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{lead ? 'Editar Lead' : 'Nuevo Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? 'Modifica los datos del lead existente.' : 'Ingresa los datos para crear un nuevo lead.'}
          </DialogDescription>
        </DialogHeader>
        <LeadForm
          lead={lead}
          onSubmit={onSubmit}
          onCancel={onClose}
          organizationId={organizationId}
          branchId={branchId}
        />
      </DialogContent>
    </Dialog>
  );
}; 