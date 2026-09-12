import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_BASE_URL = "http://localhost:4000";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("nicecomm_token")
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (authToken) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to fetch current user");
    }

    return response.json();
  };

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const data = await fetchCurrentUser(token);
        setUser(data.user);
      } catch (error) {
        console.error("Auth initialization failed:", error);

        localStorage.removeItem("nicecomm_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("nicecomm_token", data.token);
    setToken(data.token);

    const currentUser = await fetchCurrentUser(data.token);
    setUser(currentUser.user);

    return {
      ...data,
      user: currentUser.user,
    };
  };

const register = async (fullName, email, password, phone = "") => {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: fullName,
        email,
        password,
        phone,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Registration failed"
    );
  }

  return data;
};

  const logout = () => {
    localStorage.removeItem("nicecomm_token");
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}