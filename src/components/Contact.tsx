import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Mail } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  //bij Annuuleren terug naar home
  const handleCancel = () => {
    navigate("/home");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    //Validatie + error handling
    if (!name.trim() || !message.trim()) {
      alert("Vul alle velden in!");
      return;
    }

    if (message.length > 300) {
      alert("Je bericht mag maximaal 300 woorden bevatten!");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
        }/api/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            message: message.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Er is iets misgegaan");
      }

      setSubmitted(true);

      // Na 3 seconden terug naar home
      setTimeout(() => {
        navigate("/home");
      }, 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        `Er is iets misgegaan bij het versturen van je bericht: ${
          error instanceof Error ? error.message : "Onbekende fout"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = message
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FFFAEF] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2
            className="text-2xl font-semibold text-gray-800 mb-4"
            style={{ fontFamily: "Roboto Condensed, sans-serif" }}
          >
            Bericht Verzonden!
          </h2>
          <p
            className="text-gray-600"
            style={{ fontFamily: "Roboto Mono, monospace" }}
          >
            Bedankt voor je bericht. We nemen zo snel mogelijk contact met je
            op!
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Je wordt automatisch doorgestuurd naar de homepage...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAEF]">
      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-gray-800 mb-2"
              style={{ fontFamily: "Lexend Deca, sans-serif" }}
            >
              Contact
            </h1>
            <p
              className="text-gray-600"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Heb je een vraag of suggestie? Laat het ons weten!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Roboto Condensed, sans-serif" }}
              >
                Naam
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                placeholder="Je naam..."
                maxLength={50}
                style={{ fontFamily: "Roboto Mono, monospace" }}
              />
            </div>

            {/* Message Input */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Roboto Condensed, sans-serif" }}
              >
                Bericht
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 resize-none"
                placeholder="Typ hier je bericht (maximaal 300 woorden)..."
                style={{ fontFamily: "Roboto Mono, monospace" }}
              />
              <div className="flex justify-between items-center mt-2">
                <span
                  className={`text-sm ${
                    wordCount > 300 ? "text-red-500" : "text-gray-500"
                  }`}
                  style={{ fontFamily: "Roboto Mono, monospace" }}
                >
                  {wordCount}/300 woorden
                </span>
                {wordCount > 300 && (
                  <span className="text-sm text-red-500 font-medium">
                    Te veel woorden!
                  </span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                style={{ fontFamily: "Roboto Condensed, sans-serif" }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Annuleren</span>
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  wordCount > 300 ||
                  !name.trim() ||
                  !message.trim()
                }
                className="flex-1 bg-yellow-300 hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                style={{ fontFamily: "Roboto Condensed, sans-serif" }}
              >
                <Send className="w-5 h-5" />
                <span>{isSubmitting ? "Versturen..." : "Versturen"}</span>
              </button>
            </div>
          </form>

          {/* Back to Home Link */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="text-purple-600 hover:text-purple-800 font-medium underline transition-colors duration-200"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              terug naar de homepagina
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
