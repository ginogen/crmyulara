import { createClient } from '@/lib/supabase/client';

// Crear un cliente Supabase
const supabase = createClient();

// Eventos personalizados para notificar cambios en la sesión
const SESSION_UPDATED_EVENT = 'supabase:session-updated';
const SESSION_REMOVED_EVENT = 'supabase:session-removed';
const SESSION_EXPIRED_EVENT = 'supabase:session-expired';

// Intervalo de verificación de expiración (5 minutos)
const CHECK_INTERVAL = 5 * 60 * 1000;

// Función para inicializar la sincronización de sesión
export function initSessionSync() {
  let checkIntervalId: NodeJS.Timeout | null = null;
  
  // Escuchar cambios en la sesión de Supabase
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state change event:', event);
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      console.log('Session updated:', {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
      });
      
      // Iniciar comprobación periódica de expiración si no está activa
      if (!checkIntervalId && session) {
        startExpirationCheck(session.expires_at);
      }
      
      // Disparar evento personalizado para notificar a otros componentes
      window.dispatchEvent(new CustomEvent(SESSION_UPDATED_EVENT, { 
        detail: { session } 
      }));
    }
    
    if (event === 'SIGNED_OUT') {
      console.log('Session removed');
      
      // Detener comprobación periódica
      if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
      }
      
      // Disparar evento personalizado para notificar a otros componentes
      window.dispatchEvent(new CustomEvent(SESSION_REMOVED_EVENT));
    }
  });

  // Función para iniciar la comprobación periódica de expiración
  function startExpirationCheck(expiresAt?: number) {
    // Limpiar el intervalo existente si hay uno
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
      checkIntervalId = null;
    }
    
    // Verificar la sesión inmediatamente
    checkSessionExpiration(expiresAt);
    
    // Configurar verificación periódica
    checkIntervalId = setInterval(() => {
      checkSessionExpiration(expiresAt);
    }, CHECK_INTERVAL);
  }
  
  // Función para verificar si la sesión está por expirar
  async function checkSessionExpiration(expiresAtTimestamp?: number) {
    try {
      // Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session found during check');
        // Notificar que no hay sesión
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
        return;
      }
      
      const expiresAt = session.expires_at || expiresAtTimestamp;
      
      if (!expiresAt) {
        console.log('Session has no expiration timestamp');
        return;
      }
      
      // Calcular tiempo restante en segundos
      const currentTime = Math.floor(Date.now() / 1000);
      const timeRemaining = expiresAt - currentTime;
      
      console.log(`Session check: ${timeRemaining} seconds remaining`);
      
      // Si quedan menos de 10 minutos, actualizar automáticamente
      if (timeRemaining < 600) {
        console.log('Session expiring soon, refreshing...');
        await refreshSession();
      }
      
    } catch (error) {
      console.error('Error checking session expiration:', error);
    }
  }
  
  // Iniciar primera comprobación al cargar
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.expires_at) {
      startExpirationCheck(session.expires_at);
    }
  });
  
  // Retornar función de limpieza para desuscribirse
  return () => {
    subscription.unsubscribe();
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
    }
  };
}

// Hook para escuchar cambios de sesión
export function listenToSessionChanges(
  onSessionUpdated: (session: any) => void,
  onSessionRemoved?: () => void,
  onSessionExpired?: () => void
) {
  if (typeof window === 'undefined') return { cleanup: () => {} };
  
  const handleSessionUpdated = (event: any) => {
    onSessionUpdated(event.detail.session);
  };
  
  const handleSessionRemoved = () => {
    if (onSessionRemoved) onSessionRemoved();
  };
  
  const handleSessionExpired = () => {
    if (onSessionExpired) onSessionExpired();
  };
  
  window.addEventListener(SESSION_UPDATED_EVENT, handleSessionUpdated);
  
  if (onSessionRemoved) {
    window.addEventListener(SESSION_REMOVED_EVENT, handleSessionRemoved);
  }
  
  if (onSessionExpired) {
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }
  
  // Devolver función de limpieza
  return {
    cleanup: () => {
      window.removeEventListener(SESSION_UPDATED_EVENT, handleSessionUpdated);
      if (onSessionRemoved) {
        window.removeEventListener(SESSION_REMOVED_EVENT, handleSessionRemoved);
      }
      if (onSessionExpired) {
        window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
      }
    }
  };
}

// Función para refrescar manualmente la sesión
export async function refreshSession() {
  try {
    // Agregar un timeout para evitar que la operación se quede colgada
    const timeout = 10000; // 10 segundos
    
    // Crear una promesa con timeout
    const refreshPromise = supabase.auth.refreshSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout al refrescar la sesión')), timeout)
    );
    
    // Competir entre ambas promesas
    const { data, error } = await Promise.race([
      refreshPromise,
      timeoutPromise.then(() => ({ data: null, error: new Error('Timeout al refrescar la sesión') }))
    ]) as any;
    
    if (error) {
      console.error('Error refreshing session:', error);
      
      // Si el error es relacionado con el token, notificar como sesión expirada
      if (
        error.message.includes('JWT') || 
        error.message.includes('token') || 
        error.message.includes('expired') ||
        error.message.includes('Timeout')
      ) {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      }
      
      return { error };
    }
    
    if (data?.session) {
      console.log('Session refreshed successfully', {
        userId: data.session.user.id,
        expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'N/A'
      });
      
      // Disparar evento de sesión actualizada
      window.dispatchEvent(new CustomEvent(SESSION_UPDATED_EVENT, { 
        detail: { session: data.session } 
      }));
    } else {
      console.log('No session after refresh');
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Error in refreshSession:', err);
    
    // Si hubo una excepción, notificar como sesión expirada
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    
    return { error: err };
  }
} 