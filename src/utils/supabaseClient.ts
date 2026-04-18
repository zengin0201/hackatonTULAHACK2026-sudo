import { createClient } from '@supabase/supabase-js';

// We provide fallback dummy values to prevent UI crashing in preview environments 
// if the user hasn't configured the secrets yet.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
