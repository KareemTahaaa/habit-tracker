import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('ht_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ht_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /**
   * Login: persist token and user data
   */
  const login = useCallback((token, userData) => {
    localStorage.setItem('ht_token', token);
    localStorage.setItem('ht_user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  }, []);

  /**
   * Logout: clear token and user data
   */
  const logout = useCallback(() => {
    localStorage.removeItem('ht_token');
    localStorage.removeItem('ht_user');
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Update user in state (after profile update)
   */
  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('ht_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to consume auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
