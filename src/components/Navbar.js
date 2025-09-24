"use client";
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, LogOut } from 'lucide-react';

export default function Navbar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left Section - Logo and Brand */}
          <div className="flex items-center space-x-4">
            {/* Logo Diktisaintek */}
            <div className="flex items-center">
              {/* Diperbesar dari w-20 h-20 menjadi w-24 h-24 */}
              <div className="w-24 h-24 relative"> 
                <Image
                  src="/images/diktisaintek.png"
                  alt="Logo Diktisaintek"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Logo Primakara */}
            <div className="flex items-center">
              {/* Diperbesar dari w-20 h-20 menjadi w-24 h-24 */}
              <div className="w-24 h-24 relative"> 
                <Image
                  src="/images/primakara.png"
                  alt="Logo Primakara"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Brand Name */}
            <div className="hidden md:block">
              <span className="text-xl font-bold text-gray-800 leading-tight">
                Sistem Asparagus
              </span>
            </div>
          </div>

          {/* Center Section - Time and Date (Desktop Only) */}
          <div className="hidden md:flex flex-grow justify-center">
            <div className="text-center">
              <div className="text-gray-800 font-medium text-lg md:text-xl">{formatTime(currentTime)}</div>
              <div className="text-sm text-gray-600 hidden md:block">{formatDate(currentTime)}</div>
            </div>
          </div>
          
          {/* Right Section - Navigation, User, and Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            {/* Navigation Buttons (Desktop) */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => router.push(user?.role === 'admin' ? '/admin/home' : `/petani/${user?.petaniId}/home`)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Home
              </button>

              {user?.role === 'admin' ? (
                <>
                  <button
                    onClick={() => router.push('/admin/sistem')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Sistem
                  </button>
                  <button
                    onClick={() => router.push('/admin/pencatatan')}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Pencatatan
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push(`/petani/${user?.petaniId}/sistem`)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Sistem
                  </button>
                  <button
                    onClick={() => router.push(`/petani/${user?.petaniId}/pencatatan`)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Pencatatan
                  </button>
                </>
              )}
            </div>

            {/* User Info and Logout (Desktop) */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800 capitalize">
                  {user?.role === 'admin' ? 'Administrator' : `Petani ${user?.petaniId}`}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.email}
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <LogOut size={16} className="mr-1" />
                {loggingOut ? '...' : 'Logout'}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-gray-800"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation (Menu) */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96' : 'max-h-0'}`}>
          <div className="flex flex-col gap-2 py-3 border-t border-gray-200">
            {/* User Info and Time/Date (Mobile) */}
            <div className="p-2 mb-2 text-center">
              <div className="text-gray-800 font-medium text-lg">{formatTime(currentTime)}</div>
              <div className="text-sm text-gray-600">{formatDate(currentTime)}</div>
              <div className="mt-2 text-base font-medium text-gray-800 capitalize">
                {user?.role === 'admin' ? 'Administrator' : `Petani ${user?.petaniId}`}
              </div>
              <div className="text-sm text-gray-500">
                {user?.email}
              </div>
            </div>
            
            <button
              onClick={() => {
                router.push(user?.role === 'admin' ? '/admin/home' : `/petani/${user?.petaniId}/home`);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Home
            </button>

            {user?.role === 'admin' ? (
              <>
                <button
                  onClick={() => {
                    router.push('/admin/sistem');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sistem
                </button>
                <button
                  onClick={() => {
                    router.push('/admin/pencatatan');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Pencatatan
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    router.push(`/petani/${user?.petaniId}/sistem`);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sistem
                </button>
                <button
                  onClick={() => {
                    router.push(`/petani/${user?.petaniId}/pencatatan`);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Pencatatan
                </button>
              </>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full text-left bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
            >
              <LogOut size={16} className="mr-2" />
              {loggingOut ? '...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}