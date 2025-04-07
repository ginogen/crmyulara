'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode, useEffect } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: true, // Activar refetch al volver a la ventana
            refetchOnReconnect: true, // Activar refetch al reconectar
            refetchIntervalInBackground: false, // No refrescar en segundo plano
            retryOnMount: true, // Reintentar cuando el componente se monta
            retry: (failureCount, error) => {
              // Intentar solo con errores que no sean de autorización
              if (error instanceof Error && 
                  (error.message.includes('JWT') || 
                   error.message.includes('session') || 
                   error.message.includes('auth') || 
                   error.message.includes('token'))) {
                return false; // No reintentar errores de autenticación
              }
              return failureCount < 2; // Intentar hasta 2 veces para otros errores
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Espera exponencial
          },
          mutations: {
            retry: (failureCount, error) => {
              // No reintentar errores de autenticación
              if (error instanceof Error && 
                  (error.message.includes('JWT') || 
                   error.message.includes('session') || 
                   error.message.includes('auth') || 
                   error.message.includes('token'))) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      })
  );

  // Refrescar las consultas cuando la ventana recibe el foco después de inactividad
  useEffect(() => {
    let lastFocusTime = Date.now();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeInactive = Date.now() - lastFocusTime;
        // Si estuvo inactivo más de 5 minutos, refrescar todas las consultas
        if (timeInactive > 5 * 60 * 1000) {
          console.log('Aplicación inactiva por más de 5 minutos, refrescando datos...');
          queryClient.invalidateQueries();
        }
        lastFocusTime = Date.now();
      }
    };
    
    // Manejar cuando la ventana se hace visible nuevamente
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
} 