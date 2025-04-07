// Temporalmente comentado: Modal de envío de emails
/*
import { useState, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGmail } from '@/hooks/useGmail';
import { Contact } from '@/types/supabase';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
}

export function EmailModal({ isOpen, onClose, contacts }: EmailModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { sendEmail } = useGmail();

  const handleSend = async () => {
    setIsSending(true);
    try {
      await sendEmail({
        to: contacts.map(contact => contact.email),
        subject,
        body,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enviar Correo Electrónico</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700">
              Para
            </label>
            <div className="mt-1">
              <Input
                id="to"
                type="text"
                value={contacts.map(c => c.email).join(', ')}
                disabled
              />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Asunto
            </label>
            <div className="mt-1">
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                placeholder="Ingresa el asunto del correo"
              />
            </div>
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700">
              Mensaje
            </label>
            <div className="mt-1">
              <Textarea
                id="body"
                value={body}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                placeholder="Escribe tu mensaje aquí"
                rows={6}
              />
            </div>
          </div>
          <div>
            <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700">
              Programar envío (opcional)
            </label>
            <div className="mt-1">
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={scheduledFor}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setScheduledFor(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || !subject || !body}>
            {isSending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
*/

// Exportar un componente vacío para mantener la compatibilidad
export function EmailModal() {
  return null;
} 