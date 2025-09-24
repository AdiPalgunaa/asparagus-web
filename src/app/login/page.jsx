"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Import komponen Image dari Next.js
import { useAuth } from "@/components/AuthContext";
import LoginForm from "@/components/LoginForm";
import { Sprout } from "lucide-react";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authChecked && user && !authLoading) {
      if (user.role === "admin") {
        router.push("/admin/home");
      } else {
        router.push(`/petani/${user.petaniId}/home`);
      }
    }
  }, [user, authLoading, authChecked, router]);

  const handleLogin = async (email, password, rememberMe) => {
    setError("");
    setLoading(true);

    const result = await login(email, password, rememberMe);

    if (result.success) {
      // Redirect akan ditangani oleh useEffect di atas
    } else {
      let errorMessage = "Login gagal. Silakan coba lagi.";
      switch (result.error) {
        case "auth/invalid-credential":
          errorMessage = "Email atau password salah.";
          break;
        case "auth/user-not-found":
          errorMessage = "User tidak ditemukan.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Terlalu banyak percobaan login. Coba lagi nanti.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Jaringan bermasalah. Periksa koneksi internet Anda.";
          break;
        default:
          errorMessage = "Terjadi kesalahan. Silakan coba lagi.";
      }
      setError(errorMessage);
    }

    setLoading(false);
  };

  if (authLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-emerald-50 to-green-200 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center">
          <div className="flex justify-center items-center mb-4 space-x-6"> {/* Perbesar jarak antar logo */}
            {/* Logo Diktisaintek */}
            <div className="w-24 h-24 flex items-center justify-center shadow-md bg-white rounded-full p-2">
              <Image
                src="/images/diktisaintek.png"
                alt="Logo Diktisaintek"
                width={96}
                height={96}
                layout="responsive"
                objectFit="contain"
              />
            </div>
            {/* Logo Primakara */}
            <div className="w-24 h-24 flex items-center justify-center shadow-md bg-white rounded-full p-2">
              <Image
                src="/images/primakara.png"
                alt="Logo Primakara"
                width={96}
                height={96}
                layout="responsive"
                objectFit="contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Selamat Datang</h1>
          <p className="text-white/90 mt-1">Sistem Monitoring dan Pencatatan Asparagus</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <LoginForm onSubmit={handleLogin} error={error} loading={loading} />
        </div>

        {/* Footer */}
        <div className="bg-green-50 px-6 py-4 border-t border-green-100">
          <p className="text-center text-sm text-green-700">
            © Program Kemitraan Masyarakat Tahun Anggaran 2025
          </p>
        </div>
      </div>
    </div>
  );
}