// Comentado temporalmente para el deploy
/*
import { useEffect, useState } from 'react';
import { useSupabase } from './useSupabase';
import { useSession } from 'next-auth/react';

export interface GmailToken {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export function useGmail() {
  const { supabase } = useSupabase();
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkGmailConnection = async () => {
    try {
      if (!session?.user?.id) {
        setIsConnected(false);
        return;
      }

      const { data, error } = await supabase
        .from('gmail_credentials')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error checking Gmail connection:', {
          error,
          userId: session.user.id,
        });
        setIsConnected(false);
        return;
      }

      setIsConnected(!!data);
    } catch (error) {
      console.error('Error checking Gmail connection:', {
        error,
        userId: session?.user?.id,
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkGmailConnection();
  }, [session?.user?.id]);

  const connectGmail = async () => {
    try {
      setIsLoading(true);

      // Verificar si el usuario está autenticado
      if (!session?.user?.id) {
        throw new Error('Debes iniciar sesión antes de conectar Gmail');
      }

      // Configurar los parámetros de OAuth
      const scope = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly';

      // Log de la configuración para debugging
      console.log('Configuración de Gmail:', {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        redirectUri: `${window.location.origin}/api/auth/google/callback`,
        scope,
      });

      // Construir la URL de autorización
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        redirect_uri: `${window.location.origin}/api/auth/google/callback`,
        response_type: 'code',
        scope,
        access_type: 'offline',
        prompt: 'consent',
      });

      // Redirigir al usuario a la página de autorización de Google
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (error) {
      console.error('Error al iniciar la conexión con Gmail:', error);
      setIsLoading(false);

      // Propagar el error para que pueda ser manejado por el componente
      throw new Error('No se pudo iniciar la conexión con Gmail. Por favor, verifica la configuración.');
    }
  };

  const disconnectGmail = async () => {
    try {
      setIsLoading(true);

      if (!session?.user?.id) return;

      const { error } = await supabase
        .from('gmail_credentials')
        .delete()
        .eq('user_id', session.user.id);

      if (error) throw error;

      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async ({
    to,
    subject,
    body,
  }: {
    to: string;
    subject: string;
    body: string;
  }) => {
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          body,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el correo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al enviar el correo:', error);
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
*/

// Exportamos una versión temporal del hook que no hace nada
export function useGmail() {
  return {
    isConnected: false,
    isLoading: false,
    connectGmail: () => Promise.resolve(),
    disconnectGmail: () => Promise.resolve(),
    sendEmail: () => Promise.resolve({}),
  };
} 