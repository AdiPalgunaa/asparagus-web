"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import { Users, Wifi, Calendar, BarChart3 } from 'lucide-react';
import Footer from '@/components/Footer';

export default function AdminHome() {
  const router = useRouter();
  const { user } = useAuth();

  const cards = [
    {
      title: 'Sistem',
      description: 'Pantau sistem semua petani',
      onClick: () => router.push('/admin/sistem'),
      icon: <Wifi className="w-6 h-6 text-blue-500" />
    },
    {
      title: 'Pencatatan',
      description: 'Kelola data pencatatan semua petani',
      onClick: () => router.push('/admin/pencatatan'),
      icon: <BarChart3 className="w-6 h-6 text-green-500" />
    }
  ];

  return (
    <ProtectedRoute role="admin">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-100 via-emerald-50 to-green-200">
        <Navbar />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-10 pt-25 shadow-md">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Kelompok Tani Mertanadi Desa Pelaga</h1>
              <p className="text-green-100 mt-1">Selamat datang, {user?.name}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {cards.map((card, index) => (
              <Card
                key={index}
                title={card.title}
                description={card.description}
                onClick={card.onClick}
                icon={card.icon}
              />
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Mengubah layout menjadi 2 kolom */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Total Petani</h3>
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-600">3</p>
              <p className="text-sm text-gray-500 mt-1">Petani terdaftar</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Data Terakhir</h3>
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-lg font-bold text-gray-800">{new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p className="text-sm text-gray-500 mt-1">Update terakhir</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}