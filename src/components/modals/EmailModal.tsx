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
            <label className="text-sm font-medium">Para:</label>
            <div className="mt-1 p-2 border rounded-md bg-gray-50">
              {contacts.map(contact => (
                <span key={contact.id} className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                  {contact.email}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Asunto:</label>
            <Input
              value={subject}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
              placeholder="Ingrese el asunto"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Mensaje:</label>
            <Textarea
              value={body}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
              placeholder="Escriba su mensaje"
              className="mt-1"
              rows={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Programar envío (opcional):</label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setScheduledFor(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !subject || !body}
            >
              {isSending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 