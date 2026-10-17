import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

function friendlyAuthError(error) {
  const message = error?.message ?? '';
  if (message.includes('Invalid login credentials')) return "That email and password don't match.";
  if (message.includes('Email not confirmed')) return 'Confirm your email first. Enter the code we emailed you.';
  if (message.includes('already registered')) return 'An account with this email already exists. Log in instead.';
  if (message.includes('different from the old password')) return 'Your new password must be different from your old one.';
  if (message.includes('Password should') || message.toLowerCase().includes('weak password')) {
    return 'Use a stronger password: at least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.';
  }
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

    let lastUserId;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Only reload the profile when a different person logs in or out
      // (not on token refreshes or when re-checking a password).
      const userId = newSession?.user.id;
      if (userId === lastUserId) return;
      lastUserId = userId;
      // Supabase recommends not calling the database directly inside this callback.
      setTimeout(() => loadProfile(userId), 0);
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

  // Forgot password: email a 6-digit code. Supabase doesn't say whether the email has an account.
  const sendPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/merchant`,
    });
    if (error) throw new Error(friendlyAuthError(error));
  };

  // Checks the code from the reset email. This logs the merchant in so they can set a new password.
  const verifyResetCode = async (email, code) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    if (error) throw new Error('That code is incorrect or has expired. Check your email or send a new code.');
  };

  const setNewPassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(friendlyAuthError(error));
  };

  // Change password while logged in: check the current password first, then save the new one.
  const changePassword = async (currentPassword, newPassword, logoutOthers) => {
    const email = session?.user?.email;
    const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (checkError) {
      throw new Error(
        checkError.message.includes('Invalid login credentials')
          ? 'Your current password is incorrect.'
          : friendlyAuthError(checkError)
      );
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(friendlyAuthError(error));
    if (logoutOthers) await supabase.auth.signOut({ scope: 'others' });
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
        sendPasswordReset,
        verifyResetCode,
        setNewPassword,
        changePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);