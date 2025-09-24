"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';
import { database, ref, onValue, set } from '@/lib/firebase';
import { Calendar, CheckCircle, Clock, AlertCircle, Plus, BarChart3, Sprout } from 'lucide-react';
import React from "react";
import Footer from '@/components/Footer';

export default function PetaniPencatatan({ params }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kelas: 'a',
    jumlah: ''
  });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);
  
  const { user } = useAuth();
  const { id } = React.use(params);
  const petaniId = parseInt(id);

  useEffect(() => {
    const recordsRef = ref(database, `petani_${petaniId}/pencatatan`);
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const recordsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        setRecords(recordsArray);
      } else {
        setRecords([]);
      }
      setRecordsLoading(false);
    });
    
    return () => unsubscribe();
  }, [petaniId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newRecord = {
        ...formData,
        petani: petaniId,
        jumlah: parseInt(formData.jumlah),
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: user.name
      };
      
      const newRecordRef = ref(database, `petani_${petaniId}/pencatatan/${Date.now()}`);
      await set(newRecordRef, newRecord);
      
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        kelas: 'a',
        jumlah: ''
      });
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <CheckCircle className="mr-1" size={14} />
            Terverifikasi
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <AlertCircle className="mr-1" size={14} />
            Ditolak
          </span>
        );
      default:
        return (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Clock className="mr-1" size={14} />
            Menunggu
          </span>
        );
    }
  };

  const getKelasLabel = (kelas) => {
    switch (kelas) {
      case 'a': return 'Kelas A';
      case 'b': return 'Kelas B';
      case 'c': return 'Kelas C';
      default: return kelas;
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
              <h1 className="text-3xl font-bold">Pencatatan Hasil Panen</h1>
              <p className="text-green-100 mt-1">Petani {petaniId}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
          {/* Statistik Ringkas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Total Data</h3>
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{records.length}</p>
              <p className="text-sm text-gray-500 mt-1">Data pencatatan</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Terverifikasi</h3>
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                {records.filter(r => r.status === 'verified').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Data sudah diverifikasi</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Menunggu</h3>
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {records.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Data menunggu verifikasi</p>
            </div>
          </div>
          
          {/* Form Pencatatan */}
          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden transition-all hover:shadow-lg mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-green-100 pb-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Plus className="mr-2 text-blue-500" size={22} />
                  Tambah Data Panen
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="tanggal"
                      value={formData.tanggal}
                      onChange={handleChange}
                      className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kelas Asparagus</label>
                  <select
                    name="kelas"
                    value={formData.kelas}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="a">Kelas A</option>
                    <option value="b">Kelas B</option>
                    <option value="c">Kelas C</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah (kg)</label>
                  <input
                    type="number"
                    name="jumlah"
                    value={formData.jumlah}
                    onChange={handleChange}
                    min="1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="0"
                    required
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl disabled:opacity-50 flex items-center justify-center transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2" size={18} />
                        Simpan Data
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Tabel Data */}
          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden transition-all hover:shadow-lg">
            <div className="p-6 border-b border-green-100">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <BarChart3 className="mr-2 text-blue-500" size={22} />
                Data Pencatatan Saya
              </h2>
            </div>
            
            {recordsLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-lg">Memuat data...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Belum ada data pencatatan</p>
                <p className="text-sm mt-2">Silakan tambah data menggunakan form di atas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Kelas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Jumlah (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Tanggal Input</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-green-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatDateDisplay(record.tanggal)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getKelasLabel(record.kelas)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">{record.jumlah} kg</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {record.createdAt ? new Date(record.createdAt).toLocaleDateString('id-ID') : '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}