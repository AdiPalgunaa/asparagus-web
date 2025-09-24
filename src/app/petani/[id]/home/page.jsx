"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import { Sprout, Wifi, WifiOff, Database, Clock } from "lucide-react";
import React, { useState, useEffect } from "react";
import { database, ref, onValue } from '@/lib/firebase';
import Footer from '@/components/Footer';

export default function PetaniHome({ params }) {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = React.use(params);
  const petaniId = parseInt(id);

  // State untuk data real-time
  const [deviceStatus, setDeviceStatus] = useState('offline');
  const [recordsCount, setRecordsCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('');
  const [loading, setLoading] = useState(true);

  // Daftar card menu
  const cards = [
    {
      title: 'Sistem',
      description: 'Pantau dan kontrol sistem penyiraman asparagus',
      onClick: () => router.push(`/petani/${petaniId}/sistem`)
    },
    {
      title: 'Pencatatan',
      description: 'Catat hasil panen asparagus',
      onClick: () => router.push(`/petani/${petaniId}/pencatatan`)
    }
  ];

  // Fetch data dari Firebase
  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      
      // Reference untuk realtime data
      const realtimeRef = ref(database, `petani_${petaniId}/realtime_data`);
      const pencatatanRef = ref(database, `petani_${petaniId}/pencatatan`);

      // Listen untuk realtime data
      const unsubscribeRealtime = onValue(realtimeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setDeviceStatus(data.device_status || 'offline');
          setLastUpdate(data.last_seen || '');
        }
      });

      // Listen untuk data pencatatan
      const unsubscribePencatatan = onValue(pencatatanRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const records = Object.keys(data).length;
          setRecordsCount(records);
        } else {
          setRecordsCount(0);
        }
        setLoading(false);
      });

      // Cleanup function
      return () => {
        unsubscribeRealtime();
        unsubscribePencatatan();
      };
    };

    fetchData();
  }, [petaniId]);

  // Format waktu terakhir update
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

  // Format tanggal untuk display
  const formatDisplayDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <ProtectedRoute role="petani">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-100 via-emerald-50 to-green-200">
        {/* Navbar */}
        <Navbar />
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-10 pt-25 shadow-md">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Sprout className="w-8 h-8 text-green-600" />
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
              />
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Sistem Card */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Status Sistem</h3>
                {deviceStatus === 'online' ? (
                  <Wifi className="w-6 h-6 text-green-500" />
                ) : (
                  <WifiOff className="w-6 h-6 text-red-500" />
                )}
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <p className={`text-3xl font-bold ${
                    deviceStatus === 'online' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {deviceStatus === 'online' ? 'Aktif' : 'Offline'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {deviceStatus === 'online' ? 'Sistem berjalan normal' : 'Sistem tidak aktif'}
                  </p>
                </>
              )}
            </div>

            {/* Pencatatan Card */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Data Pencatatan</h3>
                <Database className="w-6 h-6 text-blue-500" />
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-blue-600">{recordsCount}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {recordsCount === 1 ? 'data tersimpan' : 'data tersimpan'}
                  </p>
                </>
              )}
            </div>

            {/* Last Update Card */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Terakhir Update</h3>
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-800">
                    {formatDisplayDate(lastUpdate)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatLastUpdate(lastUpdate)}
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