"use client";
import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      setUploading(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }

      setPhotoUrl(data.url);
    } catch (error) {
      console.error("Erreur upload:", error);
      setError("Erreur lors de l'upload du fichier");
    } finally {
      setUploading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !password) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          password,
          photo: photoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la création du compte");
        return;
      }

      // Auto-login après création
      login({
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        photo: data.photo,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur lors de la création du compte");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden px-4">
      {/* Theme Toggle - Position fixe en haut à droite */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background dégradé animé avec des couleurs vertes */}
      <div className="absolute inset-0 dark:opacity-50" style={{
        background: 'linear-gradient(-45deg, #10b981, #059669, #14b8a6, #0d9488)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite'
      }}></div>

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
          <div className="inline-block p-3 bg-gradient-success rounded-full mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Créer un compte
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Rejoignez votre gestionnaire de finances
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prénom *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Votre prénom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Votre mot de passe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo de profil (optionnel)
            </label>
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/30 dark:file:text-green-400"
              accept="image/*"
            />
            {uploading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Upload en cours...</p>
            )}
            {photoUrl && (
              <div className="mt-3 flex justify-center">
                <Image
                  src={photoUrl}
                  alt="preview"
                  width={96}
                  height={96}
                  className="rounded-full object-cover border-4 border-green-200 dark:border-green-800"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-success text-white py-3 rounded-lg font-semibold shadow-medium hover:shadow-strong transform hover:-translate-y-0.5 transition-all ripple shine-effect"
          >
            Créer mon compte
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/95 dark:bg-gray-800/95 text-gray-500 dark:text-gray-400">Déjà un compte ?</span>
            </div>
          </div>
          <Link href="/login" className="mt-4 inline-block text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold underline-animated">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
