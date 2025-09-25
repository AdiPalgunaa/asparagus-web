"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { database, ref, onValue } from '@/lib/firebase';
import {
  Thermometer,
  Droplet,
  User,
  Wifi,
  WifiOff,
  Users,
  Clock
} from 'lucide-react';
import Footer from '@/components/Footer';

export default function AdminSistem() {
  const [petaniData, setPetaniData] = useState({});
  const [selectedPetani, setSelectedPetani] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPetaniData = () => {
      const data = {};
      const unsubscribeFunctions = [];

      for (let i = 1; i <= 3; i++) {
        const petaniRef = ref(database, `petani_${i}/realtime_data`);
        const unsubscribe = onValue(petaniRef, (snapshot) => {
          const petaniData = snapshot.val();
          if (petaniData) {
            // Check device status based on last_seen
            const now = new Date();
            const lastSeenTime = new Date(petaniData.last_seen);
            const diffInMinutes = (now - lastSeenTime) / (1000 * 60);
            const status = diffInMinutes < 1 ? 'online' : 'offline';
            data[i] = { ...petaniData, device_status: status };
            setPetaniData({ ...data });
          } else {
             // Handle case where data is not available
             data[i] = { device_status: 'offline' };
             setPetaniData({ ...data });
          }
          setLoading(false);
        });
        unsubscribeFunctions.push(unsubscribe);
      }

      return () => unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };

    const cleanup = loadPetaniData();
    return cleanup;
  }, []);

  const getTemperatureColor = (value) => {
    if (value > 30) return "text-red-500";
    if (value < 18) return "text-blue-500";
    return "text-green-500";
  };

  const getMoistureColor = (value) => {
    if (value < 40) return "text-red-500";
    if (value > 60) return "text-green-500";
    return "text-blue-500";
  };

  const getStatusColor = (status) => {
    return status === 'online' ? 'text-green-600' : 'text-red-600';
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Belum ada update';

    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffSeconds = Math.floor(diffTime / 1000);

    if (diffDays > 0) {
      return `${diffDays} hari yang lalu`;
    } else if (diffHours > 0) {
      return `${diffHours} jam yang lalu`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} menit yang lalu`;
    } else if (diffSeconds >= 0) {
      return `Baru saja`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-100 via-emerald-50 to-green-200">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Memuat data sistem...</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedPetaniData = petaniData[selectedPetani] || {};

  return (
    <ProtectedRoute role="admin">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-100 via-emerald-50 to-green-200">
        <Navbar />

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-10 pt-25 shadow-md">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Wifi className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Sistem Pemantauan</h1>
              <p className="text-green-100 mt-1">Pantau semua sistem petani asparagus</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-10 flex-1 w-full">
          {/* Pilihan Petani */}
          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden transition-all hover:shadow-lg mb-8">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-green-100 pb-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-2 sm:mb-0">
                  <Users className="mr-2 text-blue-500" size={22} />
                  Pilih Petani
                </h2>
              </div>
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3].map((petaniId) => (
                  <button
                    key={petaniId}
                    onClick={() => setSelectedPetani(petaniId)}
                    className={`flex-1 text-center px-6 py-3 rounded-xl font-medium transition-colors ${
                      selectedPetani === petaniId
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Petani {petaniId}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Data Petani Terpilih */}
          {selectedPetaniData.last_seen ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Temperature Card */}
              <div className="bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Temperatur</h3>
                    <Thermometer className={getTemperatureColor(selectedPetaniData.temperature)} size={24} />
                  </div>
                  <div className={`text-5xl font-bold ${getTemperatureColor(selectedPetaniData.temperature)}`}>
                    {selectedPetaniData.temperature || 0}°C
                  </div>
                  <p className="text-gray-500 mt-2 text-sm">
                    {selectedPetaniData.temperature > 30
                      ? "Suhu terlalu tinggi"
                      : selectedPetaniData.temperature < 18
                        ? "Suhu terlalu rendah"
                        : "Suhu optimal"}
                  </p>
                </div>
              </div>

              {/* Soil Moisture Summary Card */}
              <div className="bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Kelembaban Tanah</h3>
                    <Droplet className={getMoistureColor(selectedPetaniData.soil_moisture)} size={24} />
                  </div>
                  <div className={`text-5xl font-bold ${getMoistureColor(selectedPetaniData.soil_moisture)}`}>
                    {selectedPetaniData.soil_moisture || 0}%
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3">
                    <div
                      className={`h-2.5 rounded-full ${getMoistureColor(selectedPetaniData.soil_moisture) === 'text-red-500' ? 'bg-red-500' : getMoistureColor(selectedPetaniData.soil_moisture) === 'text-blue-500' ? 'bg-blue-500' : 'bg-green-500'}`}
                      style={{ width: `${selectedPetaniData.soil_moisture || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Status Device Card */}
              <div className="bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Status Perangkat</h3>
                    {selectedPetaniData.device_status === 'online' ? (
                      <Wifi className="w-6 h-6 text-green-500" />
                    ) : (
                      <WifiOff className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className={`text-3xl font-bold capitalize ${getStatusColor(selectedPetaniData.device_status)}`}>
                    {selectedPetaniData.device_status === 'online' ? 'Aktif' : 'Tidak Aktif'}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatLastUpdate(selectedPetaniData.last_seen)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>Data untuk Petani {selectedPetani} tidak tersedia.</p>
            </div>
          )}

          {/* Data Ringkas Semua Petani */}
          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden transition-all hover:shadow-lg">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-green-100 pb-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-2 sm:mb-0">
                  <Users className="mr-2 text-blue-500" size={22} />
                  Ringkasan Semua Petani
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((petaniId) => (
                  <div key={petaniId} className="bg-green-50 p-5 rounded-xl border border-green-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <User className="mr-2 text-blue-500" size={18} />
                      Petani {petaniId}
                    </h3>
                    {petaniData[petaniId] && petaniData[petaniId].last_seen ? (
                      <>
                        <div className="flex items-center mb-3">
                          {petaniData[petaniId].device_status === 'online' ? (
                            <Wifi className="text-green-500 mr-2" size={16} />
                          ) : (
                            <WifiOff className="text-red-500 mr-2" size={16} />
                          )}
                          <span className={getStatusColor(petaniData[petaniId].device_status)}>
                            {petaniData[petaniId].device_status === 'online' ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="flex items-center">
                            <Thermometer className={getTemperatureColor(petaniData[petaniId].temperature)} size={14} />
                            <span className="text-sm">{petaniData[petaniId].temperature || 0}°C</span>
                          </div>
                          <div className="flex items-center">
                            <Droplet className={getMoistureColor(petaniData[petaniId].soil_moisture)} size={14} />
                            <span className="text-sm">{petaniData[petaniId].soil_moisture || 0}%</span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="mr-1 text-gray-400" size={14} />
                          <span>{formatLastUpdate(petaniData[petaniId].last_seen)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <WifiOff className="text-red-500 mr-2" size={16} />
                        <p>Data tidak tersedia</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}