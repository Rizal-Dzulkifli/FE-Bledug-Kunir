import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconX from '../../../components/Icon/IconX';
import IconSave from '../../../components/Icon/IconSave';
import IconPlus from '../../../components/Icon/IconPlus';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import { Icon } from '@iconify-icon/react';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';

interface Pelanggan {
  id_kontak: number;
  nama: string;
  no_telp: string | null;
  alamat: string | null;
}

interface BarangMentah {
  id_barangmentah: number;
  id_bm: number;
  kode: string;
  berat_mentah: number;
  harga_beli: number;
  harga_jual: number;
  nama_barang_mentah?: string; // Added for transformed data
  namaBarangMentah?: {
    id_bm: number;
    nama_barang_mentah: string;
    kode_barang: string;
  };
}

interface Produk {
  id_produk_detail: number;
  id_produk: number;
  kode: string;
  berat_produk: number;
  harga_jual: number;
  stok: number;
  nama_produk?: string; // Added for transformed data
  namaProduk?: {
    id_produk: number;
    nama_produk: string;
    kode_produk: string;
  };
}

interface DetailBarang {
  jenis_barang: 'barang_mentah' | 'produk';
  id_barang_mentah?: number;
  id_produk?: number;
  berat?: number; // dalam kg (akan dikonversi ke gram untuk database)
  stok?: number; // untuk produk dalam unit/pcs
  harga_satuan?: number;
  subtotal?: number;
  nama_barang?: string;
  catatan?: string;
}

interface PesananForm {
  id_pelanggan: number | null;
  tgl_pesanan: string;
  status_pemesanan: 'Menunggu' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan';
  status_pembayaran: 'Belum Dibayar' | 'Sudah Dibayar' | 'DP' | 'Lunas';
  mode_pengiriman: 'Dijemput' | 'Dikirim';
  deskripsi: string;
  detail_barang: DetailBarang[];
}

