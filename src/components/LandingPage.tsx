import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Upload,
  Database,
  Clock,
  CheckCircle,
  BookOpen,
  ArrowRight,
  Target,
  Zap,
  Shield,
} from "lucide-react";

export default function StuddyBuddyLanding() {
  const [isHovered, setIsHovered] = useState(null);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  const features = [
    {
      icon: <Edit className="w-8 h-8 text-purple-600" />,
      title: "Handmatig Invoeren",
      description:
        "Type je eigen vragen en antwoorden in voor gepersonaliseerde oefensessies",
    },
    {
      icon: <Upload className="w-8 h-8 text-blue-600" />,
      title: "Foto Upload",
      description:
        "Upload gewoon een foto van je aantekeningen - wij doen de rest!",
    },
    {
      icon: <Database className="w-8 h-8 text-teal-600" />,
      title: "Opgeslagen Lijsten",
      description: "Bewaar je woordenlijsten en oefen ze zo vaak als je wilt",
    },
    {
      icon: <Clock className="w-8 h-8 text-green-600" />,
      title: "Slimme Timer",
      description:
        "Stel pauzes in om de balans tussen leren en ontspannen te bewaren",
    },
  ];

  const benefits = [
    {
      icon: <Target className="w-6 h-6 text-purple-600" />,
      title: "Doelgericht Leren",
      description:
        "Focus op woorden die je nog niet goed kent met ons slimme kleurensysteem",
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: "Snelle Resultaten",
      description:
        "Merk direct verbetering in je woordenschat door gerichte oefening",
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: "Jouw Data, Jouw Controle",
      description: "Alleen jij hebt toegang tot je opgeslagen woordenlijsten",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/sbmascotte.PNG"
              alt="StuddyBuddy Logo"
              className="h-32 w-32 mx-auto mb-6"
            />
            <h1
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              style={{ fontFamily: "Lexend Deca, sans-serif" }}
            >
              StuddyBuddy
            </h1>
            <h2
              className="text-2xl md:text-3xl font-semibold text-gray-700 mb-8"
              style={{ fontFamily: "Roboto Condensed, sans-serif" }}
            >
              Jouw slimme studiebuddy voor taalvaardigheid
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Oefen je woordenschat op een makkelijke en doeltreffende manier.
              Upload foto's, stel timers in, en zie direct je voortgang met ons
              slimme kleurensysteem.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto space-x-3 text-lg"
            >
              <span>Start Nu Gratis</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: "Roboto Condensed, sans-serif" }}
            >
              Jouw 4 Krachtige Tools
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Vier effectieve manieren om je woordenschat te verbeteren
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-t-4 ${feature.borderColor} group`}
                onMouseEnter={() => setIsHovered(index)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-6 group-hover:bg-purple-200 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3
                  className="text-xl font-semibold text-center mb-4 text-gray-800"
                  style={{ fontFamily: "Roboto Condensed, sans-serif" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-gray-600 text-center leading-relaxed"
                  style={{ fontFamily: "Roboto Mono, monospace" }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold mb-6"
              style={{ fontFamily: "Roboto Condensed, sans-serif" }}
            >
              Waarom StuddyBuddy?
            </h2>
            <p
              className="text-lg text-purple-100 max-w-2xl mx-auto"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Ontdek wat StuddyBuddy zo effectief maakt voor jouw taalstudie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-8 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mx-auto mb-6">
                  {benefit.icon}
                </div>
                <h3
                  className="text-xl font-semibold text-center mb-4"
                  style={{ fontFamily: "Roboto Condensed, sans-serif" }}
                >
                  {benefit.title}
                </h3>
                <p
                  className="text-purple-100 text-center leading-relaxed"
                  style={{ fontFamily: "Roboto Mono, monospace" }}
                >
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Demo */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: "Roboto Condensed, sans-serif" }}
            >
              Slimme Voortgangscontrole
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Zie direct hoe je het doet met ons intuïtieve kleurensysteem
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-100 rounded-xl p-6 text-center border-2 border-green-200">
                <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3
                  className="text-lg font-semibold text-green-800 mb-2"
                  style={{ fontFamily: "Roboto Condensed, sans-serif" }}
                >
                  Groen: 90%+
                </h3>
                <p
                  className="text-green-700 text-sm"
                  style={{ fontFamily: "Roboto Mono, monospace" }}
                >
                  Perfect! Je kent deze woorden goed
                </p>
              </div>

              <div className="bg-orange-100 rounded-xl p-6 text-center border-2 border-orange-200">
                <div className="w-12 h-12 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3
                  className="text-lg font-semibold text-orange-800 mb-2"
                  style={{ fontFamily: "Roboto Condensed, sans-serif" }}
                >
                  Oranje: 50-90%
                </h3>
                <p
                  className="text-orange-700 text-sm"
                  style={{ fontFamily: "Roboto Mono, monospace" }}
                >
                  Bijna goed! Nog even oefenen
                </p>
              </div>

              <div className="bg-red-100 rounded-xl p-6 text-center border-2 border-red-200">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3
                  className="text-lg font-semibold text-red-800 mb-2"
                  style={{ fontFamily: "Roboto Condensed, sans-serif" }}
                >
                  Rood: &lt;50%
                </h3>
                <p
                  className="text-red-700 text-sm"
                  style={{ fontFamily: "Roboto Mono, monospace" }}
                >
                  Focus hier op - meer oefening nodig
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-4xl font-bold mb-6"
            style={{ fontFamily: "Roboto Condensed, sans-serif" }}
          >
            Klaar om je taalvaardigheid te verbeteren?
          </h2>
          <p
            className="text-xl text-purple-100 mb-8"
            style={{ fontFamily: "Roboto Mono, monospace" }}
          >
            Begin vandaag nog met effectief woordenschat oefenen
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-bold py-4 px-8 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 text-lg"
            >
              <span>Start Nu Gratis</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-6 text-purple-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Gratis te gebruiken</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Geen downloads nodig</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Direct beginnen</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/sbmascotte.PNG"
              alt="StuddyBuddy Logo"
              className="h-12 w-12 mr-3"
            />
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "Lexend Deca, sans-serif" }}
            >
              StuddyBuddy
            </span>
          </div>
          <p
            className="text-gray-400"
            style={{ fontFamily: "Roboto Mono, monospace" }}
          >
            Jouw slimme studiebuddy voor betere taalvaardigheid
          </p>
        </div>
      </footer>
    </div>
  );
}
