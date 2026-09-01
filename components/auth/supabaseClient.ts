import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing from environment variables');
}

// Use the anonymous key for frontend client (no admin operations)
// Service-role key operations happen server-side in server.js
const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Automatically confirm email for new users
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    // Note: Email confirmation now happens server-side via service key
    console.log('User signed in:', session.user.email);
  }
});

export { supabase };
export default supabase;