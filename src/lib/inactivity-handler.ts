'use client';

import { useEffect, useRef, useCallback } from 'react';

// Tiempo de inactividad en milisegundos (15 minutos)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

// Intervalo para refrescar la sesión (45 minutos)
const SESSION_REFRESH_INTERVAL = 45 * 60 * 1000;

// Eventos a monitorear para detectar actividad del usuario
const USER_ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
  'keydown',
  'focus', // Cuando la ventana recibe el foco
];

/**
 * Hook para manejar la inactividad del usuario
 * @param onInactivityDetected Función que se ejecuta cuando se detecta inactividad
 * @param refreshFunction Función que refresca la sesión
 * @param timeout Tiempo en ms antes de considerar inactividad (por defecto 15 min)
 */
export function useInactivityHandler(
  onInactivityDetected: () => void,
  refreshFunction: () => Promise<any>,
  timeout = INACTIVITY_TIMEOUT
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  // Función para resetear el temporizador de inactividad
  const resetInactivityTimer = useCallback(() => {
    // Actualizar timestamp de última actividad
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar un nuevo temporizador
    timeoutRef.current = setTimeout(() => {
      onInactivityDetected();
    }, timeout);
  }, [onInactivityDetected, timeout]);

  // Función para verificar la sesión con protección contra ejecuciones múltiples
  const checkSession = useCallback(async () => {
    // Si ya está refrescando, no intentar otra vez
    if (isRefreshingRef.current) {
      console.log('Ya hay un refresco de sesión en progreso, omitiendo...');
      return;
    }
    
    try {
      isRefreshingRef.current = true;
      
      // Si han pasado más de 5 minutos desde la última actividad, refrescar sesión
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const shouldRefresh = timeSinceLastActivity > 5 * 60 * 1000;
      
      if (shouldRefresh) {
        console.log('Verificando sesión por inactividad prolongada...');
        
        // Establecer un timeout para la operación de refresco
        const refreshPromise = refreshFunction();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout al verificar sesión')), 10000)
        );
        
        // Usar Promise.race para evitar que se quede bloqueado
        await Promise.race([refreshPromise, timeoutPromise]);
      }
    } catch (error) {
      console.error('Error al verificar la sesión:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshFunction]);

  useEffect(() => {
    // Iniciar temporizador de inactividad
    resetInactivityTimer();

    // Configurar intervalo para refrescar la sesión con protección contra errores
    refreshIntervalRef.current = setInterval(async () => {
      try {
        // Solo intentar el refresco si no hay otro en progreso
        if (!isRefreshingRef.current) {
          console.log('Refrescando sesión preventivamente...');
          isRefreshingRef.current = true;
          
          // Añadir timeout para evitar bloqueos indefinidos
          const refreshPromise = refreshFunction();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout en refresco preventivo')), 10000)
          );
          
          await Promise.race([refreshPromise, timeoutPromise]);
        }
      } catch (error) {
        console.error('Error al refrescar la sesión:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    }, SESSION_REFRESH_INTERVAL);

    // Verificar la sesión cuando la ventana recibe el foco
    const handleWindowFocus = () => {
      console.log('Ventana recibió el foco, verificando sesión...');
      checkSession();
      resetInactivityTimer();
    };

    // Configurar event listeners para detectar actividad
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    USER_ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity);
    });

    // Añadir listener para cuando la ventana recibe el foco
    window.addEventListener('focus', handleWindowFocus);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      USER_ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });

      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [resetInactivityTimer, refreshFunction, checkSession]);
} 