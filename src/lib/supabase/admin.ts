import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase klijent sa servisnim (tajnim) ključem. Zaobilazi pravila pristupa,
 * zato se koristi SAMO na serveru i samo za prijavu, aktivaciju i spisak imena na ekranu za prijavu.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
