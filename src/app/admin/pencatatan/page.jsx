"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';
import { database, ref, onValue, set, update } from '@/lib/firebase';
import { Plus, Filter, RotateCcw, CheckCircle, Clock, Trash2, User, Calendar, BarChart3, Download } from 'lucide-react';
import Footer from '@/components/Footer';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminPencatatan() {
  const [formData, setFormData] = useState({
    petani: '1',
    tanggal: new Date().toISOString().split('T')[0],
    kelas: 'a',
    jumlah: '',
    status: 'verified'
  });
  const [allRecords, setAllRecords] = useState([]);
  const [filterPetani, setFilterPetani] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);
  
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");

  const { user } = useAuth();

  useEffect(() => {
    // Load data dari semua petani
    const loadAllRecords = () => {
      const records = [];
      const unsubscribeFunctions = [];
      let loadedCount = 0;
      
      for (let i = 1; i <= 3; i++) {
        const recordsRef = ref(database, `petani_${i}/pencatatan`);
        const unsubscribe = onValue(recordsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const petaniRecords = Object.keys(data).map(key => ({
              id: key,
              petani: i,
              ...data[key]
            }));
            
            // Update state dengan records baru
            setAllRecords(prev => {
              // Hapus records lama untuk petani ini
              const filtered = prev.filter(r => r.petani !== i);
              return [...filtered, ...petaniRecords].sort((a, b) => 
                new Date(b.tanggal + 'T' + (b.createdAt || '')) - new Date(a.tanggal + 'T' + (a.createdAt || ''))
              );
            });
          }
          loadedCount++;
          if (loadedCount === 3) {
            setRecordsLoading(false);
          }
        });
        unsubscribeFunctions.push(unsubscribe);
      }
      
      return () => unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
    
    const cleanup = loadAllRecords();
    return cleanup;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newRecord = {
        tanggal: formData.tanggal,
        kelas: formData.kelas,
        jumlah: parseInt(formData.jumlah),
        status: formData.status,
        verifiedBy: user.name,
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      // Simpan ke Firebase
      const newRecordRef = ref(database, `petani_${formData.petani}/pencatatan/${Date.now()}`);
      await set(newRecordRef, newRecord);
      
      // Reset form
      setFormData({
        petani: '1',
        tanggal: new Date().toISOString().split('T')[0],
        kelas: 'a',
        jumlah: '',
        status: 'verified'
      });
      
      // Tidak menampilkan alert
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

  const handleVerify = async (recordId, petaniId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'verified' ? 'pending' : 'verified';
      const updates = {
        status: newStatus,
        verifiedBy: user.name,
        verifiedAt: new Date().toISOString()
      };
      
      await update(ref(database, `petani_${petaniId}/pencatatan/${recordId}`), updates);
      // Tidak menampilkan alert
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (recordId, petaniId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      await set(ref(database, `petani_${petaniId}/pencatatan/${recordId}`), null);
      // Tidak menampilkan alert
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

  // Filter records berdasarkan pilihan
  const filteredRecords = allRecords.filter(record => {
    if (filterPetani !== 'all' && record.petani !== parseInt(filterPetani)) return false;
    if (filterStatus !== 'all' && record.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <CheckCircle className="mr-1" size={14} />
            Terverifikasi
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

  const handleExport = () => {
    // Filter data terverifikasi
    let exportData = allRecords.filter(r => r.status === "verified");

    // Filter berdasarkan rentang tanggal jika diisi
    if (exportStart && exportEnd) {
      const startDate = new Date(exportStart);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(exportEnd);
      endDate.setHours(23, 59, 59, 999);
      
      exportData = exportData.filter(r => {
        const recordDate = new Date(r.tanggal);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    // Cek apakah ada data
    if (exportData.length === 0) {
      alert("Tidak ada data terverifikasi untuk rentang tanggal ini.");
      return;
    }

    // Urutkan data berdasarkan tanggal (terlama ke terbaru)
    exportData.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    // Buat PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("Laporan Pencatatan Panen Terverifikasi", 14, 20);
    
    // Informasi rentang tanggal
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (exportStart && exportEnd) {
      const startDateFormatted = new Date(exportStart).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const endDateFormatted = new Date(exportEnd).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      doc.text(`Periode: ${startDateFormatted} - ${endDateFormatted}`, 14, 27);
    } else {
      doc.text(`Semua Data Terverifikasi`, 14, 27);
    }

    // Tanggal export
    const exportDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Dicetak: ${exportDate}`, 14, 33);

    // Siapkan data tabel
    const tableData = exportData.map((r, idx) => [
      idx + 1,
      `Petani ${r.petani}`,
      new Date(r.tanggal).toLocaleDateString("id-ID", {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      getKelasLabel(r.kelas),
      r.jumlah + " kg",
      r.verifiedBy || "-",
      r.verifiedAt ? new Date(r.verifiedAt).toLocaleDateString("id-ID", {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : "-"
    ]);

    // Hitung total per kelas
    const totalA = exportData.filter(r => r.kelas === 'a').reduce((sum, r) => sum + r.jumlah, 0);
    const totalB = exportData.filter(r => r.kelas === 'b').reduce((sum, r) => sum + r.jumlah, 0);
    const totalC = exportData.filter(r => r.kelas === 'c').reduce((sum, r) => sum + r.jumlah, 0);
    const totalSemua = totalA + totalB + totalC;

    // Buat tabel
    doc.autoTable({
      head: [["No", "Petani", "Tanggal", "Kelas", "Jumlah", "Diverifikasi Oleh", "Tgl Verifikasi"]],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244]
      }
    });

    // Tambahkan ringkasan
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Ringkasan:", 14, finalY);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Kelas A: ${totalA} kg`, 14, finalY + 7);
    doc.text(`Total Kelas B: ${totalB} kg`, 14, finalY + 14);
    doc.text(`Total Kelas C: ${totalC} kg`, 14, finalY + 21);
    
    doc.setFont(undefined, 'bold');
    doc.text(`Total Semua Kelas: ${totalSemua} kg`, 14, finalY + 28);

    // Simpan PDF
    const fileName = exportStart && exportEnd 
      ? `laporan_pencatatan_${exportStart}_${exportEnd}.pdf`
      : `laporan_pencatatan_${Date.now()}.pdf`;
    
    doc.save(fileName);
  };

  return (
    <ProtectedRoute role="admin">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-100 via-emerald-50 to-green-200">
        <Navbar />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-10 pt-25 shadow-md">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pencatatan Hasil Panen</h1>
              <p className="text-green-100 mt-1">Kelola data pencatatan semua petani</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
          {/* Form Export */}
          <div className="bg-white rounded-2xl shadow-md border border-green-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Download className="mr-2 text-blue-500" size={20} />
              Export Data Terverifikasi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <button
                  onClick={handleExport}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Download className="mr-2" size={18} />
                  Export PDF
                </button>
              </div>
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
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Petani</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="petani"
                      value={formData.petani}
                      onChange={handleChange}
                      className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="1">Petani 1</option>
                      <option value="2">Petani 2</option>
                      <option value="3">Petani 3</option>
                    </select>
                  </div>
                </div>
                
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
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
          
          {/* Filter */}
          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden transition-all hover:shadow-lg mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-green-100 pb-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Filter className="mr-2 text-blue-500" size={22} />
                  Filter Data
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Petani</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      value={filterPetani}
                      onChange={(e) => setFilterPetani(e.target.value)}
                      className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="all">Semua Petani</option>
                      <option value="1">Petani 1</option>
                      <option value="2">Petani 2</option>
                      <option value="3">Petani 3</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="verified">Terverifikasi</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilterPetani('all');
                      setFilterStatus('all');
                    }}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <RotateCcw className="mr-2" size={16} />
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabel Data */}
          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden transition-all hover:shadow-lg">
            <div className="p-6 border-b border-green-100">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <BarChart3 className="mr-2 text-blue-500" size={22} />
                Data Pencatatan Petani
              </h2>
            </div>
            
            {recordsLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-lg">Memuat data...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Tidak ada data pencatatan</p>
                <p className="text-sm mt-2">Gunakan form di atas untuk menambah data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Petani</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Kelas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Jumlah (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={`${record.petani}-${record.id}`} className="hover:bg-green-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="mr-2 text-blue-500" size={16} />
                            <span className="font-medium">Petani {record.petani}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDateDisplay(record.tanggal)}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleVerify(record.id, record.petani, record.status)}
                            className={`px-3 py-1 mb-3 text-sm rounded-xl font-medium transition-colors ${
                              record.status === 'verified'
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {record.status === 'verified' ? 'Batalkan' : 'Verifikasi'}
                          </button>
                          <button
                            onClick={() => handleDelete(record.id, record.petani)}
                            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}