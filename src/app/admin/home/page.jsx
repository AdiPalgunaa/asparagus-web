"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import { Users, Wifi, Calendar, BarChart3, Clock } from 'lucide-react';
import React, { useState, useEffect } from "react";
import { database, ref, onValue } from '@/lib/firebase';
import Footer from '@/components/Footer';

export default function AdminHome() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [lastAddedData, setLastAddedData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const farmerIds = [1, 2, 3]; // Daftar ID petani

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

  useEffect(() => {
    const listeners = [];
    const allRecords = [];

    const setupListeners = async () => {
      setLoading(true);
      const promises = farmerIds.map(id => {
        return new Promise(resolve => {
          const pathRef = ref(database, `petani_${id}/pencatatan`);
          const listener = onValue(pathRef, (snapshot) => {
            const data = snapshot.val();
            const records = data ? Object.values(data).map(record => ({ ...record, farmerId: id })) : [];
            resolve(records);
          });
          listeners.push(listener);
        });
      });

      Promise.all(promises).then(results => {
        const flattenedRecords = results.flat();
        
        if (flattenedRecords.length > 0) {
          const sortedRecords = flattenedRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLastAddedData(sortedRecords[0]);
        } else {
          setLastAddedData(null);
        }
        setLoading(false);
      });
    };

    setupListeners();

    return () => {
      listeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);
  
  const formatDisplayDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Belum ada update';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} hari yang lalu`;
    } else if (diffHours > 0) {
      return `${diffHours} jam yang lalu`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} menit yang lalu`;
    } else {
      return 'Baru saja';
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-800">
                    {formatDisplayDate(lastAddedData?.createdAt)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {lastAddedData ? `Terakhir ditambahkan oleh Petani ${lastAddedData.farmerId}` : 'Belum ada data'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}