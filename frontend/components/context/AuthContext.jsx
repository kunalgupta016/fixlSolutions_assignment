import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setStoredToken } from "../../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      setStoredToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load check
    checkAuthStatus();

    // Listen to token expirations from Axios interceptor
    const handleAuthExpiry = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener("auth-expired", handleAuthExpiry);
    return () => window.removeEventListener("auth-expired", handleAuthExpiry);
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    setStoredToken(response.data.token);
    setUser(response.data.user);
    setIsAuthenticated(true);
    return response.data.user;
  };

  const signup = async (data) => {
    const response = await api.post("/auth/register", data);
    setStoredToken(response.data.token);
    setUser(response.data.user);
    setIsAuthenticated(true);
    return response.data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setStoredToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
