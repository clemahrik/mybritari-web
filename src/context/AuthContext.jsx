import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token     = localStorage.getItem('mybritari_token');
    const savedUser = localStorage.getItem('mybritari_user');
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('mybritari_token', token);
    localStorage.setItem('mybritari_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('mybritari_token');
    localStorage.removeItem('mybritari_user');
    setUser(null);
    window.location.href = '/';
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('mybritari_user', JSON.stringify(updated));
  };

  // Refresh user data from server
  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        const u = res.data.user;
        setUser(u);
        localStorage.setItem('mybritari_user', JSON.stringify(u));
        return u;
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
