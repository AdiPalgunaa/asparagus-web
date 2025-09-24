"use client";
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ role, children }) {
  const { user, loading, authChecked } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Tunggu sampai auth sudah dicek dan tidak dalam keadaan loading
    if (!loading && authChecked) {
      // Jika tidak ada user, redirect ke login
      if (!user) {
        router.push('/login');
        return;
      }

      // Jika role tidak sesuai, redirect ke halaman yang sesuai
      if (role && user.role !== role) {
        if (user.role === 'admin') {
          router.push('/admin/home');
        } else {
          router.push(`/petani/${user.petaniId}/home`);
        }
      }
    }
  }, [user, loading, authChecked, role, router]);

  // Tampilkan loading spinner selama auth belum selesai dicek
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Jika user ada dan role sesuai, tampilkan children
  if (user && (!role || user.role === role)) {
    return <>{children}</>;
  }

  // Jika tidak ada user atau role tidak sesuai, tampilkan nothing (akan di-redirect)
  return null;
}