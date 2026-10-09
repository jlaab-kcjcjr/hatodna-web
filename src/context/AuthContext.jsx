import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

function friendlyAuthError(error) {
  const message = error?.message ?? '';
  if (message.includes('Invalid login credentials')) return "That email and password don't match.";
  if (message.includes('Email not confirmed')) return 'Confirm your email first. Enter the code we emailed you.';
  if (message.includes('already registered')) return 'An account with this email already exists. Log in instead.';
  if (message.includes('Password should be')) return 'Use a stronger password with at least 8 characters.';
  if (message.toLowerCase().includes('rate limit')) return 'Too many emails were sent. Please wait a few minutes and try again.';
  return message || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data ?? null);
    setProfileLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Supabase recommends not calling the database directly inside this callback.
      setTimeout(() => loadProfile(newSession?.user.id), 0);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error));
  };

  // The role is saved on the new profile by the database (never "admin").
  // The confirmation link brings the person back to the same site they signed up on.
  const signUp = async ({ email, password, fullName, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/merchant`,
      },
    });
    if (error) throw new Error(friendlyAuthError(error));
    return { needsConfirmation: !data.session };
  };

  // Confirms a new account with the 6-digit code from the email, and logs the person in.
  const confirmSignup = async (email, code) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (error) throw new Error('That code is incorrect or has expired. Check your email or send a new code.');
  };

  const resendConfirmation = async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/merchant` },
    });
    if (error) throw new Error(friendlyAuthError(error));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        profileLoading,
        signIn,
        signUp,
        confirmSignup,
        resendConfirmation,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);