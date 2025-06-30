// src/utils/auth.ts

const TOKEN_KEY = "studdybuddy_token";
const USER_KEY = "studdybuddy_user";

export interface User {
  id: string;
  firstName: string;
  email: string;
}

// Token management
export const authUtils = {
  // Opslaan van token en user data
  setAuthData: (token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Ophalen van token
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Ophalen van user data
  getUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Check of gebruiker ingelogd is
  isAuthenticated: (): boolean => {
    const token = authUtils.getToken();
    const user = authUtils.getUser();
    return !!(token && user);
  },

  // Uitloggen (verwijder alle auth data)
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Get authorization header voor API calls
  getAuthHeader: (): { Authorization: string } | {} => {
    const token = authUtils.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

// Helper om te checken of token expired is
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};
