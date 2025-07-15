// src/config/api.ts

// API Base URL configuration
export const API_BASE_URL = import.meta.env.PROD
  ? "https://studdybuddy-fsja.onrender.com" // Vervang dit later met je echte Render URL
  : "http://localhost:5000"; // Development URL

// Helper functie voor API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    return response;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Auth specific helper functies
export const authAPI = {
  register: (userData: {
    firstName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) =>
    apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials: { email: string; password: string }) =>
    apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: (token: string) =>
    apiCall("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getMe: (token: string) =>
    apiCall("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};
