import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('edutribe_access_token');
      if (token) {
        try {
          const response = await api.get('/auth/me/');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to validate token', error);
          localStorage.removeItem('edutribe_access_token');
          localStorage.removeItem('edutribe_refresh_token');
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh, user: userData } = response.data;
    localStorage.setItem('edutribe_access_token', access);
    localStorage.setItem('edutribe_refresh_token', refresh);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('edutribe_access_token');
    localStorage.removeItem('edutribe_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
