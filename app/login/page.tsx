"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export default function LoginPage() {
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, password }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.user);
        router.push("/dashboard");
      } else {
        setError(data.message || "Erreur de connexion");
      }
    } catch (error) {
      console.error("Erreur login:", error);
      setError("Erreur lors de la connexion");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Theme Toggle - Position fixe en haut à droite */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background dégradé animé */}
      <div className="absolute inset-0 animated-gradient-bg dark:opacity-50"></div>

      {/* Formes géométriques abstraites */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 dark:bg-white/5 rounded-full blur-3xl float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-white/10 dark:bg-white/5 rounded-full blur-3xl float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full blur-3xl float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Effet mesh gradient par-dessus */}
      <div className="absolute inset-0 mesh-gradient dark:opacity-30"></div>

      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-strong w-full max-w-md animate-scale-in relative z-10 border border-white/20 dark:border-gray-700/50 zoom-in">
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-gradient-blue rounded-full mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Connexion
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Bienvenue sur votre gestionnaire de finances
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prénom
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Votre prénom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Votre mot de passe"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-blue text-white py-3 rounded-lg font-semibold shadow-medium hover:shadow-strong transform hover:-translate-y-0.5 transition-all ripple shine-effect"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/95 dark:bg-gray-800/95 text-gray-500 dark:text-gray-400">Pas encore de compte ?</span>
            </div>
          </div>
          <Link href="/signup" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline-animated">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
