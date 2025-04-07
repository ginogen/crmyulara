import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Contact } from '@/types/supabase';
import { ContactForm } from '@/components/forms/ContactForm';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
  onSubmit: (contact: Omit<Contact, 'id' | 'created_at'>) => Promise<void>;
}

export const ContactModal = ({
  isOpen,
  onClose,
  contact,
  onSubmit,
}: ContactModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{contact ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>
          <DialogDescription>
            {contact ? 'Modifica los datos del contacto existente.' : 'Ingresa los datos para crear un nuevo contacto.'}
          </DialogDescription>
        </DialogHeader>
        <ContactForm
          contact={contact}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}; 