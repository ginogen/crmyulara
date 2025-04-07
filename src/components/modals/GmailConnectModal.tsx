import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGmail } from "@/hooks/useGmail";

interface GmailConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GmailConnectModal({ isOpen, onClose }: GmailConnectModalProps) {
  const { connectGmail } = useGmail();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Conectar Gmail</DialogTitle>
          <DialogDescription>
            Conecta tu cuenta de Gmail para poder enviar y recibir correos directamente desde la aplicación.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/gmail-logo.png"
              alt="Gmail Logo"
              className="w-16 h-16"
            />
            <p className="text-sm text-gray-500 text-center">
              Al conectar tu cuenta de Gmail, podrás:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-500">
              <li>Enviar correos a tus contactos</li>
              <li>Programar envíos de correos</li>
              <li>Ver el historial de correos enviados</li>
              <li>Recibir notificaciones de respuestas</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={connectGmail}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
            </svg>
            Conectar Gmail
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 