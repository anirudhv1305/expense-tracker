import { requireSupabase } from './supabase';

export const authService = {
  signUp: async ({ name, email, password }) => {
    const { data, error } = await requireSupabase().auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } }
    });
    if (error) throw error;
    return data;
  },
  signIn: async ({ email, password }) => {
    const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  signOut: async () => {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
  },
  getSession: async () => {
    const { data, error } = await requireSupabase().auth.getSession();
    if (error) throw error;
    return data.session;
  },
  onAuthStateChange: (callback) => requireSupabase().auth.onAuthStateChange(callback)
};
