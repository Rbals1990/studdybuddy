import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Upload, Edit, Database, Clock, Mail } from "lucide-react";
import { authUtils } from "../config/api/auth";
import { authAPI } from "../config/api/api";

export default function StuddyBuddyHomepage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      // Optioneel: roep de logout API aan (hoewel dit niet strikt nodig is voor JWT)
      const token = authUtils.getToken();
      if (token) {
        try {
          await authAPI.logout(token);
        } catch (error) {
          console.error("API logout failed:", error);
          // Continue met logout ook al faalt de API call
        }
      }

      // Verwijder alle auth data uit localStorage
      authUtils.logout();

      // Sluit het menu
      setIsMenuOpen(false);

      // Navigeer naar login pagina
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Als er iets fout gaat, doe alsnog de lokale logout
      authUtils.logout();
      setIsMenuOpen(false);
      navigate("/login");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[#FFFAEF]">
      {/* Header */}
      <header className="bg-[#fffaefcf] shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Hamburger Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <div className="flex-1 flex justify-center">
              <img
                src="/sbmascotte.PNG"
                alt="StuddyBuddy Logo"
                className="h-32 w-32"
              />
            </div>

            {/* Spacer for balance */}
            <div className="w-10"></div>
          </div>
        </div>

        {/* Mobile/Desktop Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-purple-600 shadow-lg z-50">
            <nav className="px-4 py-2">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleNavigation("/")}
                    className="block px-4 py-2 text-white hover:bg-purple-700 rounded"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation("/upload/manual")}
                    className="block px-4 py-2 text-white hover:bg-purple-700 rounded"
                  >
                    Upload je info
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      window.open("/timer", "_blank", "noopener,noreferrer")
                    }
                    className="block px-4 py-2 text-white hover:bg-purple-700 rounded"
                  >
                    Timer
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-white hover:bg-purple-700 rounded"
                  >
                    Log out
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2
            className="text-2xl font-semibold text-gray-800 mb-2"
            style={{ fontFamily: "Roboto Condensed, sans-serif" }}
          >
            Welkom terug! Klaar om te oefenen?
          </h2>
          <p
            className="text-gray-600"
            style={{ fontFamily: "Roboto Mono, monospace" }}
          >
            Kies een optie om je woordenschat te oefenen
          </p>
        </div>

        {/* Cards Container - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Handmatig Toevoegen Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border-t-4 border-purple-500">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
              <Edit className="w-8 h-8 text-purple-600" />
            </div>
            <h3
              className="text-xl font-semibold text-center mb-3 text-gray-800"
              style={{ fontFamily: "Roboto Condensed, sans-serif" }}
            >
              Handmatig Toevoegen
            </h3>
            <p
              className="text-gray-600 text-center mb-4"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Type hier je eigen vragen en antwoorden in
            </p>
            <button
              onClick={() => handleNavigation("/upload/manual")}
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Start
            </button>
          </div>

          {/* Upload Foto Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border-t-4 border-blue-400">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3
              className="text-xl font-semibold text-center mb-3 text-gray-800"
              style={{ fontFamily: "Roboto Condensed, sans-serif" }}
            >
              Upload Foto
            </h3>
            <p
              className="text-gray-600 text-center mb-4"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Upload een foto van je aantekeningen of werkbladen
            </p>
            <button
              onClick={() => handleNavigation("/upload/picture")}
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Upload
            </button>
          </div>

          {/* Kiezen uit Database Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border-t-4 border-teal-500">
            <div className="flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mx-auto mb-4">
              <Database className="w-8 h-8 text-teal-600" />
            </div>
            <h3
              className="text-xl font-semibold text-center mb-3 text-gray-800"
              style={{ fontFamily: "Roboto Condensed, sans-serif" }}
            >
              Kiezen uit Database
            </h3>
            <p
              className="text-gray-600 text-center mb-4"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Gebruik eerder opgeslagen woordenlijsten
            </p>
            <button
              onClick={() => handleNavigation("/upload/pick-from-db")}
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Selecteer
            </button>
          </div>
        </div>

        {/* Timer Button */}
        <div className="text-center">
          <button
            onClick={() =>
              window.open("/timer", "_blank", "noopener,noreferrer")
            }
            className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center mx-auto space-x-2"
          >
            <Clock className="w-6 h-6" />
            <span className="text-lg">Stel je timer in!</span>
          </button>
          {/* Contact button */}
          <button
            onClick={() => handleNavigation("/contact")}
            className="mt-4 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center mx-auto space-x-2"
          >
            <Mail className="w-6 h-6" />
            <span className="text-lg">Neem contact op!</span>
          </button>
        </div>
      </main>
    </div>
  );
}
