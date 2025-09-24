"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { database, ref, onValue, set } from '@/lib/firebase';
import {
  Thermometer,
  Droplet,
  RefreshCw,
  Sprout,
  Clock,
  Calendar,
  Clock3,
  History,
  Wifi,
  WifiOff,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import React from "react";
import Footer from '@/components/Footer';

export default function PetaniSistem({ params }) {
  const [temperature, setTemperature] = useState(0);
  const [soilMoisture, setSoilMoisture] = useState(0);
  const [historyData, setHistoryData] = useState({});
  const [expandedDate, setExpandedDate] = useState(null);
  const [searchTodayHistory, setSearchTodayHistory] = useState("");
  const [searchPreviousHistory, setSearchPreviousHistory] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [deviceStatus, setDeviceStatus] = useState("offline");
  const [lastSeen, setLastSeen] = useState("");
  const [expandedTime, setExpandedTime] = useState(null);
  const [loading, setLoading] = useState(true);

  const { id } = React.use(params);
  const petaniId = parseInt(id);

  useEffect(() => {
    const updateDate = () => {
      const newDate = new Date().toISOString().split("T")[0];
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
      }
    };
    const interval = setInterval(updateDate, 60000);
    updateDate();
    return () => clearInterval(interval);
  }, [currentDate]);

  useEffect(() => {
    const dataRef = ref(database, `petani_${petaniId}/realtime_data`);
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTemperature(data.temperature || 0);
        setSoilMoisture(data.soil_moisture || 0);
        setLastSeen(data.last_seen || '');

        if (data.last_seen) {
          const lastSeenTime = new Date(data.last_seen);
          const currentTime = new Date();
          const diffInMinutes = (currentTime - lastSeenTime) / (1000 * 60);

          if (diffInMinutes < 1) {
            setDeviceStatus("online");
          } else {
            setDeviceStatus("offline");
          }
        } else {
          setDeviceStatus("offline");
        }

        const currentTime = new Date().toISOString();
        set(ref(database, `petani_${petaniId}/realtime_data/device_status`), deviceStatus);
        set(ref(database, `petani_${petaniId}/realtime_data/last_seen`), currentTime);
      }
    });
    return () => unsubscribe();
  }, [petaniId, deviceStatus]);

  useEffect(() => {
    const historyRef = ref(database, `petani_${petaniId}/history_data`);
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setHistoryData(data);
        setLoading(false);
      } else {
        setHistoryData({});
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching history data:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [petaniId]);

  const toggleDate = (date) => {
    setExpandedDate(expandedDate === date ? null : date);
    setExpandedTime(null);
  };

  const toggleTime = (date, time) => {
    const key = `${date}-${time}`;
    setExpandedTime(expandedTime === key ? null : key);
  };

  const sortedHistoryDates = Object.keys(historyData).sort().reverse();
  const sortedTimeEntries = (date) => {
    if (!historyData[date]) return [];
    const entries = historyData[date];
    return Object.keys(entries).sort().reverse();
  };

  const filteredTodayEntries = () => {
    const entries = sortedTimeEntries(currentDate);
    if (!searchTodayHistory) return entries;
    return entries.filter((time) =>
      time.toLowerCase().includes(searchTodayHistory.toLowerCase())
    );
  };

  const filteredPreviousDates = () => {
    const dates = sortedHistoryDates.filter((date) => date !== currentDate);
    if (!searchPreviousHistory) return dates;
    return dates.filter((date) =>
      date.toLowerCase().includes(searchPreviousHistory.toLowerCase())
    );
  };

  const getMoistureColor = (value) => {
    if (value < 30) return "text-red-500";
    if (value < 60) return "text-orange-500";
    return "text-green-500";
  };

  const getTemperatureColor = (value) => {
    if (value > 30) return "text-red-500";
    if (value < 18) return "text-blue-500";
    return "text-green-500";
  };

  const getStatusColor = (status) => {
    return status === 'online' ? 'text-green-600' : 'text-red-600';
  };

  const handleManualWatering = () => {
    const currentTime = new Date().toISOString();
    const validKey = currentTime.replace(/[\.\#\$\/\[\]]/g, '_');

    const wateringData = {
      temperature,
      soil_moisture: soilMoisture,
      event: "manual_watering_start",
      duration_minutes: 15,
      timestamp: currentTime
    };

    set(ref(database, `petani_${petaniId}/history_data/${currentDate}/${validKey}`), wateringData);
  };

  const handleRestart = () => {
    // Logic for restarting the IoT device
  };

  const renderTimeEntryData = (date, timeKey) => {
    if (!historyData[date] || !historyData[date][timeKey]) return null;
    const entryData = historyData[date][timeKey];

    return (
      <div className="bg-white p-4 rounded-xl mt-2 text-left shadow-sm border border-green-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <p className="text-lg flex items-center mb-2 sm:mb-0">
            <Thermometer className="mr-2 text-red-400" size={20} />
            <span className={`font-medium ${getTemperatureColor(entryData.temperature)}`}>
              Temperatur: {entryData.temperature}°C
            </span>
          </p>
          {entryData.event && (
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-medium flex items-center">
              {entryData.event === "manual_watering_start" && (
                <>
                  <Droplet className="mr-1" size={16} />
                  Siram Manual
                </>
              )}
              {entryData.event === "watering_start" && (
                <>
                  <Droplet className="mr-1" size={16} />
                  Siram Otomatis
                </>
              )}
            </span>
          )}
        </div>
        {entryData.duration_minutes && (
          <p className="text-md flex items-center mt-2 text-gray-700">
            <Clock className="mr-2 text-gray-500" size={18} />
            <span className="font-medium">
              Durasi: {entryData.duration_minutes} menit
            </span>
          </p>
        )}
        <div className="mt-3">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-md font-medium text-gray-800">
                Kelembaban Tanah
              </span>
              <Droplet className="text-blue-500" size={18} />
            </div>
            <div className={`text-2xl font-bold ${getMoistureColor(entryData.soil_moisture)}`}>
              {entryData.soil_moisture}%
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${entryData.soil_moisture}%` }}
              ></div>
            </div>
          </div>
        </div>
        {entryData.timestamp && (
          <p className="text-sm text-gray-500 mt-2">
            Waktu: {new Date(entryData.timestamp).toLocaleString('id-ID')}
          </p>
        )}
      </div>
    );
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
    } else {
      return `${diffSeconds} detik yang lalu`;
    }
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute role="petani">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-100 via-emerald-50 to-green-200">
        <Navbar />

        {/* Header Section (New) */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-10 pt-25 shadow-md">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Sprout className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Sistem Pemantauan</h1>
              <p className="text-green-100 mt-1">Petani {petaniId}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10 flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Temperatur</h3>
                  <Thermometer className="text-red-500" size={24} />
                </div>
                <div className={`text-5xl font-bold ${getTemperatureColor(temperature)}`}>
                  {temperature}°C
                </div>
                <p className="text-gray-500 mt-2 text-sm">
                  {temperature > 30
                    ? "Suhu terlalu tinggi"
                    : temperature < 18
                      ? "Suhu terlalu rendah"
                      : "Suhu optimal"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Kelembaban Tanah</h3>
                  <Droplet className="text-blue-500" size={24} />
                </div>
                <div className={`text-5xl font-bold ${getMoistureColor(soilMoisture)}`}>
                  {soilMoisture}%
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${soilMoisture}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Status Perangkat</h3>
                  {deviceStatus === 'online' ? (
                    <Wifi className="w-6 h-6 text-green-500" />
                  ) : (
                    <WifiOff className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <div className={`text-3xl font-bold capitalize ${getStatusColor(deviceStatus)}`}>
                  {deviceStatus === 'online' ? 'Aktif' : 'Offline'}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatLastUpdate(lastSeen)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Kontrol</h3>
                  <RefreshCw className="text-blue-500" size={24} />
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleManualWatering}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center transition-colors"
                  >
                    <Sprout className="mr-2" size={18} />
                    Siram Manual
                  </button>
                  <button
                    onClick={handleRestart}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center transition-colors"
                  >
                    <RefreshCw className="mr-2" size={18} />
                    Restart Device
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden transition-all hover:shadow-lg mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-green-100 pb-4 mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Clock3 className="mr-2 text-blue-500" size={22} />
                  Riwayat Penyiraman Hari Ini
                </h3>
                <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hidden sm:block">
                  {formatDateDisplay(currentDate)}
                </span>
              </div>
              <p className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg sm:hidden mb-4">
                {formatDateDisplay(currentDate)}
              </p>
              <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full pl-10 p-3"
                  placeholder="Cari waktu..."
                  value={searchTodayHistory}
                  onChange={(e) => setSearchTodayHistory(e.target.value)}
                />
              </div>
              <div className="h-96 overflow-y-auto pr-2 light-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                    <p className="text-lg">Memuat data...</p>
                  </div>
                ) : filteredTodayEntries().length > 0 ? (
                  filteredTodayEntries().map((timeKey) => (
                    <div key={timeKey} className="mb-3">
                      <div
                        className={`cursor-pointer font-medium rounded-xl p-4 flex items-center justify-between transition-all duration-200 ${
                          expandedTime === `${currentDate}-${timeKey}`
                            ? "bg-blue-50 border border-blue-100"
                            : "bg-green-50 hover:bg-green-100 border border-green-100"
                        }`}
                        onClick={() => toggleTime(currentDate, timeKey)}
                      >
                        <div className="flex items-center text-black">
                          <Clock className="mr-2 text-blue-500" size={18} />
                          {timeKey.includes('_') ?
                            new Date(timeKey.replace(/_/g, ':').replace('T', ' ')).toLocaleTimeString('id-ID')
                            : timeKey}
                        </div>
                        <span className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200 text-blue-600 flex items-center">
                          {expandedTime === `${currentDate}-${timeKey}` ? (
                            <>Tutup <ChevronUp size={14} className="ml-1" /></>
                          ) : (
                            <>Detail <ChevronDown size={14} className="ml-1" /></>
                          )}
                        </span>
                      </div>
                      {expandedTime === `${currentDate}-${timeKey}` && (
                        <div className="mt-3">
                          {renderTimeEntryData(currentDate, timeKey)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <History size={48} className="mb-3 opacity-50" />
                    <p className="text-xl text-center">Belum ada data untuk hari ini</p>
                    <p className="text-sm mt-2 text-center">Gunakan tombol "Siram Manual" untuk memulai</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden transition-all hover:shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-green-100 pb-4 mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Calendar className="mr-2 text-green-500" size={22} />
                  Riwayat Sebelumnya
                </h3>
              </div>
              <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full pl-10 p-3"
                  placeholder="Cari tanggal..."
                  value={searchPreviousHistory}
                  onChange={(e) => setSearchPreviousHistory(e.target.value)}
                />
              </div>
              <div className="h-96 overflow-y-auto pr-2 light-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                    <p className="text-lg">Memuat data...</p>
                  </div>
                ) : filteredPreviousDates().length > 0 ? (
                  filteredPreviousDates().map((date) => (
                    <div key={date} className="mb-3">
                      <div
                        className="cursor-pointer bg-green-50 p-4 rounded-xl text-left flex justify-between items-center hover:bg-green-100 border border-green-100 transition-colors"
                        onClick={() => toggleDate(date)}
                      >
                        <div className="flex items-center text-black">
                          <Calendar className="mr-2 text-green-500" size={18} />
                          {formatDateDisplay(date)}
                        </div>
                        <span className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200 text-blue-600 flex items-center">
                          {expandedDate === date ? (
                            <>Tutup <ChevronUp size={14} className="ml-1" /></>
                          ) : (
                            <>Lihat <ChevronDown size={14} className="ml-1" /></>
                          )}
                        </span>
                      </div>
                      {expandedDate === date && (
                        <div className="mt-3 bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                          {sortedTimeEntries(date).length > 0 ? (
                            sortedTimeEntries(date).map((timeKey) => (
                              <div key={timeKey} className="mb-3 last:mb-0">
                                <div
                                  className="cursor-pointer rounded-xl p-3 flex items-center justify-between transition-all duration-200 hover:bg-gray-50 border border-gray-100"
                                  onClick={() => toggleTime(date, timeKey)}
                                >
                                  <div className="flex items-center text-black">
                                    <Clock className="mr-2 text-blue-500" size={16} />
                                    {timeKey.includes('_') ?
                                      new Date(timeKey.replace(/_/g, ':').replace('T', ' ')).toLocaleTimeString('id-ID')
                                      : timeKey}
                                  </div>
                                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200 text-blue-600 flex items-center">
                                    {expandedTime === `${date}-${timeKey}` ? (
                                      <>Tutup <ChevronUp size={14} className="ml-1" /></>
                                    ) : (
                                      <>Detail <ChevronDown size={14} className="ml-1" /></>
                                    )}
                                  </span>
                                </div>
                                {expandedTime === `${date}-${timeKey}` && (
                                  <div className="mt-3">
                                    {renderTimeEntryData(date, timeKey)}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-gray-500">
                              <p>Tidak ada data untuk tanggal ini.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <History size={48} className="mb-3 opacity-50" />
                    <p className="text-xl">Belum ada data sebelumnya</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
        <style jsx global>{`
          .light-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .light-scrollbar::-webkit-scrollbar-track {
            background: #ffffff;
            border-radius: 4px;
          }
          .light-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 4px;
          }
          .light-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #cbd5e0;
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}