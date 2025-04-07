import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GmailToken {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
}

export function useGmail() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const checkGmailConnection = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('gmail_credentials')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setIsConnected(false);
            setIsLoading(false);
            return;
          }
          
          console.error('Error checking Gmail connection:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          return;
        }

        setIsConnected(!!data);
      } catch (error) {
        console.error('Error checking Gmail connection:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error)
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkGmailConnection();
  }, [user?.id]);

  const connectGmail = async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      if (!clientId) {
        throw new Error(
          'Error de configuración: NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado. ' +
          'Por favor, configura esta variable de entorno en tu archivo .env.local'
        );
      }

      if (!user?.id) {
        throw new Error('Debes iniciar sesión antes de conectar Gmail');
      }

      const redirectUri = `${siteUrl}/api/auth/google/callback`;
      const scope = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly';
      
      console.log('Configuración de Gmail:');
      console.log('- Client ID:', clientId.substring(0, 20) + '...');
      console.log('- Redirect URI:', redirectUri);
      console.log('- Scope:', scope);
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scope);
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');
      
      console.log('Redirigiendo a:', authUrl.toString());
      
      // Agregar un manejador para detectar si la URL contiene un error
      const handleRedirectError = () => {
        const currentUrl = new URL(window.location.href);
        const error = currentUrl.searchParams.get('error');
        if (error === 'access_denied') {
          throw new Error(
            'Acceso denegado: Esta aplicación está en modo de prueba. ' +
            'Por favor, contacta al administrador para que agregue tu correo como usuario de prueba en Google Cloud Console.'
          );
        }
      };

      // Verificar si ya hay un error en la URL actual
      handleRedirectError();
      
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Error al iniciar la conexión con Gmail:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No se pudo iniciar la conexión con Gmail. Por favor, verifica la configuración.');
    }
  };

  const disconnectGmail = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('gmail_credentials')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      throw error;
    }
  };

  const sendEmail = async ({
    to,
    subject,
    body,
    scheduledFor,
  }: {
    to: string[];
    subject: string;
    body: string;
    scheduledFor?: Date;
  }) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          body,
          scheduledFor: scheduledFor?.toISOString(),
        },
      });

      if (error) throw error;

      // Guardar el email enviado en la base de datos
      const { error: saveError } = await supabase.from('emails').insert({
        user_id: user.id,
        to: to.join(', '),
        subject,
        body,
        scheduled_for: scheduledFor,
        status: scheduledFor ? 'scheduled' : 'sent',
        direction: 'outbound',
      });

      if (saveError) throw saveError;

      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  };

  return {
    isConnected,
    isLoading,
    connectGmail,
    disconnectGmail,
    sendEmail,
  };
} 