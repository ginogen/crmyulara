import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

let client: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export const createClient = () => {
  if (!client) {
    try {
      client = createClientComponentClient<Database>();
    } catch (error) {
      console.error('Error creando cliente Supabase:', error);
      throw error;
    }
  }
  return client;
}; 