const EditPesanan = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [barangMentahList, setBarangMentahList] = useState<BarangMentah[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [originalStatus, setOriginalStatus] = useState<string>('Menunggu'); // Track original status
  
  const [formData, setFormData] = useState<PesananForm>({
    id_pelanggan: null,
    tgl_pesanan: new Date().toISOString().split('T')[0],
    status_pemesanan: 'Menunggu',
    status_pembayaran: 'Belum Dibayar',
    mode_pengiriman: 'Dijemput',
    deskripsi: '',
    detail_barang: []
  });

  useEffect(() => {
    dispatch(setPageTitle('Edit Pesanan'));
    fetchPelanggan();
    fetchBarangMentah();
    fetchProduk();
    if (id) {
      fetchPesananDetail(id);
    }
  }, [dispatch, id]);

  const fetchPesananDetail = async (pesananId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('=== Fetching Pesanan Detail ===', pesananId);
      
      const response = await fetch(buildApiUrl(`pesanan/${pesananId}`), {
        headers: getAuthHeaders(),
      });

      console.log('📥 Pesanan Detail response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Pesanan Detail data:', result);
        const pesanan = result.data;
        
        // Save original status to track changes
        setOriginalStatus(pesanan.status_pemesanan);
        
        // Debug: Log detail pesanan data
        console.log('Detail Pesanan dari API:', pesanan.detailPesanan);
        
        setFormData({
          id_pelanggan: pesanan.id_pelanggan,
          tgl_pesanan: pesanan.tgl_pesanan,
          status_pemesanan: pesanan.status_pemesanan,
          status_pembayaran: pesanan.status_pembayaran,
          mode_pengiriman: pesanan.mode_pengiriman,
          deskripsi: pesanan.deskripsi || '',
          detail_barang: pesanan.detailPesanan.map((detail: any) => {
            console.log('Processing detail item:', detail);
            
            // Clean up data - pastikan berat dan stok reasonable
            let cleanBerat = detail.berat || 0;
            let cleanStok = detail.stok || 0;
            
            // Debug log untuk melihat data mentah
            console.log('Raw detail data:', {
              jenis_barang: detail.jenis_barang,
              berat_raw: detail.berat,
              stok_raw: detail.stok,
              kuantitas_raw: detail.kuantitas
            });
            
            return {
              jenis_barang: detail.jenis_barang,
              id_barang_mentah: detail.id_barang_mentah,
              id_produk: detail.id_produk,
              // Berat untuk barang mentah DAN produk, stok untuk produk saja
              berat: cleanBerat || 0, // Berat untuk semua jenis (barang mentah dan produk)
              stok: detail.jenis_barang === 'produk' ? cleanStok : 0,
              harga_satuan: detail.harga_satuan,
              subtotal: detail.subtotal,
              catatan: detail.catatan || '',
              nama_barang: detail.jenis_barang === 'barang_mentah' 
                ? detail.barangMentah?.namaBarangMentah?.nama_barang_mentah
                : detail.produk?.namaProduk?.nama_produk
            };
          })
        });
      } else {
        const errorText = await response.text();
        console.log('❌ Pesanan Detail response error:', errorText);
        throw new Error(`Failed to fetch pesanan: ${response.status}`);
      }
    } catch (error) {
      console.log('💥 Error fetching pesanan detail:', error);
      Swal.fire('Error', 'Gagal memuat data pesanan', 'error');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchPelanggan = async () => {
    try {
      console.log('=== Fetching Pelanggan ===');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found for pelanggan');
        return;
      }

      const response = await fetch(buildApiUrl('kontaks/pelanggan'), {
        headers: getAuthHeaders(),
      });

      console.log('📥 Pelanggan response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Pelanggan data:', result);
        setPelangganList(result.data || []);
      } else {
        console.log('❌ Pelanggan response error:', await response.text());
      }
    } catch (error) {
      console.log('💥 Error fetching pelanggan:', error);
    }
  };

  const fetchBarangMentah = async () => {
    try {
      console.log('=== Fetching Barang Mentah ===');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found for barang mentah');
        return;
      }

      const response = await fetch(buildApiUrl('barang-mentah/all'), {
        headers: getAuthHeaders(),
      });

      console.log('📥 Barang Mentah response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Barang Mentah data:', result);
        
        // Transform data untuk menambahkan nama_barang_mentah
        const transformedData = (result.data || []).map((item: any) => ({
          ...item,
          nama_barang_mentah: item.namaBarangMentah?.nama_barang_mentah || item.nama_barang_mentah,
        }));
        
        setBarangMentahList(transformedData);
      } else {
        console.log('❌ Barang Mentah response error:', await response.text());
      }
    } catch (error) {
      console.log('💥 Error fetching barang mentah:', error);
    }
  };

  const fetchProduk = async () => {
    try {
      console.log('=== Fetching Produk ===');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found for produk');
        return;
      }

      const response = await fetch(buildApiUrl('produk/all'), {
        headers: getAuthHeaders(),
      });

      console.log('📥 Produk response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Produk data:', result);
        
        // Transform data untuk menambahkan nama_produk
        const transformedData = (result.data || []).map((item: any) => ({
          ...item,
          nama_produk: item.namaProduk?.nama_produk || item.nama_produk,
        }));
        
        setProdukList(transformedData);
      } else {
        console.log('❌ Produk response error:', await response.text());
      }
    } catch (error) {
      console.log('💥 Error fetching produk:', error);
    }
  };

  const addDetailBarang = () => {
    setFormData(prev => ({
      ...prev,
      detail_barang: [
        ...prev.detail_barang,
        {
          jenis_barang: 'barang_mentah',
          berat: 0.1, // Minimum 0.1 kg  
          stok: 1, // Minimum 1 unit untuk produk
          catatan: ''
        }
      ]
    }));
  };

  const removeDetailBarang = (index: number) => {
    setFormData(prev => ({
      ...prev,
      detail_barang: prev.detail_barang.filter((_, i) => i !== index)
    }));
  };

  const updateDetailBarang = (index: number, field: keyof DetailBarang, value: any) => {
    console.log(`updateDetailBarang: field=${field}, value=${value}, type=${typeof value}`);
    setFormData(prev => ({
      ...prev,
      detail_barang: prev.detail_barang.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };

          // Reset fields when changing jenis_barang
          if (field === 'jenis_barang') {
            updated.id_barang_mentah = undefined;
            updated.id_produk = undefined;
            updated.harga_satuan = undefined;
            updated.subtotal = undefined;
            updated.nama_barang = undefined;
          }

          // Update harga dan subtotal when selecting barang
          if (field === 'id_barang_mentah' && value) {
            const barangMentah = barangMentahList.find(b => b.id_barangmentah === parseInt(value));
            if (barangMentah) {
              updated.harga_satuan = barangMentah.harga_jual;
              // Untuk barang mentah, subtotal berdasarkan berat
              updated.subtotal = (updated.berat || 0) * barangMentah.harga_jual;
              updated.nama_barang = barangMentah.namaBarangMentah?.nama_barang_mentah;
            }
          }

          if (field === 'id_produk' && value) {
            const produk = produkList.find(p => p.id_produk_detail === parseInt(value));
            if (produk) {
              updated.harga_satuan = produk.harga_jual;
              // Untuk produk, subtotal berdasarkan BERAT (sama seperti barang mentah)
              updated.subtotal = (updated.berat || 0) * produk.harga_jual;
              updated.nama_barang = produk.namaProduk?.nama_produk;
            }
          }

          // Update subtotal saat mengubah berat atau stok
          if (field === 'berat' && updated.harga_satuan) {
            updated.subtotal = value * updated.harga_satuan;
          }

          if (field === 'stok' && updated.harga_satuan) {
            // Untuk produk, ketika stok berubah, update subtotal berdasarkan BERAT, bukan stok
            updated.subtotal = (updated.berat || 0) * updated.harga_satuan;
          }

          return updated;
        }
        return item;
      })
    }));
  };

  const calculateTotal = () => {
    return formData.detail_barang.reduce((total, item) => total + (item.subtotal || 0), 0);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: string) => {
    // Jika status berubah menjadi 'Dikirim' atau 'Selesai' dari status lain
    if ((newStatus === 'Dikirim' || newStatus === 'Selesai') && 
        (originalStatus !== 'Dikirim' && originalStatus !== 'Selesai')) {
      
      // Buat ringkasan barang
      const itemsSummary = formData.detail_barang.map(item => {
        if (item.jenis_barang === 'barang_mentah') {
          const barang = barangMentahList.find(b => b.id_barangmentah === item.id_barang_mentah);
          return `• ${barang?.nama_barang_mentah || 'Barang Mentah'}: ${item.berat} kg`;
        } else {
          const produk = produkList.find(p => p.id_produk_detail === item.id_produk);
          return `• ${produk?.nama_produk || 'Produk'}: ${item.stok} pcs (${item.berat} kg)`;
        }
      }).join('\n');

      const result = await Swal.fire({
        title: 'Konfirmasi Perubahan Status',
        html: `
          <div class="text-left">
            <p class="mb-3"><strong>Mengubah status ke "${newStatus}" akan mengurangi inventaris:</strong></p>
            <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm mb-3">
              <pre class="whitespace-pre-wrap">${itemsSummary}</pre>
            </div>
            <p class="text-warning"><strong>⚠️ Pastikan stok mencukupi!</strong></p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Ubah Status',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
      });

      if (!result.isConfirmed) {
        return false; // User cancelled
      }
    }
    
    // Jika status berubah dari 'Dikirim'/'Selesai' ke status lain
    else if ((originalStatus === 'Dikirim' || originalStatus === 'Selesai') && 
             (newStatus !== 'Dikirim' && newStatus !== 'Selesai')) {
      const result = await Swal.fire({
        title: 'Konfirmasi Perubahan Status',
        html: `
          <div class="text-left">
            <p class="mb-3">Mengubah status dari <strong>"${originalStatus}"</strong> ke <strong>"${newStatus}"</strong> akan <strong>mengembalikan stok inventaris</strong>.</p>
            <p class="text-info">ℹ️ Stok yang sudah dikurangi akan dikembalikan.</p>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Ya, Ubah Status',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
      });

      if (!result.isConfirmed) {
        return false; // User cancelled
      }
    }

    return true; // Proceed with change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (!formData.id_pelanggan) {
      Swal.fire('Error', 'Pelanggan harus dipilih', 'error');
      return;
    }

    if (formData.detail_barang.length === 0) {
      Swal.fire('Error', 'Minimal harus ada satu barang', 'error');
      return;
    }

    // Check if status will change and requires confirmation
    const statusConfirmed = await handleStatusChange(formData.status_pemesanan);
    if (!statusConfirmed) {
      return; // User cancelled the status change
    }

    // Validasi detail barang
    console.log('Validating form data (Edit):', formData);
    for (let i = 0; i < formData.detail_barang.length; i++) {
      const item = formData.detail_barang[i];
      console.log(`Validating item ${i + 1} (Edit):`, item);
      if (item.jenis_barang === 'barang_mentah' && !item.id_barang_mentah) {
        Swal.fire('Error', `Barang mentah pada baris ${i + 1} harus dipilih`, 'error');
        return;
      }
      if (item.jenis_barang === 'produk' && !item.id_produk) {
        Swal.fire('Error', `Produk pada baris ${i + 1} harus dipilih`, 'error');
        return;
      }

      // Validasi berat untuk barang mentah
      if (item.jenis_barang === 'barang_mentah') {
        if (!item.berat || item.berat < 0.1) {
          Swal.fire('Error', `Berat pada baris ${i + 1} harus minimal 0.1 kg`, 'error');
          return;
        }
        // Validasi maksimal berat berdasarkan inventaris
        // SKIP validasi stok jika pesanan sudah Dikirim/Selesai (backend handle delta calculation)
        const barangMentah = barangMentahList.find(b => b.id_barangmentah === item.id_barang_mentah);
        if (barangMentah && item.berat > barangMentah.berat_mentah && 
            originalStatus !== 'Dikirim' && originalStatus !== 'Selesai') {
          Swal.fire('Error', `Berat pada baris ${i + 1} tidak boleh melebihi ${barangMentah.berat_mentah} kg (tersedia)`, 'error');
          return;
        }
      }
      // Validasi stok dan berat untuk produk
      if (item.jenis_barang === 'produk') {
        if (!item.stok || item.stok < 1) {
          Swal.fire('Error', `Stok pada baris ${i + 1} harus minimal 1 unit`, 'error');
          return;
        }
        if (!item.berat || item.berat < 0.1) {
          Swal.fire('Error', `Total berat pada baris ${i + 1} harus minimal 0.1 kg`, 'error');
          return;
        }
        // Validasi maksimal stok berdasarkan inventaris
        // SKIP validasi stok jika pesanan sudah Dikirim/Selesai (backend handle delta calculation)
        const produk = produkList.find(p => p.id_produk_detail === item.id_produk);
        if (produk && item.stok > produk.stok && 
            originalStatus !== 'Dikirim' && originalStatus !== 'Selesai') {
          Swal.fire('Error', `Stok pada baris ${i + 1} tidak boleh melebihi ${produk.stok} unit (tersedia)`, 'error');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Token tidak ditemukan', 'error');
        return;
      }

      // Clean data before sending - berat dalam kg
      const cleanedData = {
        ...formData,
        detail_barang: formData.detail_barang.map(item => {
          const cleanedItem: any = {
            jenis_barang: item.jenis_barang,
            catatan: item.catatan || ''
          };
          
          if (item.jenis_barang === 'barang_mentah') {
            cleanedItem.id_barang_mentah = item.id_barang_mentah;
            // Berat total dalam kg
            cleanedItem.berat = item.berat || 0;
          } else if (item.jenis_barang === 'produk') {
            cleanedItem.id_produk = item.id_produk;
            // Stok total dalam unit dan berat total dalam kg
            cleanedItem.stok = Math.round(item.stok || 0);
            cleanedItem.berat = item.berat || 0;
          }
          
          return cleanedItem;
        })
      };

      // Debug: Log data yang akan dikirim
      console.log('Data yang akan dikirim (Edit):', cleanedData);

      const response = await fetch(buildApiUrl(`pesanan/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Pesanan berhasil diupdate',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/apps/pesanan');
        });
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        
        // Handle stock errors dengan pesan yang lebih informatif
        if (errorData.message && errorData.message.includes('Stok tidak mencukupi')) {
          let errorDetails = errorData.message;
          
          // Jika ada details dari backend
          if (errorData.details && Array.isArray(errorData.details)) {
            errorDetails += '\n\nDetail:\n' + errorData.details.map((detail: any) => 
              `• ${detail.nama_barang}: Dibutuhkan ${detail.required} ${detail.unit}, Tersedia ${detail.available} ${detail.unit}`
            ).join('\n');
          }
          
          Swal.fire({
            title: 'Stok Tidak Mencukupi',
            html: `<div class="text-left"><pre class="whitespace-pre-wrap">${errorDetails}</pre></div>`,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire('Error', errorData.message || 'Gagal mengupdate pesanan', 'error');
        }
      }
    } catch (error) {
      console.error('Error updating pesanan:', error);
      Swal.fire('Error', 'Terjadi kesalahan saat mengupdate pesanan', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="panel">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-4 text-lg">Memuat data pesanan...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex xl:flex-row flex-col gap-2.5">
      <div className="panel px-0 flex-1 py-6 ltr:xl:mr-6 rtl:xl:ml-6">
        {/* Header */}
        <div className="flex justify-between flex-wrap px-4">
          <div className="mb-6 lg:w-1/2 w-full">
            <div className="flex items-center text-black dark:text-white shrink-0">
              <h2 className="text-xl font-semibold">Edit Pesanan</h2>
            </div>
          </div>
          <div className="lg:w-1/2 w-full lg:max-w-fit">
            <Link to="/apps/pesanan" className="btn btn-outline-primary">
              <IconArrowLeft className="ltr:mr-2 rtl:ml-2" />
              Kembali ke List
            </Link>
          </div>
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informasi Pesanan */}
          <div className="flex justify-between flex-wrap px-4 mb-8">
            <div className="mb-8 lg:w-1/2 w-full">
              <div className="flex items-center mt-4">
                <label htmlFor="pelanggan" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                  Pelanggan *
                </label>
                <select
                  id="pelanggan"
                  value={formData.id_pelanggan || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_pelanggan: e.target.value ? parseInt(e.target.value) : null }))}
                  className="form-select lg:w-[300px] w-2/3"
                  required
                >
                  <option value="">Pilih Pelanggan</option>
                  {pelangganList.map((pelanggan) => (
                    <option key={pelanggan.id_kontak} value={pelanggan.id_kontak}>
                      {pelanggan.nama} {pelanggan.no_telp && `(${pelanggan.no_telp})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center mt-4">
                <label htmlFor="status_pemesanan" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                  Status Pemesanan *
                </label>
                <select
                  id="status_pemesanan"
                  value={formData.status_pemesanan}
                  onChange={(e) => setFormData(prev => ({ ...prev, status_pemesanan: e.target.value as any }))}
                  className="form-select lg:w-[300px] w-2/3"
                >
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Dikirim">Dikirim</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>
              
              {/* Warning jika status Dikirim atau Selesai */}
              {(formData.status_pemesanan === 'Dikirim' || formData.status_pemesanan === 'Selesai') && 
               (originalStatus !== 'Dikirim' && originalStatus !== 'Selesai') && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning rounded-md">
                  <p className="text-sm text-warning flex items-center gap-2">
                    <Icon icon="mdi:alert-circle-outline" className="w-5 h-5" />
                    <span><strong>Perhatian:</strong> Status "{formData.status_pemesanan}" akan mengurangi stok inventaris secara otomatis.</span>
                  </p>
                </div>
              )}

              <div className="flex items-center mt-4">
                <label htmlFor="status_pembayaran" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                  Status Pembayaran *
                </label>
                <select
                  id="status_pembayaran"
                  value={formData.status_pembayaran}
                  onChange={(e) => setFormData(prev => ({ ...prev, status_pembayaran: e.target.value as any }))}
                  className="form-select lg:w-[300px] w-2/3"
                >
                  <option value="Belum Dibayar">Belum Dibayar</option>
                  <option value="DP">DP</option>
                  <option value="Sudah Dibayar">Sudah Dibayar</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>

              <div className="flex items-center mt-4">
                <label htmlFor="mode_pengiriman" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                  Mode Pengiriman *
                </label>
                <select
                  id="mode_pengiriman"
                  value={formData.mode_pengiriman}
                  onChange={(e) => setFormData(prev => ({ ...prev, mode_pengiriman: e.target.value as any }))}
                  className="form-select lg:w-[300px] w-2/3"
                >
                  <option value="Dijemput">Dijemput</option>
                  <option value="Dikirim">Dikirim</option>
                </select>
              </div>
            </div>

            <div className="lg:w-1/2 w-full lg:max-w-fit">
              <div className="flex items-center mt-4">
                <label htmlFor="tgl_pesanan" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                  Tanggal Pesanan *
                </label>
                <input
                  id="tgl_pesanan"
                  type="date"
                  className="form-input lg:w-[250px] w-2/3"
                  value={formData.tgl_pesanan}
                  onChange={(e) => setFormData(prev => ({ ...prev, tgl_pesanan: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8 px-4">
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Deskripsi</label>
              <textarea
                value={formData.deskripsi}
                onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                className="form-textarea"
                rows={3}
                placeholder="Catatan tambahan untuk pesanan..."
              />
            </div>
          </div>

          {/* Detail Barang */}
          <div className="mt-8 px-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detail Barang</h3>
            </div>

            {formData.detail_barang.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500">Belum ada barang yang ditambahkan. Klik tombol "Tambah Barang" untuk menambahkan.</p>
                <button
                  type="button"
                  onClick={addDetailBarang}
                  className="btn btn-primary mt-4"
                >
                  <IconPlus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  Tambah Barang Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.detail_barang.map((item, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 flex items-center justify-between">
                    <h6 className="font-medium">Barang #{index + 1}</h6>
                    <button
                      type="button"
                      onClick={() => removeDetailBarang(index)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Jenis Barang
                      </label>
                      <select
                        value={item.jenis_barang}
                        onChange={(e) => updateDetailBarang(index, 'jenis_barang', e.target.value)}
                        className="form-select"
                      >
                        <option value="barang_mentah">Bahan Baku</option>
                        <option value="produk">Produk Jadi</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {item.jenis_barang === 'barang_mentah' ? 'Barang Mentah' : 'Produk'}
                      </label>
                      <select
                        value={item.jenis_barang === 'barang_mentah' ? (item.id_barang_mentah || '') : (item.id_produk || '')}
                        onChange={(e) => updateDetailBarang(
                          index, 
                          item.jenis_barang === 'barang_mentah' ? 'id_barang_mentah' : 'id_produk', 
                          e.target.value ? parseInt(e.target.value) : undefined
                        )}
                        className="form-select"
                      >
                        <option value="">Pilih {item.jenis_barang === 'barang_mentah' ? 'Barang Mentah' : 'Produk'}</option>
                        {item.jenis_barang === 'barang_mentah' 
                          ? barangMentahList.map((barang) => (
                              <option key={barang.id_barangmentah} value={barang.id_barangmentah}>
                                {barang.namaBarangMentah?.nama_barang_mentah || barang.nama_barang_mentah} - {barang.kode} - {formatRupiah(barang.harga_jual)}
                              </option>
                            ))
                          : produkList.map((produk) => (
                              <option key={produk.id_produk_detail} value={produk.id_produk_detail}>
                                {produk.namaProduk?.nama_produk || produk.nama_produk} - {produk.kode} - {formatRupiah(produk.harga_jual)}
                              </option>
                            ))
                        }
                      </select>
                    </div>



                    {/* Input Berat untuk Barang Mentah */}
                    {item.jenis_barang === 'barang_mentah' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Berat (kg)
                          {item.id_barang_mentah && (() => {
                            const barangMentah = barangMentahList.find(b => b.id_barangmentah === item.id_barang_mentah);
                            return barangMentah ? (
                              <span className="text-xs text-gray-500 ml-2">
                                (Tersedia: {barangMentah.berat_mentah}kg)
                              </span>
                            ) : null;
                          })()}
                        </label>
                        <input
                          type="number"
                          value={item.berat || 0}
                          onChange={(e) => updateDetailBarang(index, 'berat', parseFloat(e.target.value) || 0)}
                          className="form-input"
                          min="0.1"
                          max={(() => {
                            // Jika pesanan sudah Dikirim/Selesai, tidak batasi max (backend handle delta)
                            if (originalStatus === 'Dikirim' || originalStatus === 'Selesai') {
                              return undefined;
                            }
                            const barangMentah = barangMentahList.find(b => b.id_barangmentah === item.id_barang_mentah);
                            return barangMentah ? barangMentah.berat_mentah : undefined;
                          })()}
                          step="0.1"
                          placeholder="Masukkan total berat keseluruhan dalam kg"
                        />
                        {item.id_barang_mentah && (() => {
                          const barangMentah = barangMentahList.find(b => b.id_barangmentah === item.id_barang_mentah);
                          // Tidak tampilkan error jika pesanan sudah Dikirim/Selesai (backend handle delta)
                          const shouldValidateStock = originalStatus !== 'Dikirim' && originalStatus !== 'Selesai';
                          return barangMentah && shouldValidateStock && (item.berat || 0) > barangMentah.berat_mentah ? (
                            <small className="text-red-500">
                              Berat tidak boleh melebihi {barangMentah.berat_mentah} kg
                            </small>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* Input Stok untuk Produk */}
                    {item.jenis_barang === 'produk' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Stok (pcs)
                          {item.id_produk && (() => {
                            const produk = produkList.find(p => p.id_produk_detail === item.id_produk);
                            return produk ? (
                              <span className="text-xs text-gray-500 ml-2">
                                (Tersedia: {produk.stok}pcs)
                              </span>
                            ) : null;
                          })()}
                        </label>
                        <input
                          type="number"
                          value={item.stok || 0}
                          onChange={(e) => updateDetailBarang(index, 'stok', parseInt(e.target.value) || 0)}
                          className="form-input"
                          min="1"
                          max={(() => {
                            // Jika pesanan sudah Dikirim/Selesai, tidak batasi max (backend handle delta)
                            if (originalStatus === 'Dikirim' || originalStatus === 'Selesai') {
                              return undefined;
                            }
                            const produk = produkList.find(p => p.id_produk_detail === item.id_produk);
                            return produk ? produk.stok : undefined;
                          })()}
                          step="1"
                          placeholder="Masukkan jumlah stok"
                        />
                        {item.id_produk && (() => {
                          const produk = produkList.find(p => p.id_produk_detail === item.id_produk);
                          // Tidak tampilkan error jika pesanan sudah Dikirim/Selesai (backend handle delta)
                          const shouldValidateStock = originalStatus !== 'Dikirim' && originalStatus !== 'Selesai';
                          return produk && shouldValidateStock && (item.stok || 0) > produk.stok ? (
                            <small className="text-red-500">
                              Stok tidak boleh melebihi {produk.stok}pcs
                            </small>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* Input Berat untuk Produk */}
                    {item.jenis_barang === 'produk' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Total Berat (kg)
                        </label>
                        <input
                          type="number"
                          value={item.berat || 0}
                          onChange={(e) => updateDetailBarang(index, 'berat', parseFloat(e.target.value) || 0)}
                          className="form-input"
                          min="0.1"
                          step="0.1"
                          placeholder="Masukkan total berat keseluruhan dalam kg"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Harga Satuan
                      </label>
                      <input
                        type="text"
                        value={item.harga_satuan ? formatRupiah(item.harga_satuan) : ''}
                        className="form-input"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subtotal
                      </label>
                      <input
                        type="text"
                        value={item.subtotal ? formatRupiah(item.subtotal) : ''}
                        className="form-input font-semibold"
                        readOnly
                      />
                    </div>

                    <div className="md:col-span-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Catatan
                      </label>
                      <input
                        type="text"
                        value={item.catatan || ''}
                        onChange={(e) => updateDetailBarang(index, 'catatan', e.target.value)}
                        className="form-input"
                        placeholder="Catatan untuk barang ini..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="mt-6 px-4">
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm mb-4" 
                  onClick={addDetailBarang}
                >
                  <IconPlus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  Tambah Barang
                </button>
              </div>

              <div className="mt-4 p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Total Pesanan:</h3>
                  <h3 className="text-xl font-bold text-primary">
                    {formatRupiah(calculateTotal())}
                  </h3>
                </div>
              </div>
            </div>
          )}
          </div>

          <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

          {/* Submit Buttons */}
          <div className="px-4 flex justify-end gap-3">
            <Link to="/apps/pesanan" className="btn btn-outline-danger">
              Batal
            </Link>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white ltr:mr-2 rtl:ml-2"></div>
                  Mengupdate...
                </>
              ) : (
                <>
                  <IconSave className="ltr:mr-2 rtl:ml-2" />
                  Update Pesanan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPesanan;