import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../config/api/api";
import { authUtils } from "../config/api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Check voor success message van registratie
  useEffect(() => {
    // Redirect als al ingelogd
    if (authUtils.isAuthenticated()) {
      navigate("/");
      return;
    }

    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear de message na 5 seconden
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [location.state, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email,
        password,
      });

      const data = await response.json();

      if (data.success) {
        // Opslaan van token en user data via utility
        authUtils.setAuthData(data.data.token, data.data.user);

        // Redirect naar home
        navigate("/");
      } else {
        // Toon error message van backend
        if (data.errors && data.errors.length > 0) {
          setError(data.errors.map((err: any) => err.msg).join(", "));
        } else {
          setError(data.message || "Er ging iets mis bij het inloggen.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Er ging iets mis bij het verbinden met de server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 mb-12 flex items-center justify-center bg-[#E077D]">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-lexend mb-6 text-center">
          Log in bij StuddyBuddy
        </h1>

        {/* Success message van registratie */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-roboto mb-1">
              Gebruikersnaam (email)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28AFB0]"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-roboto mb-1">
              Wachtwoord
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28AFB0] pr-16"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-sm text-[#28AFB0] hover:text-[#1e8b8c] disabled:opacity-50"
                disabled={isLoading}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm">
              Nieuw hier?{" "}
              <Link
                to="/register"
                className="text-[#28AFB0] hover:underline"
                onClick={(e) => {
                  if (isLoading) e.preventDefault();
                }}
              >
                Registreer je!
              </Link>
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#E1DD8F] text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Bezig..." : "Log in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
