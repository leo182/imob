import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Property, Booking } from '../types';

export interface SupabaseConfig {
  url: string;
  key: string;
  enabled: boolean;
}

// Simple encryption/decryption of Supabase credentials to prevent easy inspection in HTML
export function encryptCredentials(url: string, key: string): string {
  const payload = JSON.stringify({ url, key });
  // Base64 encode the payload, then reverse the string to prevent standard base64 decoder bots from reading it easily, then base64 encode again!
  const b64_1 = btoa(unescape(encodeURIComponent(payload)));
  const reversed = b64_1.split('').reverse().join('');
  return btoa(unescape(encodeURIComponent(reversed)));
}

export function decryptCredentials(encrypted: string): { url: string; key: string } | null {
  try {
    const raw_1 = decodeURIComponent(escape(atob(encrypted)));
    const reversed = raw_1.split('').reverse().join('');
    const raw_2 = decodeURIComponent(escape(atob(reversed)));
    return JSON.parse(raw_2);
  } catch (err) {
    console.error("Erro ao decodificar credenciais ofuscadas:", err);
    return null;
  }
}

// Get config from localStorage
export function getSupabaseConfig(): SupabaseConfig {
  let url = localStorage.getItem('suzuki_sb_url') || '';
  let key = localStorage.getItem('suzuki_sb_key') || '';
  let enabled = localStorage.getItem('suzuki_sb_enabled') === 'true';

  // Fallback to obfuscated HTML global if local storage is empty or not configured
  if ((!url || !key) && (window as any).SUZUKI_SECURED_CONFIG) {
    const decrypted = decryptCredentials((window as any).SUZUKI_SECURED_CONFIG);
    if (decrypted && decrypted.url && decrypted.key) {
      url = decrypted.url;
      key = decrypted.key;
      enabled = true;
    }
  }

  return { url, key, enabled };
}

// Save config to localStorage
export function saveSupabaseConfig(url: string, key: string, enabled: boolean) {
  localStorage.setItem('suzuki_sb_url', url.trim());
  localStorage.setItem('suzuki_sb_key', key.trim());
  localStorage.setItem('suzuki_sb_enabled', enabled ? 'true' : 'false');
}

// Initialize Supabase Client dynamically
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, enabled } = getSupabaseConfig();
  if (!enabled || !url || !key) {
    supabaseInstance = null;
    return null;
  }
  
  try {
    // Only create client if config changed or not created yet
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Erro ao inicializar Supabase client:', err);
    return null;
  }
}

// SQL Script to create tables (provided for user helper in the UI)
export const SUPABASE_SQL_SETUP = `-- Script SQL para criar as tabelas no Supabase
-- Abra o painel do Supabase, clique em "SQL Editor" -> "New Query", cole o código abaixo e clique em "Run".

CREATE TABLE IF NOT EXISTS public.suzuki_properties (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "propertyType" TEXT NOT NULL,
  "price" NUMERIC NOT NULL,
  "condo" NUMERIC DEFAULT 0,
  "iptu" NUMERIC DEFAULT 0,
  "bedrooms" NUMERIC NOT NULL,
  "bathrooms" NUMERIC NOT NULL,
  "suites" NUMERIC NOT NULL,
  "garages" NUMERIC NOT NULL,
  "area" NUMERIC NOT NULL,
  "city" TEXT NOT NULL,
  "neighborhood" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "images" TEXT[] NOT NULL,
  "featured" BOOLEAN DEFAULT FALSE,
  "badge" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.suzuki_bookings (
  "id" TEXT PRIMARY KEY,
  "propertyId" TEXT NOT NULL,
  "propertyCode" TEXT NOT NULL,
  "propertyTitle" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "timeSlot" TEXT NOT NULL,
  "visitType" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "clientPhone" TEXT NOT NULL,
  "clientEmail" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pendente',
  "schedulingType" TEXT DEFAULT 'agenda',
  "createdAt" TEXT NOT NULL
);

-- Ativar acesso público de leitura e escrita (RSL desativado ou liberado para teste rápido)
-- Se desejar, ative o RLS e configure as políticas correspondentes.
ALTER TABLE public.suzuki_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suzuki_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público leitura para propriedades" ON public.suzuki_properties FOR SELECT USING (true);
CREATE POLICY "Acesso público escrita para propriedades" ON public.suzuki_properties FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acesso público leitura para agendamentos" ON public.suzuki_bookings FOR SELECT USING (true);
CREATE POLICY "Acesso público escrita para agendamentos" ON public.suzuki_bookings FOR ALL USING (true) WITH CHECK (true);
`;

// Helper: check table access/connection is working
export async function testSupabaseConnection(url: string, key: string): Promise<boolean> {
  try {
    const client = createClient(url, key);
    const { error } = await client.from('suzuki_properties').select('id').limit(1);
    // If the table doesn't exist, it might return an error, but if we can reach Supabase, it is a success.
    // However, if the key/url is totally invalid, it will throw or fail CORS.
    if (error && error.message.includes('API key')) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Properties persistence
export async function dbFetchProperties(): Promise<Property[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('suzuki_properties')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Property[];
  } catch (err) {
    console.error('Erro ao buscar propriedades do Supabase:', err);
    throw err;
  }
}

export async function dbSaveProperty(property: Property): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { error } = await client
      .from('suzuki_properties')
      .upsert(property, { onConflict: 'id' });

    if (error) throw error;
  } catch (err) {
    console.error('Erro ao salvar propriedade no Supabase:', err);
    throw err;
  }
}

export async function dbDeleteProperty(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { error } = await client
      .from('suzuki_properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error('Erro ao excluir propriedade no Supabase:', err);
    throw err;
  }
}

// Bookings persistence
export async function dbFetchBookings(): Promise<Booking[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('suzuki_bookings')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Booking[];
  } catch (err) {
    console.error('Erro ao buscar agendamentos do Supabase:', err);
    throw err;
  }
}

export async function dbSaveBooking(booking: Booking): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { error } = await client
      .from('suzuki_bookings')
      .upsert(booking, { onConflict: 'id' });

    if (error) throw error;
  } catch (err) {
    console.error('Erro ao salvar agendamento no Supabase:', err);
    throw err;
  }
}

export async function dbDeleteBooking(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { error } = await client
      .from('suzuki_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error('Erro ao excluir agendamento no Supabase:', err);
    throw err;
  }
}

// Migrate whole local state to Cloud database
export async function dbSyncLocalToCloud(localProperties: Property[], localBookings: Booking[]): Promise<{ propertiesSynced: number; bookingsSynced: number }> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase não está configurado ou ativado.');

  let propertiesSynced = 0;
  let bookingsSynced = 0;

  // 1. Sync properties
  if (localProperties.length > 0) {
    const { error } = await client
      .from('suzuki_properties')
      .upsert(localProperties, { onConflict: 'id' });
    
    if (error) throw error;
    propertiesSynced = localProperties.length;
  }

  // 2. Sync bookings
  if (localBookings.length > 0) {
    const { error } = await client
      .from('suzuki_bookings')
      .upsert(localBookings, { onConflict: 'id' });

    if (error) throw error;
    bookingsSynced = localBookings.length;
  }

  return { propertiesSynced, bookingsSynced };
}
