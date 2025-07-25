import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  userProfile: User | null; // For compatibility with existing components
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; user?: User }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any; user?: User }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // For demo: persist user in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    console.log('SignIn started for:', email);
    try {
      const data = await apiClient.auth.login({ email, password });
      console.log('SignIn successful:', data);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { error: null, user: data.user };
    } catch (error: any) {
      console.error('SignIn error:', error);
      const message = error.response?.data?.error || error.message || 'Login failed';
      return { error: { message } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    setLoading(true);
    try {
      const data = await apiClient.auth.register({
        email,
        password,
        full_name: userData.fullName,
        role: userData.role,
        caregiver_code: userData.caregiverCode,
        linked_caregiver_id: userData.linkedCaregiverId,
        emergency_contact: userData.emergencyContact,
        emergency_phone: userData.emergencyPhone,
      });
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { error: null, user: data.user };
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Registration failed';
      return { error: { message } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    userProfile: user, // For compatibility with existing components
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
