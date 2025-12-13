import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';
import IconEdit from '../../../components/Icon/IconEdit';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useAuth } from '../../../contexts/AuthContext';
import PengirimanService, { Pengiriman } from '../../../services/PengirimanService';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';

const PengirimanList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useAuth();
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);

  useEffect(() => {
    dispatch(setPageTitle('Daftar Pengiriman'));
  });

  const [pengiriman, setPengiriman] = useState<Pengiriman[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDriver, setFilterDriver] = useState<string>('');
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

  const fetchPengiriman = async (isSearching = false) => {
    try {
      if (isSearching) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      // Destroy DataTable before updating state
      destroyDataTable();

      const params: any = {
        page: 1,
        limit: 50 // Further reduced to 50 for optimal performance
      };

      if (filterStatus) params.status_pengiriman = filterStatus;
      if (filterDriver) params.driver_id = parseInt(filterDriver);

      // Jika user adalah driver, hanya tampilkan pengiriman miliknya
      let response;
      if (state.user?.role === 'driver') {
        response = await PengirimanService.getPengirimanByDriver(state.user.user_id, params);
      } else {
        response = await PengirimanService.getAllPengiriman(params);
      }

      setPengiriman(response.data.data);
    } catch (error: any) {
      console.error('Error fetching pengiriman:', error);
      Swal.fire('Error', error.message || 'Gagal memuat data pengiriman', 'error');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchPengiriman();
  }, [filterStatus, filterDriver]);

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
            searching: true,
            ordering: true,
            paging: true,
            info: true,
            autoWidth: false,
            retrieve: true,
            destroy: true,
            deferRender: true, // Render rows only when needed
            stateSave: false, // Disable state saving for better performance
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
                targets: state.user?.role !== 'driver' ? 5 : 4, // Status Pengiriman column
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
  }, [pengiriman, loading]);

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

  // Memoize formatting functions untuk performa
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  const isNewItem = useCallback((createdAt: string) => {
    const now = new Date();
    const itemDate = new Date(createdAt);
    const diffInHours = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24;
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'Dalam Perjalanan':
        return 'bg-info/20 text-info';
      case 'Selesai':
        return 'bg-success/20 text-success';
      case 'Gagal':
        return 'bg-danger/20 text-danger';
      default:
        return 'bg-gray-500/20 text-gray-600';
    }
  }, []);

  const handleDelete = async (item: Pengiriman) => {
    try {
      await PengirimanService.deletePengiriman(item.id);
      
      Swal.fire({
        title: 'Dihapus!',
        text: 'Pengiriman berhasil dihapus.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      fetchPengiriman();
    } catch (error: any) {
      console.error('Error deleting pengiriman:', error);
      Swal.fire({
        title: 'Gagal!',
        text: error.message || 'Gagal menghapus pengiriman.',
        icon: 'error'
      });
    }
  };

  const handleUpdateStatus = async (pengirimanItem: Pengiriman, newStatus: 'Dalam Perjalanan' | 'Selesai' | 'Gagal') => {
    const updateKey = `${pengirimanItem.id}-status`;
    
    try {
      setUpdatingStatus(prev => ({ ...prev, [updateKey]: true }));

      let catatan: string | undefined;
      
      // Konfirmasi jika status menjadi 'Dalam Perjalanan' (DIKIRIM - akan mengurangi stok)
      if (newStatus === 'Dalam Perjalanan' && pengirimanItem.status_pengiriman !== 'Dalam Perjalanan') {
        const confirmResult = await Swal.fire({
          title: 'Konfirmasi Pengiriman Barang',
          html: `
            <div style="text-align: left;">
              <p><strong>⚠️ Perhatian:</strong></p>
              <p>Menandai pengiriman sebagai <strong>"Dalam Perjalanan"</strong> akan:</p>
              <ul style="margin-left: 20px;">
                <li>🚚 Mengubah status pesanan menjadi <strong>"Dikirim"</strong></li>
                <li>📦 <strong>Mengurangi stok inventaris</strong> untuk barang dalam pesanan</li>
              </ul>
              <hr/>
              <p><strong>Detail Pesanan:</strong></p>
              <p>No. Pesanan: <strong>${pengirimanItem.pesanan?.no_pesanan || '-'}</strong></p>
              <p>Customer: <strong>${pengirimanItem.pesanan?.pelanggan?.nama || '-'}</strong></p>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ya, Kirim Barang',
          cancelButtonText: 'Batal',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
        });

        if (confirmResult.isDismissed) {
          setUpdatingStatus(prev => ({ ...prev, [updateKey]: false }));
          return;
        }
      }
      
      // Konfirmasi jika status menjadi 'Gagal' (akan mengembalikan stok)
      else if (newStatus === 'Gagal' && 
               (pengirimanItem.status_pengiriman === 'Dalam Perjalanan' || 
                pengirimanItem.status_pengiriman === 'Selesai')) {
        const confirmResult = await Swal.fire({
          title: 'Konfirmasi Pembatalan Pengiriman',
          html: `
            <div style="text-align: left;">
              <p><strong>⚠️ Perhatian:</strong></p>
              <p>Menandai pengiriman sebagai <strong>"Gagal"</strong> akan:</p>
              <ul style="margin-left: 20px;">
                <li>❌ Mengubah status pesanan kembali ke <strong>"Diproses"</strong></li>
                <li>🔄 <strong>Mengembalikan stok inventaris</strong> yang sudah dikurangi</li>
                <li>📝 Pesanan dapat dikirim ulang</li>
              </ul>
              <hr/>
              <p><strong>Detail Pesanan:</strong></p>
              <p>No. Pesanan: <strong>${pengirimanItem.pesanan?.no_pesanan || '-'}</strong></p>
              <p>Customer: <strong>${pengirimanItem.pesanan?.pelanggan?.nama || '-'}</strong></p>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ya, Batalkan Pengiriman',
          cancelButtonText: 'Kembali',
          confirmButtonColor: '#d33',
          cancelButtonColor: '#6c757d',
        });

        if (confirmResult.isDismissed) {
          setUpdatingStatus(prev => ({ ...prev, [updateKey]: false }));
          return;
        }
      }
      
      // Jika status gagal, minta alasan
      if (newStatus === 'Gagal') {
        const result = await Swal.fire({
          title: 'Alasan Kegagalan',
          input: 'textarea',
          inputLabel: 'Masukkan alasan kegagalan pengiriman',
          inputPlaceholder: 'Contoh: Alamat tidak ditemukan, pelanggan tidak ada...',
          showCancelButton: true,
          confirmButtonText: 'Update Status',
          cancelButtonText: 'Batal',
          inputValidator: (value) => {
            if (!value) {
              return 'Alasan kegagalan harus diisi!'
            }
            return null;
          }
        });

        if (result.isDismissed) {
          setUpdatingStatus(prev => ({ ...prev, [updateKey]: false }));
          return; // User cancelled
        }

        catatan = result.value;
      }

      await PengirimanService.updatePengiriman(pengirimanItem.id, {
        status_pengiriman: newStatus,
        catatan: catatan
      });
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Status pengiriman berhasil diupdate`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      
      fetchPengiriman();
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      // Tangkap error stok tidak cukup (biasanya terjadi saat status "Dalam Perjalanan")
      const errorMessage = error.message || error.response?.data?.message || 'Gagal mengupdate status pengiriman.';
      
      if (errorMessage.includes('Stok tidak mencukupi') || errorMessage.includes('Gagal mengurangi stok')) {
        Swal.fire({
          title: '📦 Stok Tidak Mencukupi!',
          html: `
            <div style="text-align: left;">
              <p><strong>Gagal mengirim barang:</strong></p>
              <p style="color: #d33; margin: 10px 0;">${errorMessage}</p>
              <hr/>
              <p><strong>Tindakan yang dapat dilakukan:</strong></p>
              <ul style="margin-left: 20px;">
                <li>✅ Periksa ketersediaan stok di halaman <strong>Inventaris</strong></li>
                <li>📞 Hubungi admin untuk penambahan stok</li>
                <li>❌ Atau batalkan pesanan yang stoknya tidak tersedia</li>
              </ul>
              <p style="margin-top: 10px;"><em>Status pengiriman tidak berubah dan stok tetap utuh.</em></p>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6'
        });
      } else {
        Swal.fire({
          title: 'Gagal!',
          text: errorMessage,
          icon: 'error'
        });
      }
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [updateKey]: false }));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Data Pengiriman</h2>
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
          <div className="flex gap-3">
            {/* Tombol tambah hanya untuk admin/karyawan */}
            {state.user?.role !== 'driver' && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/apps/pengiriman/add')}
                >
                  <Icon icon="solar:add-circle-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
                  Tambah Pengiriman
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => navigate('/apps/pengiriman/gaji-driver')}
                >
                  <Icon icon="solar:wallet-money-bold-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
                  Kelola Gaji Driver
                </button>
              </>
            )}
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
      <div className="mt-5 mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select"
          >
            <option value="">Semua Status Pengiriman</option>
            <option value="Dalam Perjalanan">Dalam Perjalanan</option>
            <option value="Selesai">Selesai</option>
            <option value="Gagal">Gagal</option>
          </select>
        </div>
        
        {/* Filter Driver hanya untuk admin/karyawan */}
        {state.user?.role !== 'driver' && (
          <div>
            <select
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className="form-select"
            >
              <option value="">Semua Driver</option>
              {/* Options will be populated from drivers list */}
            </select>
          </div>
        )}
      </div>

      <div className="mt-5 panel p-5 border-0">
        <div className="overflow-x-auto">
          <div className="datatables">
            <table ref={tableRef} id="pengirimanTable" className="table-striped table-hover" style={{width:'100%'}}>
            <thead>
              <tr>
                <th>No</th>
                <th>No. Pesanan</th>
                <th>Pelanggan</th>
                <th>Tanggal Pengiriman</th>
                {state.user?.role !== 'driver' && <th>Driver</th>}
                <th>Status Pengiriman</th>
                <th>Total Harga</th>
                <th>Gaji Driver</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && !searchLoading ? (
                <tr>
                  <td colSpan={state.user?.role !== 'driver' ? 9 : 8} className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : (
                pengiriman.map((item, index) => {
                  return (
                    <tr key={item.id}>
                      <td className="relative">
                        {index + 1}
                        {isNewItem(item.createdAt) && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                      </td>
                      <td>
                        <div className="font-medium">{item.pesanan.no_pesanan}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(item.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium">{item.pesanan.pelanggan.nama}</div>
                          {item.pesanan.pelanggan.no_telp && (
                            <div className="text-xs text-gray-500">{item.pesanan.pelanggan.no_telp}</div>
                          )}
                        </div>
                      </td>
                      <td>{formatDate(item.tanggal_pengiriman)}</td>
                      {state.user?.role !== 'driver' && (
                        <td>
                          <div className="font-medium">{item.driver.nama}</div>
                          <div className="text-xs text-gray-500">{item.driver.email}</div>
                        </td>
                      )}
                      <td>
                        <div className="relative">
                          <select
                            value={item.status_pengiriman}
                            onChange={(e) => handleUpdateStatus(item, e.target.value as any)}
                            disabled={updatingStatus[`${item.id}-status`] || item.status_pengiriman === 'Selesai'}
                            className={`form-select form-select-sm text-xs font-medium rounded-full px-2 py-1 ${getStatusBadge(item.status_pengiriman)} border-0 ${
                              updatingStatus[`${item.id}-status`] || item.status_pengiriman === 'Selesai' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Gagal">Gagal</option>
                          </select>
                          {updatingStatus[`${item.id}-status`] && (
                            <div className="absolute inset-y-0 right-2 flex items-center">
                              <Icon icon="material-symbols:sync" className="animate-spin text-xs" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{formatCurrency(item.pesanan.total_harga)}</div>
                      </td>
                      <td>
                        <div className="flex flex-col space-y-1">
                          <div className="font-medium text-primary">
                            {formatCurrency(item.gaji_driver)}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full text-center font-medium ${
                            item.gaji_dibayar 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.gaji_dibayar ? 'Sudah Dibayar' : 'Belum Dibayar'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="text-center">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Tippy content="Lihat Detail">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/apps/pengiriman/preview/${item.id}`)}
                            >
                              <Icon icon="solar:eye-bold" />
                            </button>
                          </Tippy>
                          {/* Edit dan Delete hanya untuk admin/karyawan dan jika masih dalam perjalanan */}
                          {state.user?.role !== 'driver' && item.status_pengiriman === 'Dalam Perjalanan' && (
                            <>
                              <Tippy content="Edit Pengiriman">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => navigate(`/apps/pengiriman/edit/${item.id}`)}
                                >
                                  <Icon icon="solar:pen-bold" />
                                </button>
                              </Tippy>
                              <Tippy content="Hapus Pengiriman">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'Hapus Pengiriman?',
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PengirimanList;