import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { INITIAL_ADMIN_USERS } from '../data/initialMaritimeData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (identity: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  switchRoleDemo: (userId: string) => void;
}

const AUTH_STORAGE_KEY = 'maritime_auth_user_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading auth user', e);
    }
    // Default to logged-in Super Admin for immediate high accessibility, or can log out anytime
    return INITIAL_ADMIN_USERS[0];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (identity: string, password: string): Promise<{ success: boolean; message: string }> => {
    // Simulating authentication with validation
    const cleanIdentity = identity.trim().toLowerCase();
    
    // Find matching admin
    const foundUser = INITIAL_ADMIN_USERS.find(
      u => u.username.toLowerCase() === cleanIdentity || u.email.toLowerCase() === cleanIdentity
    );

    if (!foundUser) {
      // Allow custom admin credentials if password matches minimum criteria
      if ((cleanIdentity.includes('admin') || cleanIdentity.includes('@')) && password.length >= 4) {
        const customUser: User = {
          id: 'usr-custom-' + Date.now(),
          username: cleanIdentity.split('@')[0],
          name: 'Administrator Operasional',
          email: cleanIdentity.includes('@') ? cleanIdentity : `${cleanIdentity}@pelabuhan.go.id`,
          role: 'super_admin',
          dutyLocation: 'Pusat Komando Operasi Pelabuhan'
        };
        setUser(customUser);
        return { success: true, message: `Selamat datang, ${customUser.name}!` };
      }
      return { success: false, message: 'Username / Email tidak terdaftar dalam sistem.' };
    }

    if (!password || password.length < 3) {
      return { success: false, message: 'Password minimal 3 karakter.' };
    }

    setUser(foundUser);
    return { success: true, message: `Login berhasil! Selamat bertugas, ${foundUser.name}.` };
  };

  const logout = () => {
    setUser(null);
  };

  const switchRoleDemo = (userId: string) => {
    const target = INITIAL_ADMIN_USERS.find(u => u.id === userId);
    if (target) {
      setUser(target);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRoleDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
