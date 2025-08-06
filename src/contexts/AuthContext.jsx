import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate authentication check on app load
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem("sacredledger_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Error parsing saved user:", error);
          localStorage.removeItem("sacredledger_user");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual authentication
      if (
        email === "treasurer@sacredledger.org" &&
        password === "password123"
      ) {
        const userData = {
          id: "1",
          email: "treasurer@sacredledger.org",
          name: "Treasurer",
          role: "Treasurer",
          church: "New Hope SDA Church",
        };
        setUser(userData);
        localStorage.setItem("sacredledger_user", JSON.stringify(userData));
        return { success: true };
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sacredledger_user");
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
