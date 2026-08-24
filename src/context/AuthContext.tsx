import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserId, LanInfo } from '../types';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  lanInfo: LanInfo | null;
  loading: boolean;
  login: (userId: UserId, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  refreshUsers: () => Promise<void>;
  refreshLanInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('family_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [lanInfo, setLanInfo] = useState<LanInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users: User[] = await res.json();
        setAllUsers(users);
        if (currentUser) {
          const fresh = users.find(u => u.id === currentUser.id);
          if (fresh) {
            setCurrentUser(fresh);
            localStorage.setItem('family_current_user', JSON.stringify(fresh));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [currentUser]);

  const refreshLanInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/system/network');
      if (res.ok) {
        const info: LanInfo = await res.json();
        setLanInfo(info);
      }
    } catch (err) {
      console.error('Failed to fetch LAN info:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshUsers(), refreshLanInfo()]).finally(() => setLoading(false));
  }, []);

  const login = async (userId: UserId, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('family_current_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('family_current_user');
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updated: User = await res.json();
        setCurrentUser(updated);
        localStorage.setItem('family_current_user', JSON.stringify(updated));
        await refreshUsers();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Profile update failed:', err);
      return false;
    }
  };

  const changePin = async (currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, currentPin, newPin }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update PIN' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        lanInfo,
        loading,
        login,
        logout,
        updateProfile,
        changePin,
        refreshUsers,
        refreshLanInfo,
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
