'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    full_name: string;
    phone: string;
  };
}

interface Template {
  id: string;
  name: string;
  content: string;
}

export function WhatsAppModal({ isOpen, onClose, contact }: WhatsAppModalProps) {
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const { currentOrganization, user } = useAuth();

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!currentOrganization) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('organization_id', currentOrganization.id);
      
      if (error) {
        console.error('Error fetching templates:', error);
        toast.error('Error al cargar las plantillas');
        return;
      }

      setTemplates(data || []);
    };

    fetchTemplates();
  }, [currentOrganization]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      let content = template.content;
      // Reemplazar variables
      content = content.replace(/\{nombre\}/g, contact.full_name);
      setMessage(content);
    }
  };

  const handleSaveTemplate = async () => {
    if (!message.trim() || !currentOrganization) return;

    const supabase = createClient();
    const templateName = prompt('Nombre de la plantilla:');
    if (!templateName) return;

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .insert([
        {
          name: templateName,
          content: message,
          organization_id: currentOrganization.id
        }
      ])
      .select();

    if (error) {
      console.error('Error saving template:', error);
      toast.error('Error al guardar la plantilla');
      return;
    }

    if (data) {
      setTemplates([...templates, data[0]]);
      toast.success('Plantilla guardada correctamente');
    }
  };

  const saveMessageToHistory = async () => {
    if (!currentOrganization || !user) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert([
        {
          contact_id: contact.id,
          message: message,
          organization_id: currentOrganization.id,
          sent_by: user.id
        }
      ]);

    if (error) {
      console.error('Error saving message to history:', error);
      toast.error('Error al guardar el mensaje en el historial');
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    
    // Formatear número de teléfono (eliminar espacios y caracteres especiales)
    const phoneNumber = contact.phone.replace(/\D/g, '');
    
    // Crear URL de WhatsApp Web usando el formato wa.me
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Guardar en el historial
    await saveMessageToHistory();
    
    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank');
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enviar mensaje por WhatsApp a {contact.full_name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Plantillas:</label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Mensaje:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí"
              rows={6}
            />
            <p className="text-xs text-gray-500">
              Variables disponibles: {"{nombre}"} - Nombre del contacto
            </p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleSaveTemplate}>
              Guardar como plantilla
            </Button>
            <Button onClick={handleSend}>
              Enviar por WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 