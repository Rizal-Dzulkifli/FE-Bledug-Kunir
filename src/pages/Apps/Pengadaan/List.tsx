import React, { useState, useEffect, Fragment, useRef } from 'react';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../../components/Icon/IconX';
import IconEye from '../../../components/Icon/IconEye';
import IconEdit from '../../../components/Icon/IconEdit';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import PengadaanBarangMentahService, { BeratTersedia } from '../../../services/PengadaanBarangMentahService';
import KetersediaanWidget from '../../../components/Widgets/KetersediaanWidget';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';

interface Supplier {
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

interface DetailPengadaan {
  id_dpemesananb: number;
  id_barangmentah: number;
  berat: number;
  barangMentah: BarangMentah;
}

interface PengadaanItem {
  id_pemesanan: number;
  id_kontak: number;
  no_pemesanan: string;
  tgl_transaksi: string;
  total_harga: number;
  status: 'selesai' | 'belum di bayar' | 'dibatalkan' | 'proses';
  deskripsi: string | null;
  kontak: Supplier;
  detailPengadaan: DetailPengadaan[];
  created_at: string;
  updated_at: string;
}

interface PengadaanFormState {
  id: number | null;
  id_kontak: number | null;
  tgl_transaksi: string;
  status: 'selesai' | 'belum di bayar' | 'dibatalkan' | 'proses';
  deskripsi: string;
  detail_barang: {
    id_barangmentah: number;
    berat: number;
  }[];
}

const PengadaanList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setPageTitle('Daftar Pengadaan Barang Mentah'));
  });

  const [pengadaans, setPengadaans] = useState<PengadaanItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [barangMentahList, setBarangMentahList] = useState<BarangMentah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState('');
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);
  const [addPengadaanModal, setAddPengadaanModal] = useState(false);
  const [editPengadaanModal, setEditPengadaanModal] = useState(false);
  const [selectedPengadaan, setSelectedPengadaan] = useState<PengadaanItem | null>(null);
  // 🆕 New states for ketersediaan features
  const [showKetersediaanWidget, setShowKetersediaanWidget] = useState(true);
  const [ketersediaanData, setKetersediaanData] = useState<BeratTersedia[]>([]);
  const [showKetersediaanModal, setShowKetersediaanModal] = useState(false);
  const [pengadaanParams, setPengadaanParams] = useState<PengadaanFormState>({
    id: null,
    id_kontak: null,
    tgl_transaksi: new Date().toISOString().split('T')[0],
    status: 'proses',
    deskripsi: '',
    detail_barang: [],
  });

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

  const fetchPengadaans = async (isSearching = false) => {
    try {
      console.log('=== FRONTEND: fetchPengadaans() START ===')
      console.log('Parameters:', { search, isSearching })
      
      if (isSearching) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      // Destroy DataTable before updating state
      destroyDataTable();
      
      const result = await PengadaanBarangMentahService.getPengadaans(1, 1000, search);
      console.log('📥 Response data:', result)
      
      setPengadaans(result.data.data as any || []);
      console.log('✅ Data set successfully. Records:', result.data.data?.length || 0)
      console.log('=== FRONTEND: fetchPengadaans() END ===')
    } catch (error) {
      console.log('💥 Frontend error:', error)
      
      // 🔧 Enhanced error messages untuk user
      let errorMessage = 'Terjadi kesalahan saat mengambil data pengadaan';
      
      if (error instanceof Error) {
        if (error.message.includes('Database service is currently unavailable')) {
          errorMessage = 'Database sedang tidak tersedia. Mohon coba lagi dalam beberapa saat.';
        } else if (error.message.includes('Unable to connect to server')) {
          errorMessage = 'Tidak dapat terhubung ke server. Pastikan backend berjalan.';
        } else if (error.message.includes('Request timeout')) {
          errorMessage = 'Koneksi timeout. Mohon coba lagi.';
        }
      }
      
      Swal.fire({
        title: 'Koneksi Bermasalah',
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'Coba Lagi',
        showCancelButton: true,
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          // Retry fetch
          fetchPengadaans();
        }
      });
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const result = await PengadaanBarangMentahService.getSuppliers();
      setSuppliers(result.data as any || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchBarangMentah = async () => {
    try {
      const result = await PengadaanBarangMentahService.getBarangMentah();
      setBarangMentahList(result.data as any || []);
    } catch (error) {
      console.error('Error fetching barang mentah:', error);
    }
  };

  // 🆕 Fetch ketersediaan berat data
  const fetchKetersediaan = async () => {
    try {
      console.log('🔄 Frontend: Fetching ketersediaan data...');
      const result = await PengadaanBarangMentahService.getKetersediaanBerat();
      console.log('📊 Ketersediaan data received:', result.data);
      setKetersediaanData(result.data);
    } catch (error) {
      console.error('❌ Error fetching ketersediaan:', error);
      Swal.fire({
        title: 'Error',
        text: 'Gagal mengambil data ketersediaan barang mentah',
        icon: 'error'
      });
    }
  };

  // 🆕 Refresh all data including ketersediaan
  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPengadaans(),
        fetchKetersediaan()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPengadaan = (pengadaan: PengadaanItem) => {
    setSelectedPengadaan(pengadaan);
    setPengadaanParams({
      id: pengadaan.id_pemesanan,
      id_kontak: pengadaan.id_kontak,
      tgl_transaksi: pengadaan.tgl_transaksi,
      status: pengadaan.status,
      deskripsi: pengadaan.deskripsi || '',
      detail_barang: pengadaan.detailPengadaan.map(detail => ({
        id_barangmentah: detail.id_barangmentah,
        berat: detail.berat
      }))
    });
    setEditPengadaanModal(true);
  };

  const handleDeletePengadaan = async (id: number) => {
    try {
      // Destroy DataTable before deleting to prevent DOM conflicts
      destroyDataTable();
      
      await PengadaanBarangMentahService.deletePengadaan(id);
      Swal.fire('Berhasil', 'Pengadaan berhasil dihapus', 'success');
      // 🔄 Refresh semua data termasuk ketersediaan setelah delete
      await refreshAllData();
    } catch (error: any) {
      console.error('Error deleting pengadaan:', error);
      Swal.fire('Error', error.message || 'Terjadi kesalahan saat menghapus pengadaan', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    const cleanValue = amount % 1 === 0 ? Math.floor(amount) : amount;
    return `Rp ${cleanValue.toLocaleString('id-ID')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'selesai': 'badge-outline-success',
      'belum di bayar': 'badge-outline-warning', 
      'proses': 'badge-outline-primary',
      'dibatalkan': 'badge-outline-danger'
    };
    return statusMap[status as keyof typeof statusMap] || 'badge-outline-secondary';
  };

  const getStatusText = (status: string) => {
    const statusTextMap = {
      'selesai': 'Selesai',
      'belum di bayar': 'Belum Bayar', 
      'proses': 'Dalam Proses',
      'dibatalkan': 'Dibatalkan'
    };
    return statusTextMap[status as keyof typeof statusTextMap] || status;
  };

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
            order: [[1, 'desc']], // Sort by No. Pemesanan descending
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
            ],
          });
        } catch (error) {
          console.error('Error initializing DataTable:', error);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pengadaans, loading]);

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

  // Effect untuk fetch data saat component mount
  useEffect(() => {
    fetchPengadaans();
    fetchSuppliers();
    fetchBarangMentah();
    fetchKetersediaan(); // 🆕 Load ketersediaan data
  }, []);

  // 🆕 Auto refresh ketersediaan data setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto refreshing ketersediaan data...');
      fetchKetersediaan();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Format currency ke Rupiah
  
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Data Pengadaan Barang Mentah</h2>
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/apps/pengadaan/add')}
            >
              <Icon icon="solar:add-circle-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
              Tambah Pengadaan
            </button>
            {/* <button
              type="button"
              className="btn btn-info"
              onClick={() => {
                refreshAllData();
                Swal.fire('Berhasil', 'Data berhasil direfresh', 'success');
              }}
            >
              <Icon icon="heroicons:arrow-path" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
              Refresh Data
            </button> */}
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
      {/* <div className="xl:col-span-1 mt-4">
            <KetersediaanWidget 
              onDetailClick={() => setShowKetersediaanModal(true)}
            />
          </div> */}

      {/* 🆕 Ketersediaan Widget */}
      {showKetersediaanWidget && (
        
        <div className="mt-5 grid xl:grid-cols- gap-6">
         
          <div className="xl:col-span-2">
            {/* 🚨 Alert untuk barang kritis dengan styling enhanced */}
            {ketersediaanData.filter(item => item.berat_tersedia <= 10).length > 0 && (
              <div className="alert alert-warning-light mb-4 border-l-4 border-warning">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon icon="heroicons:exclamation-triangle" className="w-6 h-6 text-warning animate-pulse" />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-warning">
                        Peringatan Stok Menipis!
                      </p>
                      <p className="text-sm text-gray-600">
                        {ketersediaanData.filter(item => item.berat_tersedia <= 10).length} barang mentah dengan stok menipis (≤10kg)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowKetersediaanModal(true)}
                    className="btn btn-sm btn-outline-warning"
                  >
                    <Icon icon="heroicons:eye" className="w-4 h-4 mr-1" />
                    Lihat Detail
                  </button>
                </div>
              </div>
            )}
            
            {/* Widget ringkasan pengadaan */}
            <div className="panel h-full">
              <h5 className="font-semibold text-lg mb-4">Ringkasan Pengadaan</h5>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-primary-light/10 rounded-lg p-4">
                  <div className="flex items-center">
                    <Icon icon="heroicons:document-text" className="w-8 h-8 text-primary mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-primary">{pengadaans.length}</div>
                      <div className="text-sm text-gray-600">Total Pengadaan</div>
                    </div>
                  </div>
                </div>
                <div className="bg-success-light/10 rounded-lg p-4">
                  <div className="flex items-center">
                    <Icon icon="heroicons:check-circle" className="w-8 h-8 text-success mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-success">
                        {pengadaans.filter(p => p.status === 'selesai').length}
                      </div>
                      <div className="text-sm text-gray-600">Selesai</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 panel p-5 border-0">
        {loading ? (
          <div className="text-center py-4">
            <Icon icon="eos-icons:loading" className="text-primary mx-auto" width="2rem" />
            <p className="mt-2 text-gray-500">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="datatables">
              <table ref={tableRef} id="pengadaanTable" className="table-striped table-hover" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>No. Pemesanan</th>
                  <th>Supplier</th>
                  <th>Tanggal Transaksi</th>
                  <th>Status</th>
                  <th>Total Harga</th>
                  <th>Items</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pengadaans.map((item, index) => (
                  <tr key={item.id_pemesanan}>
                    <td>{index + 1}</td>
                    <td>{item.no_pemesanan}</td>
                    <td>{item.kontak?.nama || '-'}</td>
                    <td>{formatDate(item.tgl_transaksi)}</td>
                    <td>{getStatusText(item.status)}</td>
                    <td>{formatCurrency(item.total_harga)}</td>
                    <td>{item.detailPengadaan?.length || 0} items</td>
                    <td className="text-center">
                      <div className="flex gap-2 justify-center flex-wrap">
                        <Tippy content="Lihat Detail">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/apps/pengadaan/preview/${item.id_pemesanan}`)}
                          >
                            Detail
                          </button>
                        </Tippy>
                        <Tippy content="Edit Pengadaan">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => navigate(`/apps/pengadaan/edit/${item.id_pemesanan}`)}
                          >
                            Edit
                          </button>
                        </Tippy>
                        <Tippy content="Hapus Pengadaan">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              Swal.fire({
                                title: 'Hapus Pengadaan?',
                                text: 'Data yang dihapus tidak dapat dikembalikan!',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Ya, Hapus!',
                                cancelButtonText: 'Batal'
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  handleDeletePengadaan(item.id_pemesanan);
                                }
                              });
                            }}
                          >
                            Hapus
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

      {/* 🆕 Modal Detail Ketersediaan */}
      <Transition appear show={showKetersediaanModal} as={Fragment}>

      <Dialog as="div" open={showKetersediaanModal} onClose={() => setShowKetersediaanModal(false)} className="relative z-[51]">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[black]/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-5xl text-black dark:text-white-dark">
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">Detail Ketersediaan Barang Mentah</div>
                  <button
                    onClick={() => setShowKetersediaanModal(false)}
                    type="button"
                    className="text-white-dark hover:text-dark"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="table-responsive">
                    <table className="table-hover">
                      <thead>
                        <tr>
                          <th>Kode</th>
                          <th>Nama Barang</th>
                          <th>Berat Masuk</th>
                          <th>Berat Terpakai</th>
                          <th>Berat Tersedia</th>
                          <th>Status</th>
                          <th>Nilai Stok</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ketersediaanData.map((item) => {
                          const status = item.berat_tersedia <= 0 ? 'habis' : 
                                       item.berat_tersedia <= 5 ? 'kritis' : 
                                       item.berat_tersedia <= 10 ? 'peringatan' : 'aman';
                          const statusColor = PengadaanBarangMentahService.getKetersediaanStatusColor(status);
                          
                          return (
                            <tr key={item.id_barangmentah}>
                              <td>{item.kode}</td>
                              <td className="font-medium">{item.nama_barang}</td>
                              <td>{PengadaanBarangMentahService.formatWeight(item.total_berat_masuk)}</td>
                              <td>{PengadaanBarangMentahService.formatWeight(item.total_berat_terpakai)}</td>
                              <td className="font-bold">
                                {PengadaanBarangMentahService.formatWeight(item.berat_tersedia)}
                              </td>
                              <td>
                                <span className={`badge ${statusColor}`}>
                                  {status.toUpperCase()}
                                </span>
                              </td>
                              <td>{PengadaanBarangMentahService.formatCurrency(item.berat_tersedia * item.harga_beli_rata)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-end items-center mt-8 gap-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => {
                        fetchKetersediaan();
                        Swal.fire('Berhasil', 'Data ketersediaan berhasil direfresh', 'success');
                      }}
                    >
                      <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
                      Refresh Data
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => setShowKetersediaanModal(false)}
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default PengadaanList;