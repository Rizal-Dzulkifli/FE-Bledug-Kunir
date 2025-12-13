import React, { useState, useEffect, Fragment, useRef } from 'react';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { NavLink, useNavigate } from 'react-router-dom';
import KetersediaanWidget from '../../components/Widgets/KetersediaanWidget';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './datatables-custom.css';
import { buildApiUrl, getAuthHeaders } from '../../config/api';


// CSS untuk animasi blinking dot
const blinkingDotStyle = {
  animation: 'blink 1.5s infinite',
};

// Tambahkan keyframes ke style global (atau bisa gunakan Tailwind animate-pulse)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

interface BarangMentahItem {
  id_barangmentah: number;
  id_bm: number;
  kode: string;
  berat_mentah: number;
  harga_beli: number;
  harga_jual: number;
  created_at: string;
  updated_at: string;
  namaBarangMentah?: {
    id_bm: number;
    nama_barang_mentah: string;
    kode_barang: string;
  };
}

interface BarangMentahFormState {
  id: number | null;
  id_bm: number | null;
  berat_mentah: number;
  harga_beli: number;
  harga_jual: number;
}

interface ParamsState {
  id: number | null;
  barang_id: number | null;
  jumlah: number;
  jurusan_id: number | null;
  keterangan: string;
  harga: number;
  asal_barang: string;
}

