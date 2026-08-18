import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mbmilbbdjywnmagxfcyg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibWlsYmJkanl3bm1hZ3hmY3lnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAzNzgxOSwiZXhwIjoyMDc4NjEzODE5fQ.tPwy3VsVQfqUdHboJ_jT5jk8QyT5o1CBAHR4dCZvCQ4' // Use the service role key for admin operations
);

// Automatically confirm email for new users
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const { data: user, error } = await supabase.auth.admin.updateUserById(session.user.id, {
      email_confirm: true, // Corrected property name
    });

    if (error) {
      console.error('Error auto-confirming email:', error);
    } else {
      console.log('Email auto-confirmed for user:', user);
    }
  }
});

export async function confirmUserEmail(userId: string): Promise<void> {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Failed to confirm email for user ${userId}: ${error.message}`);
    }

    console.log(`Email confirmed for user ${userId}`);
  } catch (error) {
    console.error('Error confirming user email:', error);
    throw error;
  }
}

export { supabase };
export default supabase;