// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authUtils, isTokenExpired } from "../config/api/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = authUtils.getToken();
  const user = authUtils.getUser();

  // Check of gebruiker is ingelogd
  const isAuthenticated = authUtils.isAuthenticated();

  // Extra check: is token verlopen?
  const tokenExpired = token ? isTokenExpired(token) : true;

  // Als niet ingelogd of token verlopen, redirect naar login
  if (!isAuthenticated || tokenExpired) {
    // Als token verlopen, clean up localStorage
    if (tokenExpired && token) {
      authUtils.logout();
    }

    // Redirect naar login met return URL zodat gebruiker
    // terugkeert naar oorspronkelijke pagina na inloggen
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Als alles goed is, toon de component
  return <>{children}</>;
};
