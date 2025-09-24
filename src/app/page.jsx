"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect berdasarkan status auth
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/home');
      } else {
        router.push(`/petani/${user.petaniId}/home`);
      }
    } else {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Mengarahkan...</p>
      </div>
    </div>
  );
}