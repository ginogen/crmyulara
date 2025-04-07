'use client';

import { useEffect } from 'react';
import { initSessionSync } from '@/lib/supabase/sessionSync';
import { InactivityHandler } from '@/components/InactivityHandler';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar la sincronización de sesión solo en el cliente
    console.log('Inicializando sincronización de sesión...');
    initSessionSync();
  }, []);

  return (
    <>
      <InactivityHandler />
      {children}
    </>
  );
} 