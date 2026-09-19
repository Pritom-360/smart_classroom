import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId, userEmail) => {
    const safeEmail = userEmail || 'user@example.com';
    const nameFromEmail = safeEmail.split('@')[0];
    const fallbackName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3500)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) throw error;

      if (!data) {
        // Fallback: Create profile if it doesn't exist (trigger alternative)
        const newProfile = {
          id: userId,
          full_name: fallbackName,
          role: 'user',
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) throw insertError;
        data = inserted;
      }

      setProfile(data);
    } catch (err) {
      console.warn('Profile fetch notice:', err?.message || err);
      // Set a mock local profile so the app remains usable even if tables are empty/missing
      setProfile({
        id: userId,
        full_name: fallbackName,
        role: 'user',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    // Clean up Supabase hash parameter if redirected from email confirmation link to keep HashRouter working smoothly
    if (window.location.hash && window.location.hash.includes('access_token=')) {
      setTimeout(() => {
        if (window.location.hash.includes('access_token=')) {
          window.location.hash = '#/dashboard';
        }
      }, 300);
    }

    // Listen for auth changes (onAuthStateChange automatically runs once immediately on mount with initial session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (profile !== null || !user) {
      setLoading(false);
    }
  }, [profile, user]);

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    if (error) throw error;
    
    // Explicitly create profile only if user is confirmed and session is present
    if (data?.session && data?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          role: 'user'
        });
      } catch (e) {
        // Ignore unconfirmed RLS 401 error
      }
    }
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
