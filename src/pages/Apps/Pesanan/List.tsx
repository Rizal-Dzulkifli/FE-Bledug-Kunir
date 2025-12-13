import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';
import IconEdit from '../../../components/Icon/IconEdit';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
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
  namaProduk?: {
    id_produk: number;
    nama_produk: string;
    kode_produk: string;
  };
}

interface DetailPesanan {
  id_detail_pesanan: number;
  jenis_barang: 'barang_mentah' | 'produk';
  id_barang_mentah?: number;
  id_produk?: number;
  kuantitas: number;
  harga_satuan: number;
  subtotal: number;
  catatan?: string;
  barangMentah?: BarangMentah;
  produk?: Produk;
}

interface PesananItem {
  id_pesanan: number;
  id_pelanggan: number;
  no_pesanan: string;
  tgl_pesanan: string;
  total_harga: number;
  status_pemesanan: 'Menunggu' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan';
  status_pembayaran: 'Belum Dibayar' | 'Sudah Dibayar' | 'DP' | 'Lunas';
  mode_pengiriman: 'Dijemput' | 'Dikirim';
  deskripsi: string | null;
  pelanggan: Pelanggan;
  detailPesanan: DetailPesanan[];
  created_at: string;
  updated_at: string;
}

const PesananList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);

  useEffect(() => {
    dispatch(setPageTitle('Daftar Pesanan'));
  });

  const [pesanans, setPesanans] = useState<PesananItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStatusPembayaran, setFilterStatusPembayaran] = useState<string>('');
  const [filterModePengiriman, setFilterModePengiriman] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: string]: boolean }>({});

  // Helper function to safely destroy DataTable
  const destroyDataTable = () => {
    if (dataTableRef.current) {
      try {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      } catch (e) {
        console.log('Error destroying DataTable:', e);
      }
    }
  };

  const fetchPesanans = async (isSearching = false) => {
    try {
      if (isSearching) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      // Destroy DataTable before updating state
      destroyDataTable();

      const params = new URLSearchParams({
        page: '1',
        limit: '1000',
      });

      if (filterStatus) params.append('status_pemesanan', filterStatus);
      if (filterStatusPembayaran) params.append('status_pembayaran', filterStatusPembayaran);
      if (filterModePengiriman) params.append('mode_pengiriman', filterModePengiriman);
      if (search) params.append('search', search);

      console.log('=== FRONTEND: fetchPesanans() START ===')
      console.log('Parameters:', { search, isSearching, filterStatus, filterStatusPembayaran, filterModePengiriman })
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No auth token found')
        return;
      }
      console.log('✅ Auth token found')

      const url = buildApiUrl(`pesanan?${params.toString()}`);
      console.log('📤 Fetching URL:', url)
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      console.log('📥 Response status:', response.status)
      console.log('📥 Response status text:', response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Response error body:', errorText)
        throw new Error(`Failed to fetch pesanan: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 Response data:', result)
      
      // Handle both direct data and paginated data structure
      if (result.data && result.data.data) {
        // Paginated response structure
        setPesanans(result.data.data || []);
      } else {
        // Direct array response
        setPesanans(result.data || []);
      }
      console.log('✅ Data set successfully. Records:', pesanans.length)
    } catch (error) {
      console.log('💥 Frontend error:', error)
      setPesanans([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
      console.log('=== FRONTEND: fetchPesanans() END ===')
    }
  };

  useEffect(() => {
    fetchPesanans();
  }, [filterStatus, filterStatusPembayaran, filterModePengiriman]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search.length > 0 || search.length === 0) {
        fetchPesanans(true);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Initialize DataTable
  useEffect(() => {
    // Jika masih loading, jangan inisialisasi
    if (loading) return;

    // Destroy existing DataTable jika ada
    destroyDataTable();

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (tableRef.current && !dataTableRef.current) {
        try {
          dataTableRef.current = new DataTable(tableRef.current, {
            pageLength: 10,
            lengthMenu: [10, 25],
            deferRender: true,
            stateSave: false,
            searching: true,
            ordering: true,
            paging: true,
            info: true,
            autoWidth: false,
            retrieve: true,
            destroy: true,
            order: [[1, 'desc']], // Sort by No. Pesanan descending
            language: {
              lengthMenu: 'Tampilkan _MENU_ data per halaman',
              zeroRecords: 'Data tidak ditemukan',
              info: 'Menampilkan halaman _PAGE_ dari _PAGES_',
              infoEmpty: 'Tidak ada data',
              infoFiltered: '(difilter dari _MAX_ total data)',
              paginate: {
                first: '<iconify-icon icon="mdi:chevron-double-left" style="font-size: 1.25rem;"></iconify-icon>',
                last: '<iconify-icon icon="mdi:chevron-double-right" style="font-size: 1.25rem;"></iconify-icon>',
                next: '<iconify-icon icon="mdi:chevron-right" style="font-size: 1.25rem;"></iconify-icon>',
                previous: '<iconify-icon icon="mdi:chevron-left" style="font-size: 1.25rem;"></iconify-icon>',
              },
              emptyTable: 'Tidak ada data tersedia'
            },
            dom: '<"flex justify-between items-center mb-4"l>rt<"flex justify-between items-center mt-4"ip>',
            columnDefs: [
              {
                targets: -1, // Last column (Aksi)
                orderable: false,
              },
              {
                targets: 4, // Status Pemesanan column
                orderable: false,
              },
              {
                targets: 5, // Status Pembayaran column
                orderable: false,
              },
            ],
          });
        } catch (error) {
          console.error('Error initializing DataTable:', error);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pesanans, loading]);

  // Custom search handler
  useEffect(() => {
    if (dataTableRef.current) {
      setSearchLoading(true);
      const timeoutId = setTimeout(() => {
        dataTableRef.current?.search(search).draw();
        setSearchLoading(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [search]);

  const handleDelete = async (pesanan: PesananItem) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Pesanan "${pesanan.no_pesanan}" akan dihapus permanen!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(buildApiUrl(`pesanan/${pesanan.id_pesanan}`), {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          Swal.fire({
            title: 'Dihapus!',
            text: 'Pesanan berhasil dihapus.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          fetchPesanans();
        } else {
          const errorData = await response.json();
          Swal.fire({
            title: 'Gagal!',
            text: errorData.message || 'Gagal menghapus pesanan.',
            icon: 'error'
          });
        }
      } catch (error) {
        console.error('Error deleting pesanan:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Terjadi kesalahan saat menghapus pesanan.',
          icon: 'error'
        });
      }
    }
  };

  const handleUpdateStatus = async (pesanan: PesananItem, type: 'pemesanan' | 'pembayaran', newStatus: string) => {
    const updateKey = `${pesanan.id_pesanan}-${type}`;
    const oldStatus = type === 'pemesanan' ? pesanan.status_pemesanan : pesanan.status_pembayaran;
    
    // Jika mengubah status pemesanan ke 'Dikirim' atau 'Selesai', tampilkan konfirmasi
    if (type === 'pemesanan' && (newStatus === 'Dikirim' || newStatus === 'Selesai') && 
        (oldStatus !== 'Dikirim' && oldStatus !== 'Selesai')) {
      
      // Buat ringkasan barang
      const itemsSummary = pesanan.detailPesanan.map(detail => {
        if (detail.jenis_barang === 'barang_mentah') {
          const nama = detail.barangMentah?.namaBarangMentah?.nama_barang_mentah || 'Barang Mentah';
          return `• ${nama}: ${detail.kuantitas} kg`;
        } else {
          const nama = detail.produk?.namaProduk?.nama_produk || 'Produk';
          return `• ${nama}: ${detail.kuantitas} pcs`;
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
        return; // User cancelled
      }
    }
    
    // Jika mengubah status dari 'Dikirim'/'Selesai' ke status lain, tampilkan info
    else if (type === 'pemesanan' && (oldStatus === 'Dikirim' || oldStatus === 'Selesai') && 
             (newStatus !== 'Dikirim' && newStatus !== 'Selesai')) {
      const result = await Swal.fire({
        title: 'Konfirmasi Perubahan Status',
        html: `
          <div class="text-left">
            <p class="mb-3">Mengubah status dari <strong>"${oldStatus}"</strong> ke <strong>"${newStatus}"</strong> akan <strong>mengembalikan stok inventaris</strong>.</p>
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
        return; // User cancelled
      }
    }
    
    try {
      // Set loading state
      setUpdatingStatus(prev => ({ ...prev, [updateKey]: true }));

      console.log('=== STATUS UPDATE START ===');
      console.log('Pesanan ID:', pesanan.id_pesanan);
      console.log('Type:', type);
      console.log('Old Status:', oldStatus);
      console.log('New Status:', newStatus);

      const payload: any = {};
      if (type === 'pemesanan') {
        payload.status_pemesanan = newStatus;
      } else {
        payload.status_pembayaran = newStatus;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const url = buildApiUrl(`pesanan/${pesanan.id_pesanan}/status`);
      console.log('API URL:', url);
      console.log('Payload:', payload);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Update response:', result);
        
        // Show success toast
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Status ${type === 'pemesanan' ? 'pemesanan' : 'pembayaran'} berhasil diupdate`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        
        // Refresh data
        fetchPesanans();
      } else {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: 'Gagal mengupdate status' };
        }

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
          Swal.fire({
            title: 'Gagal!',
            text: errorData.message || 'Gagal mengupdate status.',
            icon: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupdate status.',
        icon: 'error'
      });
    } finally {
      // Clear loading state
      setUpdatingStatus(prev => ({ ...prev, [updateKey]: false }));
      console.log('=== STATUS UPDATE END ===');
    }
  };





  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Menunggu': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Diproses': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 
      'Dikirim': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Selesai': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Dibatalkan': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Belum Dibayar': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'DP': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Sudah Dibayar': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Lunas': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Dijemput': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };
    return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const isNewItem = (created_at: string): boolean => {
    const now = new Date();
    const itemTime = new Date(created_at);
    const diffInHours = Math.abs(now.getTime() - itemTime.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 12;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Data Pesanan</h2>
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/apps/pesanan/add')}
            >
              <Icon icon="solar:add-circle-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
              Tambah Pesanan
            </button>
            <div className="relative">
              <input
                type="text"
                className="form-input w-full sm:w-auto"
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="button" className={`absolute ltr:right-1 rtl:left-1 inset-y-1 m-auto rounded-full w-9 h-9 p-0 flex items-center justify-center ${searchLoading ? 'animate-spin' : ''}`}>
                <Icon icon={searchLoading ? "material-symbols:sync" : "material-symbols:search"} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mt-5 mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select"
          >
            <option value="">Semua Status Pemesanan</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Diproses">Diproses</option>
            <option value="Dikirim">Dikirim</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
        
        <div>
          <select
            value={filterStatusPembayaran}
            onChange={(e) => setFilterStatusPembayaran(e.target.value)}
            className="form-select"
          >
            <option value="">Semua Status Pembayaran</option>
            <option value="Belum Dibayar">Belum Dibayar</option>
            <option value="DP">DP</option>
            <option value="Sudah Dibayar">Sudah Dibayar</option>
            <option value="Lunas">Lunas</option>
          </select>
        </div>

        <div>
          <select
            value={filterModePengiriman}
            onChange={(e) => setFilterModePengiriman(e.target.value)}
            className="form-select"
          >
            <option value="">Semua Mode Pengiriman</option>
            <option value="Dijemput">Dijemput</option>
            <option value="Dikirim">Dikirim</option>
          </select>
        </div>
      </div>

      <div className="mt-5 panel p-5 border-0">
        {loading ? (
          <div className="text-center py-4">
            <Icon icon="eos-icons:loading" className="text-primary mx-auto" width="2rem" />
            <p className="mt-2 text-gray-500">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="datatables">
              <table ref={tableRef} id="pesananTable" className="table-striped table-hover" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>No. Pesanan</th>
                  <th>Pelanggan</th>
                  <th>Tanggal Pesanan</th>
                  <th>Status Pemesanan</th>
                  <th>Status Pembayaran</th>
                  <th>Total Harga</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pesanans.map((item, index) => (
                  <tr key={item.id_pesanan}>
                    <td className="relative">
                      {index + 1}
                      {isNewItem(item.created_at) && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </td>
                    <td>
                      <div className="font-medium">{item.no_pesanan}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">{item.pelanggan?.nama}</div>
                        {item.pelanggan?.no_telp && (
                          <div className="text-xs text-gray-500">{item.pelanggan.no_telp}</div>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(item.tgl_pesanan)}</td>
                    <td>
                        <div className="relative">
                          <select
                            value={item.status_pemesanan}
                            onChange={(e) => handleUpdateStatus(item, 'pemesanan', e.target.value)}
                            disabled={updatingStatus[`${item.id_pesanan}-pemesanan`]}
                            className={`form-select form-select-sm text-xs font-medium rounded-full px-2 py-1 ${getStatusBadge(item.status_pemesanan)} border-0 ${
                              updatingStatus[`${item.id_pesanan}-pemesanan`] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="Menunggu">Menunggu</option>
                            <option value="Diproses">Diproses</option>
                            <option value="Dikirim">Dikirim</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                          </select>
                          {updatingStatus[`${item.id_pesanan}-pemesanan`] && (
                            <div className="absolute inset-y-0 right-2 flex items-center">
                              <Icon icon="material-symbols:sync" className="animate-spin text-xs" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="relative">
                          <select
                            value={item.status_pembayaran}
                            onChange={(e) => handleUpdateStatus(item, 'pembayaran', e.target.value)}
                            disabled={updatingStatus[`${item.id_pesanan}-pembayaran`]}
                            className={`form-select form-select-sm text-xs font-medium rounded-full px-2 py-1 ${getStatusBadge(item.status_pembayaran)} border-0 ${
                              updatingStatus[`${item.id_pesanan}-pembayaran`] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="Belum Dibayar">Belum Dibayar</option>
                            <option value="DP">DP</option>
                            <option value="Sudah Dibayar">Sudah Dibayar</option>
                            <option value="Lunas">Lunas</option>
                          </select>
                          {updatingStatus[`${item.id_pesanan}-pembayaran`] && (
                            <div className="absolute inset-y-0 right-2 flex items-center">
                              <Icon icon="material-symbols:sync" className="animate-spin text-xs" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{formatCurrency(item.total_harga)}</div>
                      </td>
                      
                      <td className="text-center">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Tippy content="Lihat Detail">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/apps/pesanan/preview/${item.id_pesanan}`)}
                            >
                              <Icon icon="solar:eye-bold" />
                            </button>
                          </Tippy>
                          <Tippy content="Edit Pesanan">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => navigate(`/apps/pesanan/edit/${item.id_pesanan}`)}
                            >
                              <Icon icon="solar:pen-bold" />
                            </button>
                          </Tippy>
                          <Tippy content="Hapus Pesanan">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                Swal.fire({
                                  title: 'Hapus Pesanan?',
                                  text: 'Data yang dihapus tidak dapat dikembalikan!',
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonText: 'Ya, Hapus!',
                                  cancelButtonText: 'Batal'
                                }).then((result) => {
                                  if (result.isConfirmed) {
                                    handleDelete(item);
                                  }
                                });
                              }}
                            >
                              <Icon icon="solar:trash-bin-trash-bold" />
                            </button>
                          </Tippy>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PesananList;