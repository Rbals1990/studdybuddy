import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../config/api/api";

export default function Register() {
  const [voornaam, setVoornaam] = useState("");
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [bevestigWachtwoord, setBevestigWachtwoord] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const isSterkWachtwoord = (wachtwoord: string) => {
    const patroon = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{10,}$/;
    return patroon.test(wachtwoord);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Client-side validatie
    if (wachtwoord !== bevestigWachtwoord) {
      setError("Wachtwoorden komen niet overeen.");
      setIsLoading(false);
      return;
    }

    if (!isSterkWachtwoord(wachtwoord)) {
      setError(
        "Wachtwoord moet minimaal 10 karakters bevatten, inclusief 1 hoofdletter, 1 speciaal teken en 1 cijfer."
      );
      setIsLoading(false);
      return;
    }

    try {
      // API call naar backend via helper functie
      const response = await authAPI.register({
        firstName: voornaam,
        email: email,
        password: wachtwoord,
        confirmPassword: bevestigWachtwoord,
      });

      const data = await response.json();

      if (data.success) {
        // Registratie succesvol - redirect naar login
        navigate("/login", {
          state: {
            message: "Account succesvol aangemaakt! Je kunt nu inloggen.",
          },
        });
      } else {
        // Toon error message van backend
        if (data.errors && data.errors.length > 0) {
          // Validatie errors van backend
          setError(data.errors.map((err: any) => err.msg).join(", "));
        } else {
          setError(data.message || "Er ging iets mis bij het registreren.");
        }
      }
    } catch (error) {
      console.error("Register error:", error);
      setError("Er ging iets mis bij het verbinden met de server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E077D]">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-lexend mb-6 text-center">
          Registreer bij StuddyBuddy
        </h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block font-roboto mb-1">Voornaam</label>
            <input
              type="text"
              value={voornaam}
              onChange={(e) => setVoornaam(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28AFB0]"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block font-roboto mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28AFB0]"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block font-roboto mb-1">Wachtwoord</label>
            <input
              type="password"
              value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28AFB0]"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block font-roboto mb-1">
              Bevestig wachtwoord
            </label>
            <input
              type="password"
              value={bevestigWachtwoord}
              onChange={(e) => setBevestigWachtwoord(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28AFB0]"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#E1DD8F] text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Bezig met registreren..." : "Registreer!"}
          </button>
          <p className="text-center mt-4 text-sm">
            <Link to="/login" className="text-[#28AFB0] hover:underline">
              Annuleren
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
