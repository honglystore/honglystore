import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleName } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: string[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  switchRole: (role: RoleName) => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  updateProfile: (data: { name?: string; phone?: string; avatar?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCashier: boolean;
  isInventory: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexus_auth_token'));
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize or restore session
  useEffect(() => {
    async function initAuth() {
      try {
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
          setPermissions(res.permissions);
        } else {
          // Auto sign-in as default Super Admin for instant interactive experience
          const res = await api.switchDemoRole('Super Admin');
          localStorage.setItem('nexus_auth_token', res.token);
          setToken(res.token);
          setUser(res.user);
          const me = await api.getMe();
          setPermissions(me.permissions);
        }
      } catch (err) {
        console.warn('Session verification failed, attempting demo fallback:', err);
        try {
          const res = await api.switchDemoRole('Super Admin');
          localStorage.setItem('nexus_auth_token', res.token);
          setToken(res.token);
          setUser(res.user);
        } catch {
          localStorage.removeItem('nexus_auth_token');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('nexus_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    const me = await api.getMe();
    setPermissions(me.permissions);
  };

  const loginWithGoogle = async () => {
    const res = await api.loginWithGoogle();
    localStorage.setItem('nexus_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    const me = await api.getMe();
    setPermissions(me.permissions);
  };

  const logout = () => {
    localStorage.removeItem('nexus_auth_token');
    setToken(null);
    setUser(null);
    setPermissions([]);
  };

  const switchRole = async (role: RoleName) => {
    setLoading(true);
    try {
      const res = await api.switchDemoRole(role);
      localStorage.setItem('nexus_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      const me = await api.getMe();
      setPermissions(me.permissions);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { name?: string; phone?: string; avatar?: string; currentPassword?: string; newPassword?: string }) => {
    const res = await api.updateProfile(data);
    if (res.user) {
      setUser(res.user);
    }
  };

  const hasPermission = (permissionCode: string) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    return permissions.includes(permissionCode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        loading,
        login,
        loginWithGoogle,
        logout,
        switchRole,
        hasPermission,
        updateProfile,
        isSuperAdmin: user?.role === 'Super Admin',
        isAdmin: user?.role === 'Admin' || user?.role === 'Super Admin',
        isManager: user?.role === 'Manager' || user?.role === 'Admin' || user?.role === 'Super Admin',
        isCashier: user?.role === 'Cashier',
        isInventory: user?.role === 'Inventory Staff',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
