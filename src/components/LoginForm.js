"use client";
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';

export default function LoginForm({ onSubmit, error, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password, rememberMe);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              required
              placeholder="nama@perusahaan.com"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Masukkan password"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`relative w-5 h-5 border-2 rounded-md mr-2 flex items-center justify-center transition-colors ${
              rememberMe 
                ? 'bg-green-600 border-green-600' 
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {rememberMe && (
              <Check className="h-3.5 w-3.5 text-white" />
            )}
          </button>
          <label 
            htmlFor="remember-me" 
            className="block text-sm text-gray-700 cursor-pointer"
            onClick={() => setRememberMe(!rememberMe)}
          >
            Ingat saya
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg py-3 px-4 transition transform hover:scale-[1.02] shadow-md disabled:opacity-50"
        >
          {loading ? "Sedang masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}