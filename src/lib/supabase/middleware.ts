import { supabase } from './client';

/**
 * Validates and checks current user session status using the real Supabase client.
 */
export async function updateSession(request?: any) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return {
        authenticated: false,
        user: null,
        session: null,
        message: "No active session or error validating session."
      };
    }
    
    return {
      authenticated: true,
      user: session.user,
      session,
      message: "Session is valid and active"
    };
  } catch (err: any) {
    return {
      authenticated: false,
      user: null,
      session: null,
      message: err.message || "Error during session validation."
    };
  }
}
