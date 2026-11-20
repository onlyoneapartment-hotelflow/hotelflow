import { createBrowserClient } from "@supabase/ssr";

/** Supabase klijent za kod koji radi u pregledaču. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
