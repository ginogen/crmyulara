import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGmail } from "@/hooks/useGmail";
import { Contact } from "@/types/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
}

export function SendEmailModal({ isOpen, onClose, selectedContacts }: SendEmailModalProps) {
  const { sendEmail } = useGmail();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject || !body) return;
    
    setIsSending(true);
    try {
      await sendEmail({
        to: selectedContacts.map(contact => contact.email),
        subject,
        body,
        scheduledFor: scheduleDate,
      });
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
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
          <div className="grid gap-2">
            <label className="text-sm font-medium">Para:</label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md">
              {selectedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded-full"
                >
                  <span>{contact.email}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Asunto:</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ingresa el asunto del correo"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Mensaje:</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu mensaje aquí"
              rows={6}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Programar envío (opcional):</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !scheduleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {scheduleDate ? (
                    format(scheduleDate, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduleDate}
                  onSelect={setScheduleDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || !subject || !body}>
            {isSending ? "Enviando..." : scheduleDate ? "Programar" : "Enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 