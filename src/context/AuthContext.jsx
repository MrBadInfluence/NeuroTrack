import React, { createContext, useContext } from 'react';

const AuthContext = createContext({
  signOut: async () => {},
  deleteAccount: async () => {},
  isAuthenticated: false,
  isDemo: false,
});

export function AuthProvider({ children, signOut, deleteAccount, isAuthenticated, isDemo }) {
  return (
    <AuthContext.Provider value={{ signOut, deleteAccount, isAuthenticated, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