const InventarisBarang = () => {
  const [barangMentahs, setBarangMentahs] = useState<BarangMentahItem[]>([]);
  const [namaBarangMentahs, setNamaBarangMentahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [addBarangMentahModal, setAddBarangMentahModal] = useState(false);
  const [namaBarangMentahList, setNamaBarangMentahList] = useState<any[]>([]);
  const [barangMentahParams, setBarangMentahParams] = useState<BarangMentahFormState>({
    id: null,
    id_bm: null,
    berat_mentah: 0,
    harga_beli: 0,
    harga_jual: 0,
  });
  const [editBarangMentahModal, setEditBarangMentahModal] = useState(false);
  const [selectedBarangMentah, setSelectedBarangMentah] = useState<any>(null);
  const navigate = useNavigate();
  const [addInventarisModal, setAddInventarisModal] = useState(false);
  const [showKetersediaanModal, setShowKetersediaanModal] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);

  const [params, setParams] = useState<ParamsState>({
    id: null,
    barang_id: null,
    jumlah: 0,
    jurusan_id: null,
    keterangan: '',
    harga: 0,
    asal_barang: '',
  });

  const fetchBarangMentahs = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token is missing', 'error');
        return;
      }

      // Fetch all data untuk DataTables client-side processing
      const url = buildApiUrl('barang-mentah?page=1&limit=1000');
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch barang mentah');
      }

      const result = await response.json();
      setBarangMentahs(result.data.data || []);
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat mengambil data barang mentah', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNamaBarangMentah = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch(buildApiUrl('nama-barang-mentah'), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nama barang mentah');
      }

      const result = await response.json();
      setNamaBarangMentahList(result.data || []);
    } catch (error) {
      console.error('Error fetching nama barang mentah:', error);
    }
  };

  const saveBarangMentah = async () => {
    try {
      console.log('=== FRONTEND: saveBarangMentah() START ===')
      console.log('Form data:', barangMentahParams)
      
      if (!barangMentahParams.id_bm || barangMentahParams.berat_mentah <= 0 || barangMentahParams.harga_beli <= 0 || barangMentahParams.harga_jual <= 0) {
        console.log('❌ Frontend validation failed')
        Swal.fire('Error', 'Semua field harus diisi dengan benar', 'error');
        return;
      }
      console.log('✅ Frontend validation passed')

      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No auth token found')
        Swal.fire('Error', 'Authentication token is missing', 'error');
        return;
      }
      console.log('✅ Auth token found')

      const requestBody = {
        id_bm: barangMentahParams.id_bm,
        berat_mentah: barangMentahParams.berat_mentah,
        harga_beli: barangMentahParams.harga_beli,
        harga_jual: barangMentahParams.harga_jual,
      }
      console.log('📤 Sending request body:', requestBody)

      const response = await fetch(buildApiUrl('barang-mentah'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status)
      console.log('📥 Response status text:', response.statusText)

      const result = await response.json();
      console.log('📥 Response data:', result)
      
      if (response.ok) {
        console.log('✅ Success!')
        Swal.fire('Sukses', result.message || 'Barang mentah berhasil ditambahkan.', 'success');
        setAddBarangMentahModal(false);
        setBarangMentahParams({
          id: null,
          id_bm: null,
          berat_mentah: 0,
          harga_beli: 0,
          harga_jual: 0,
        });
        fetchBarangMentahs(); // Refresh data
      } else {
        console.log('❌ Server returned error')
        Swal.fire('Error', result.message || 'Gagal menambahkan barang mentah.', 'error');
      }
      console.log('=== FRONTEND: saveBarangMentah() END ===')
    } catch (error) {
      console.log('💥 Frontend error:', error)
      Swal.fire('Error', 'Terjadi kesalahan saat menyimpan barang mentah.', 'error');
    }
  };

  // Function untuk validasi dan format input angka
  const handleNumberInput = (value: string, field: keyof BarangMentahFormState, allowDecimal = false) => {
    // Jika value kosong, set ke 0
    if (value === '') {
      setBarangMentahParams({ 
        ...barangMentahParams, 
        [field]: 0 
      });
      return;
    }
    
    // Hapus semua karakter non-digit dan titik (untuk decimal) - termasuk separator ribuan (titik/koma)
    // Untuk currency input, kita perlu handle format Indonesia (1.000.000)
    let cleanValue = value.replace(/[^\d.,]/g, '');
    
    // Handle format Indonesia: ganti titik separator ribuan dengan kosong, koma desimal dengan titik
    if (cleanValue.includes('.') && cleanValue.includes(',')) {
      // Format: 1.000.000,50 -> 1000000.50
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else if (cleanValue.includes('.') && !allowDecimal) {
      // Jika ada titik tapi tidak allow decimal, anggap sebagai separator ribuan
      cleanValue = cleanValue.replace(/\./g, '');
    } else if (cleanValue.includes(',') && allowDecimal) {
      // Ganti koma dengan titik untuk decimal
      cleanValue = cleanValue.replace(',', '.');
    } else {
      // Hapus semua non-digit kecuali titik untuk decimal
      cleanValue = cleanValue.replace(/[^\d.]/g, '');
    }
    
    // Jika tidak allow decimal, hapus semua titik
    if (!allowDecimal) {
      cleanValue = cleanValue.replace(/\./g, '');
    } else {
      // Pastikan hanya ada satu titik decimal
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        cleanValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Handle leading/trailing dots
      if (cleanValue.startsWith('.')) {
        cleanValue = '0' + cleanValue;
      }
      if (cleanValue.endsWith('.')) {
        cleanValue = cleanValue.slice(0, -1);
      }
    }
    
    // Convert ke number
    const numValue = cleanValue === '' || cleanValue === '0.' ? 0 : parseFloat(cleanValue);
    
    // Pastikan hasilnya valid number
    if (!isNaN(numValue)) {
      setBarangMentahParams({ 
        ...barangMentahParams, 
        [field]: numValue 
      });
    }
  };

  // Function untuk format display value
  const formatDisplayValue = (value: number): string => {
    if (value === 0) return '';
    // Untuk weight/number, hanya tampilkan decimal jika memang ada nilai decimal
    return value % 1 === 0 ? value.toString() : value.toFixed(3).replace(/\.?0+$/, '');
  };

  // Function untuk format display currency dengan separator (hapus .00)
  const formatDisplayCurrency = (value: number): string => {
    if (value === 0) return 'Rp 0';
    // Parse ke integer jika valuenya adalah bilangan bulat
    const cleanValue = value % 1 === 0 ? Math.floor(value) : value;
    return `Rp ${cleanValue.toLocaleString('id-ID')}`;
  };

  // Function untuk format input currency (tanpa Rp prefix)
  const formatInputCurrency = (value: number): string => {
    if (value === 0) return '';
    // Parse ke integer jika valuenya adalah bilangan bulat
    const cleanValue = value % 1 === 0 ? Math.floor(value) : value;
    return cleanValue.toLocaleString('id-ID');
  };

  // Function untuk handle edit barang mentah
  const handleEditBarangMentah = (item: any) => {
    setSelectedBarangMentah(item);
    setBarangMentahParams({
      id: item.id_barangmentah,
      id_bm: item.id_bm,
      berat_mentah: item.berat_mentah,
      harga_beli: item.harga_beli,
      harga_jual: item.harga_jual,
    });
    setEditBarangMentahModal(true);
  };

  // Function untuk handle update barang mentah dengan konfirmasi
  const handleUpdateBarangMentah = async () => {
    // Validasi input
    if (!barangMentahParams.id_bm) {
      Swal.fire('Error', 'Jenis barang mentah harus dipilih.', 'error');
      return;
    }

    // Popup konfirmasi
    const result = await Swal.fire({
      title: 'Konfirmasi Perubahan',
      text: `Apakah Anda yakin ingin mengubah data barang mentah "${selectedBarangMentah?.namaBarangMentah?.nama_barang_mentah}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Ubah!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token is missing', 'error');
        return;
      }

      const response = await fetch(buildApiUrl(`barang-mentah/${barangMentahParams.id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id_bm: barangMentahParams.id_bm,
          berat_mentah: barangMentahParams.berat_mentah,
          harga_beli: barangMentahParams.harga_beli,
          harga_jual: barangMentahParams.harga_jual,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        Swal.fire('Sukses', result.message || 'Barang mentah berhasil diperbarui.', 'success');
        setEditBarangMentahModal(false);
        setBarangMentahParams({
          id: null,
          id_bm: null,
          berat_mentah: 0,
          harga_beli: 0,
          harga_jual: 0,
        });
        fetchBarangMentahs(); // Refresh data
      } else {
        Swal.fire('Error', result.message || 'Gagal memperbarui barang mentah.', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat memperbarui barang mentah.', 'error');
    }
  };

  // Effect untuk fetch data saat component mount
  useEffect(() => {
    fetchBarangMentahs();
    fetchNamaBarangMentah();
  }, []);

  // Effect untuk handle custom search
  useEffect(() => {
    if (dataTableRef.current && search !== undefined) {
      setSearchLoading(true);
      const timer = setTimeout(() => {
        dataTableRef.current.search(search).draw();
        setSearchLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  // Effect untuk initialize DataTables
  useEffect(() => {
    if (tableRef.current && barangMentahs.length > 0 && !loading) {
      // Destroy existing DataTable if it exists
      if (dataTableRef.current) {
        try {
          dataTableRef.current.destroy();
        } catch (e) {
          console.log('Error destroying DataTable:', e);
        }
        dataTableRef.current = null;
      }

      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (tableRef.current && !dataTableRef.current) {
          try {
            dataTableRef.current = new DataTable(tableRef.current, {
              pageLength: 10,
              lengthMenu: [5, 10, 25, 50],
              ordering: true,
              searching: true,
              paging: true,
              info: true,
              autoWidth: false,
              retrieve: true,
              destroy: true,
              dom: '<"flex justify-between items-center mb-4"l>rt<"flex justify-between items-center mt-4"ip>',
              columnDefs: [
                { orderable: false, targets: -1 } // Disable sorting pada kolom Aksi
              ],
              language: {
                lengthMenu: "Tampilkan _MENU_ data per halaman",
                info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                infoEmpty: "Menampilkan 0 sampai 0 dari 0 data",
                infoFiltered: "(difilter dari _MAX_ total data)",
                search: "Cari:",
                paginate: {
                  first: '<iconify-icon icon="mdi:chevron-double-left"></iconify-icon>',
                  last: '<iconify-icon icon="mdi:chevron-double-right"></iconify-icon>',
                  next: '<iconify-icon icon="mdi:chevron-right"></iconify-icon>',
                  previous: '<iconify-icon icon="mdi:chevron-left"></iconify-icon>'
                },
                zeroRecords: "Tidak ada data yang sesuai",
                emptyTable: "Tidak ada data tersedia"
              }
            });
          } catch (error) {
            console.error('Error initializing DataTable:', error);
          }
        }
      }, 150);

      return () => clearTimeout(timer);
    }

    // Cleanup
    return () => {
      if (dataTableRef.current) {
        try {
          dataTableRef.current.destroy();
        } catch (e) {
          console.log('Error in cleanup:', e);
        }
        dataTableRef.current = null;
      }
    };
  }, [barangMentahs, loading]);

  // Format currency ke Rupiah
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate margin keuntungan
  const calculateMargin = (hargaBeli: number, hargaJual: number) => {
    return hargaJual - hargaBeli;
  };

  // Calculate persentase keuntungan
  const calculatePercentage = (hargaBeli: number, hargaJual: number) => {
    if (hargaBeli === 0) return 0;
    return ((hargaJual - hargaBeli) / hargaBeli) * 100;
  };

  const saveInventaris = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token is missing', 'error');
        return;
      }

      const response = await fetch(buildApiUrl('inventaris'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: params.barang_id,
          jumlah: params.jumlah,
          lokasi_barang: params.jurusan_id,
          keterangan: params.keterangan,
          harga: params.harga,
          asal_barang: params.asal_barang,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        Swal.fire('Sukses', result.message || 'Inventaris berhasil ditambahkan.', 'success');
        setAddInventarisModal(false);
        fetchBarangMentahs(); // Refresh data
      } else {
        Swal.fire('Error', result.message || 'Gagal menambahkan inventaris.', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat menyimpan inventaris.', 'error');
    }
  };

  const isNewItem = (tanggal_masuk: string): boolean => {
    const now = new Date();
    const itemTime = new Date(tanggal_masuk);
    const diffInHours = Math.abs(now.getTime() - itemTime.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 12;
  };
  const handleDelete = async (inventarisId: number) => {
    Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin menghapus inventaris ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
          }

          const response = await fetch(buildApiUrl(`inventaris/${inventarisId}`), {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });

          const result = await response.json();

          if (response.ok) {
            Swal.fire('Sukses', result.message || 'Inventaris berhasil dihapus.', 'success');
            fetchBarangMentahs(); // Refresh data setelah penghapusan
          } else {
            Swal.fire('Error', result.message || 'Gagal menghapus inventaris.', 'error');
          }
        } catch (error) {
          Swal.fire('Error', 'Terjadi kesalahan saat menghapus inventaris.', 'error');
        }
      }
    });
  };

  // Function untuk handle delete barang mentah
  const handleDeleteBarangMentah = async (barangMentahId: number, namaBarang: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus barang mentah "${namaBarang}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token is missing', 'error');
        return;
      }

      const response = await fetch(buildApiUrl(`barang-mentah/${barangMentahId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire('Sukses', result.message || 'Barang mentah berhasil dihapus.', 'success');
        fetchBarangMentahs(); // Refresh data setelah penghapusan
      } else {
        // Handle specific error messages from backend
        if (response.status === 422 && result.errors?.message) {
          Swal.fire('Tidak Dapat Dihapus', result.errors.message[0], 'error');
        } else {
          Swal.fire('Error', result.message || 'Gagal menghapus barang mentah.', 'error');
        }
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat menghapus barang mentah.', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Data Barang Mentah</h2>
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setBarangMentahParams({
                  id: null,
                  id_bm: null,
                  berat_mentah: 0,
                  harga_beli: 0,
                  harga_jual: 0,
                });
                setAddBarangMentahModal(true);
              }}
            >
              <Icon icon="solar:add-circle-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
              Tambah Barang Mentah
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
      <div className="xl:col-span-1 mt-4">
        <KetersediaanWidget 
          onDetailClick={() => setShowKetersediaanModal(true)}
        />
      </div>

      {loading ? (
        <div className="mt-5 panel p-5 text-center">
          <p>Loading data...</p>
        </div>
      ) : (
        <div className="mt-5 panel p-5 border-0">
          <div className="overflow-x-auto">
            <div className="datatables">
              <table ref={tableRef} id="barangMentahTable" className="table-striped table-hover" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode</th>
                  <th>Nama Barang</th>
                  <th>Berat Total (kg)</th>
                  <th>Harga Beli / kg</th>
                  <th>Harga Jual / kg</th>
                  <th className="text-success">Margin</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {barangMentahs.map((item, index) => {
                  const isNew = isNewItem(item.created_at);
                  return (
                    <tr key={item.kode}>
                      <td>{index + 1}</td>
                      <td>
                        {item.kode}
                        {isNew && (
                          <span className="ml-2 text-xs text-green-600 font-semibold">NEW</span>
                        )}
                      </td>
                      <td>{item.namaBarangMentah?.nama_barang_mentah}</td>
                      <td>{item.berat_mentah} kg</td>
                      <td>{formatDisplayCurrency(item.harga_beli || 0)}</td>
                      <td>{formatDisplayCurrency(item.harga_jual || 0)}</td>
                      <td className="text-success font-semibold">{formatDisplayCurrency((item.harga_jual || 0) - (item.harga_beli || 0))}</td>
                      <td className="text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleEditBarangMentah(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteBarangMentah(item.id_barangmentah, item.namaBarangMentah?.nama_barang_mentah || 'Barang Mentah')}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Modal Tambah Barang Mentah */}
      <Transition appear show={addBarangMentahModal} as={Fragment}>
        <Dialog as="div" open={addBarangMentahModal} onClose={() => setAddBarangMentahModal(false)} className="relative z-[51]">
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
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
                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                  <button
                    type="button"
                    onClick={() => setAddBarangMentahModal(false)}
                    className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                  >
                    <IconX />
                  </button>
                  <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                    Tambah Barang Mentah
                  </div>
                  <div className="p-5">
                    <form>
                      <div className="mb-5">
                        <label htmlFor="id_bm">Jenis Barang Mentah</label>
                        <select
                          id="id_bm"
                          className="form-select"
                          value={barangMentahParams.id_bm || ''}
                          onChange={(e) => setBarangMentahParams({ ...barangMentahParams, id_bm: Number(e.target.value) || null })}
                        >
                          <option value="">Pilih Jenis Barang Mentah</option>
                          {namaBarangMentahList.map((item) => (
                            <option key={item.id_bm} value={item.id_bm}>
                              {item.nama_barang_mentah} ({item.kode_barang})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-5">
                        <label htmlFor="berat_mentah">Berat Total</label>
                        <div className="relative">
                          <input
                            id="berat_mentah"
                            type="text"
                            placeholder="0"
                            className="form-input pr-10"
                            value={formatDisplayValue(barangMentahParams.berat_mentah)}
                            onChange={(e) => handleNumberInput(e.target.value, 'berat_mentah', true)}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500 text-sm">kg</span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-5">
                        <label htmlFor="harga_beli">Harga Beli</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <span className="text-gray-500 text-sm">Rp</span>
                          </div>
                          <input
                            id="harga_beli"
                            type="text"
                            placeholder="0"
                            className="form-input pl-10"
                            value={formatInputCurrency(barangMentahParams.harga_beli)}
                            onChange={(e) => handleNumberInput(e.target.value, 'harga_beli', false)}
                          />
                        </div>
                      </div>

                      <div className="mb-5">
                        <label htmlFor="harga_jual">Harga Jual</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <span className="text-gray-500 text-sm">Rp</span>
                          </div>
                          <input
                            id="harga_jual"
                            type="text"
                            placeholder="0"
                            className="form-input pl-10"
                            value={formatInputCurrency(barangMentahParams.harga_jual)}
                            onChange={(e) => handleNumberInput(e.target.value, 'harga_jual', false)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end items-center mt-8">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => setAddBarangMentahModal(false)}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary ltr:ml-4 rtl:mr-4"
                          onClick={saveBarangMentah}
                        >
                          Tambah
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Edit Barang Mentah */}
      <Transition appear show={editBarangMentahModal} as={Fragment}>
        <Dialog as="div" open={editBarangMentahModal} onClose={() => setEditBarangMentahModal(false)} className="relative z-[51]">
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
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
                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                  <button
                    type="button"
                    onClick={() => setEditBarangMentahModal(false)}
                    className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                  >
                    <IconX />
                  </button>
                  <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                    Edit Barang Mentah
                  </div>
                  <div className="p-5">
                    <form>
                      <div className="mb-5">
                        <label htmlFor="edit_id_bm">Jenis Barang Mentah</label>
                        <select
                          id="edit_id_bm"
                          className="form-select"
                          value={barangMentahParams.id_bm || ''}
                          onChange={(e) => setBarangMentahParams({ ...barangMentahParams, id_bm: Number(e.target.value) || null })}
                        >
                          <option value="">Pilih Jenis Barang Mentah</option>
                          {namaBarangMentahList.map((item) => (
                            <option key={item.id_bm} value={item.id_bm}>
                              {item.nama_barang_mentah} ({item.kode_barang})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="edit_berat_mentah">Berat (kg)</label>
                        <div className="relative">
                          <input
                            id="edit_berat_mentah"
                            type="text"
                            placeholder="Masukkan berat"
                            className="form-input pr-12"
                            value={formatDisplayValue(barangMentahParams.berat_mentah)}
                            onChange={(e) => handleNumberInput(e.target.value, 'berat_mentah', true)}
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            kg
                          </span>
                        </div>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="edit_harga_beli">Harga Beli (per kg)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            Rp
                          </span>
                          <input
                            id="edit_harga_beli"
                            type="text"
                            placeholder="Masukkan harga beli"
                            className="form-input pl-12"
                            value={formatInputCurrency(barangMentahParams.harga_beli)}
                            onChange={(e) => handleNumberInput(e.target.value, 'harga_beli')}
                          />
                        </div>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="edit_harga_jual">Harga Jual (per kg)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            Rp
                          </span>
                          <input
                            id="edit_harga_jual"
                            type="text"
                            placeholder="Masukkan harga jual"
                            className="form-input pl-12"
                            value={formatInputCurrency(barangMentahParams.harga_jual)}
                            onChange={(e) => handleNumberInput(e.target.value, 'harga_jual')}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end items-center mt-8">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => setEditBarangMentahModal(false)}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary ltr:ml-4 rtl:mr-4"
                          onClick={handleUpdateBarangMentah}
                        >
                          Update
                        </button>
                      </div>
                    </form>
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

export default InventarisBarang;
