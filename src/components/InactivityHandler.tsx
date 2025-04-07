'use client';

import { useEffect, useState } from 'react';
import { useInactivityHandler } from '@/lib/inactivity-handler';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listenToSessionChanges } from '@/lib/supabase/sessionSync';

export function InactivityHandler() {
  const [showDialog, setShowDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const { refreshSession, signOut, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Solo activar el detector de inactividad si el usuario está autenticado
  const isAuthenticated = !!user;

  // Función para manejar la detección de inactividad
  const handleInactivityDetected = () => {
    if (isAuthenticated) {
      setSessionWarning('Tu sesión ha estado inactiva durante un tiempo.');
      setShowDialog(true);
    }
  };

  // Escuchar eventos de cambios en la sesión
  useEffect(() => {
    if (!isAuthenticated) return;

    const { cleanup } = listenToSessionChanges(
      // Al actualizar sesión
      (session) => {
        console.log('Sesión actualizada desde el listener', !!session);
        if (sessionWarning) {
          setShowDialog(false);
          setSessionWarning(null);
        }
      },
      // Al remover sesión
      () => {
        console.log('Sesión removida desde el listener');
        router.push('/login');
      },
      // Al expirar sesión
      () => {
        console.log('Sesión expirada desde el listener');
        setSessionWarning('Tu sesión ha expirado. Debes iniciar sesión nuevamente.');
        setShowDialog(true);
      }
    );

    return cleanup;
  }, [isAuthenticated, sessionWarning, router]);

  // Función para continuar la sesión
  const handleContinueSession = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    
    // Añadir un tiempo máximo de espera para el refresco de sesión
    let timeoutId: NodeJS.Timeout | null = null;
    const maxTimeout = 15000; // 15 segundos máximo de espera
    
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        console.error('Timeout al refrescar la sesión');
        resolve(null);
      }, maxTimeout);
    });
    
    try {
      console.log('Intentando refrescar la sesión...');
      
      // Competir entre la operación de refresco y el timeout
      const session = await Promise.race([
        refreshSession(),
        timeoutPromise
      ]);
      
      // Limpiar el timeout si la operación se completó antes
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (session) {
        // Invalidar todas las consultas para forzar la recarga de datos
        console.log('Sesión refrescada, actualizando datos...');
        queryClient.invalidateQueries();
        
        // Mostrar confirmación visual al usuario
        toast.success('Sesión actualizada correctamente');
        setSessionWarning(null);
        setShowDialog(false);
      } else {
        console.error('No se pudo obtener una sesión válida');
        setRefreshError('No se pudo renovar la sesión. Intente nuevamente o cierre sesión.');
        toast.error('No se pudo renovar la sesión. Intente nuevamente o cierre sesión.');
        // No cerrar el diálogo para permitir al usuario intentar de nuevo
        setIsRefreshing(false);
        return;
      }
    } catch (error) {
      console.error('Error al refrescar la sesión:', error);
      setRefreshError('Error al renovar la sesión. Intente nuevamente o cierre sesión.');
      toast.error('Error al renovar la sesión. Intente nuevamente o cierre sesión.');
      // No cerrar el diálogo para permitir al usuario intentar de nuevo
      setIsRefreshing(false);
      return;
    } finally {
      setIsRefreshing(false);
      // Asegurarse de que el timeout se limpie
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut();
      setShowDialog(false);
      setSessionWarning(null);
      queryClient.clear(); // Limpiar caché al cerrar sesión
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Usar el hook de inactividad solo si el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      setShowDialog(false);
      setSessionWarning(null);
    }
  }, [isAuthenticated]);

  useInactivityHandler(
    handleInactivityDetected,
    refreshSession,
    isAuthenticated ? 15 * 60 * 1000 : undefined // 15 minutos de inactividad
  );

  if (!isAuthenticated) return null;

  const isSessionExpired = sessionWarning && sessionWarning.includes('expirado');

  return (
    <Dialog open={showDialog} onOpenChange={(open) => {
      // Solo permitir cerrar el diálogo si no estamos refrescando y no es una sesión expirada
      if (!isRefreshing && !isSessionExpired) {
        setShowDialog(open);
        if (!open) {
          setRefreshError(null);
        }
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSessionExpired ? 'Sesión expirada' : 'Sesión inactiva'}</DialogTitle>
          <DialogDescription>
            {sessionWarning || 'Tu sesión ha estado inactiva durante un tiempo. ¿Deseas continuar o cerrar sesión?'}
          </DialogDescription>
        </DialogHeader>
        
        {refreshError && (
          <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm my-2">
            {refreshError}
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleSignOut} disabled={isRefreshing}>
            Cerrar sesión
          </Button>
          {!isSessionExpired && (
            <Button onClick={handleContinueSession} disabled={isRefreshing}>
              {isRefreshing ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualizando...
                </div>
              ) : refreshError ? "Intentar nuevamente" : "Continuar"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 