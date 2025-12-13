import React, { useState, useEffect, Fragment, useRef } from 'react';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { NavLink, useNavigate } from 'react-router-dom';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './datatables-custom.css';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

interface ProdukItem {
  id_produk_detail: number;
  id_produk: number;
  kode: string;
  berat_produk: number;
  harga_jual: number;
  stok: number;
  deskripsi: string;
  created_at: string;
  updated_at: string;
  namaProduk?: {
    id_produk: number;
    nama_produk: string;
    kode_produk?: string;
    kategori_produk: string;
  };
}

interface ProdukFormState {
  id: number | null;
  id_produk: number | null;
  berat_produk: number;
  harga_jual: number;
  stok: number;
  deskripsi: string;
}

interface NamaProdukItem {
  id_produk: number;
  nama_produk: string;
  kode_produk: string;
  kategori_produk?: string;
}

const InventarisProduk = () => {
  const [produks, setProduks] = useState<ProdukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [addProdukModal, setAddProdukModal] = useState(false);
  const [namaProdukList, setNamaProdukList] = useState<NamaProdukItem[]>([]);
  const [produkParams, setProdukParams] = useState<ProdukFormState>({
    id: null,
    id_produk: null,
    berat_produk: 0,
    harga_jual: 0,
    stok: 0,
    deskripsi: '',
  });
  const [editProdukModal, setEditProdukModal] = useState(false);
  const [selectedProduk, setSelectedProduk] = useState<any>(null);
  const navigate = useNavigate();
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);

  const fetchProduks = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token is missing', 'error');
        return;
      }

      // Fetch all data for DataTables to handle pagination
      const url = buildApiUrl('produk?page=1&limit=1000');
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch produk');
      }

      const result = await response.json();
      setProduks(result.data.data || []);
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat mengambil data produk', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNamaProduk = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch(buildApiUrl('nama-produk'), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nama produk');
      }

      const result = await response.json();
      setNamaProdukList(result.data || []);
    } catch (error) {
      console.error('Error fetching nama produk:', error);
    }
  };

  const saveProduk = async () => {
    try {
      if (!produkParams.id_produk || produkParams.berat_produk <= 0 || produkParams.harga_jual <= 0 || produkParams.stok < 0) {
        Swal.fire('Error', 'Semua field harus diisi dengan benar', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token is missing', 'error');
        return;
      }

      const response = await fetch(buildApiUrl('produk'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id_produk: produkParams.id_produk,
          berat_produk: produkParams.berat_produk,
          harga_jual: produkParams.harga_jual,
          stok: produkParams.stok,
          deskripsi: produkParams.deskripsi,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        Swal.fire('Sukses', result.message || 'Produk berhasil ditambahkan.', 'success');
        setAddProdukModal(false);
        setProdukParams({
          id: null,
          id_produk: null,
          berat_produk: 0,
          harga_jual: 0,
          stok: 0,
          deskripsi: '',
        });
        fetchProduks(); // Refresh data
      } else {
        Swal.fire('Error', result.message || 'Gagal menambahkan produk.', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat menyimpan produk.', 'error');
    }
  };

  // Function untuk validasi dan format input angka
  const handleNumberInput = (value: string, field: keyof ProdukFormState, allowDecimal = false) => {
    // Jika value kosong, set ke 0
    if (value === '') {
      setProdukParams({ 
        ...produkParams, 
        [field]: field === 'deskripsi' ? '' : 0 
      });
      return;
    }
    
    // Untuk field deskripsi, langsung set value
    if (field === 'deskripsi') {
      setProdukParams({ 
        ...produkParams, 
        [field]: value 
      });
      return;
    }
    
    // Hapus semua karakter non-digit dan titik (untuk decimal) serta koma (separator ribuan)
    let cleanValue = value.replace(/[^\d.]/g, '');
    
    // Jika tidak allow decimal, hapus titik juga
    if (!allowDecimal) {
      cleanValue = cleanValue.replace(/\./g, '');
    } else {
      // Pastikan hanya ada satu titik decimal dan handle leading/trailing dots
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        // Jika ada lebih dari satu titik, ambil bagian pertama + titik + gabungan sisanya
        cleanValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Jangan biarkan titik di awal atau akhir untuk parsing yang benar
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
      setProdukParams({ 
        ...produkParams, 
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

  // Function untuk format display currency dengan separator
  const formatDisplayCurrency = (value: number): string => {
    if (value === 0) return '';
    // Format tanpa desimal untuk bilangan bulat
    if (value % 1 === 0) {
      return value.toLocaleString('id-ID', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      });
    }
    return value.toLocaleString('id-ID');
  };

  // Function untuk handle edit produk
  const handleEditProduk = (item: any) => {
    setSelectedProduk(item);
    setProdukParams({
      id: item.id_produk_detail,
      id_produk: item.id_produk,
      berat_produk: parseFloat(item.berat_produk) || 0,
      harga_jual: Math.round(parseFloat(item.harga_jual) || 0), // Bulatkan ke integer untuk harga
      stok: Math.round(parseFloat(item.stok) || 0), // Bulatkan ke integer untuk stok
      deskripsi: item.deskripsi || '',
    });
    setEditProdukModal(true);
  };

  // Function untuk handle update produk dengan konfirmasi
  const handleUpdateProduk = async () => {
    // Validasi input
    if (!produkParams.id_produk) {
      Swal.fire('Error', 'Jenis produk harus dipilih.', 'error');
      return;
    }

    // Popup konfirmasi
    const result = await Swal.fire({
      title: 'Konfirmasi Perubahan',
      text: `Apakah Anda yakin ingin mengubah data produk "${selectedProduk?.namaProduk?.nama_produk}"?`,
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

      const response = await fetch(buildApiUrl(`produk/${produkParams.id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id_produk: produkParams.id_produk,
          berat_produk: produkParams.berat_produk,
          harga_jual: produkParams.harga_jual,
          stok: produkParams.stok,
          deskripsi: produkParams.deskripsi,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        Swal.fire('Sukses', result.message || 'Produk berhasil diperbarui.', 'success');
        setEditProdukModal(false);
        setProdukParams({
          id: null,
          id_produk: null,
          berat_produk: 0,
          harga_jual: 0,
          stok: 0,
          deskripsi: '',
        });
        fetchProduks(); // Refresh data
      } else {
        Swal.fire('Error', result.message || 'Gagal memperbarui produk.', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat memperbarui produk.', 'error');
    }
  };

  // Effect untuk fetch data saat component mount
  useEffect(() => {
    fetchProduks();
    fetchNamaProduk();
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

  // Effect untuk initialize dan update DataTables
  useEffect(() => {
    if (tableRef.current && produks.length > 0 && !loading) {
      // Destroy existing DataTable if it exists
      if (dataTableRef.current) {
        try {
          dataTableRef.current.destroy();
        } catch (e) {
          console.log('Error destroying DataTable:', e);
        }
        dataTableRef.current = null;
      }

      // Small delay to ensure DOM is ready and cleanup is complete
      const timer = setTimeout(() => {
        if (tableRef.current && !dataTableRef.current) {
          try {
            // Initialize DataTable
            dataTableRef.current = new DataTable(tableRef.current, {
              pageLength: 10,
              lengthMenu: [5, 10, 25, 50],
              ordering: true,
              searching: true,
              paging: true,
              info: true,
              autoWidth: false,
              retrieve: true, // Allow re-initialization
              destroy: true, // Destroy existing instance if needed
              dom: '<"flex justify-between items-center mb-4"l>rt<"flex justify-between items-center mt-4"ip>',
              columnDefs: [
                { orderable: false, targets: 7 } // Disable sorting on "Aksi" column (index 7)
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
              },
              drawCallback: function() {
                // Re-attach event listeners after DataTables redraws
                const table = this.api();
                const tableNode = table.table().node();
                
                // Handle edit button clicks
                tableNode.querySelectorAll('.btn-edit-produk').forEach((btn: any) => {
                  btn.onclick = (e: any) => {
                    e.preventDefault();
                    const id = btn.getAttribute('data-id');
                    const produk = produks.find(p => p.id_produk_detail === Number(id));
                    if (produk) {
                      handleEditProduk(produk);
                    }
                  };
                });
                
                // Handle delete button clicks
                tableNode.querySelectorAll('.btn-delete-produk').forEach((btn: any) => {
                  btn.onclick = (e: any) => {
                    e.preventDefault();
                    const id = btn.getAttribute('data-id');
                    handleDelete(Number(id));
                  };
                });
              }
            });
          } catch (error) {
            console.error('Error initializing DataTable:', error);
          }
        }
      }, 150);

      return () => clearTimeout(timer);
    }

    // Cleanup function
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
  }, [produks, loading]);

  // Format currency ke Rupiah
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate margin keuntungan (harga jual - harga beli per kg)
  const calculateMargin = (beratKg: number, hargaJual: number) => {
    if (beratKg === 0) return 0;
    return hargaJual; // Karena harga_jual sudah per satuan
  };

  // Helper function untuk check if item is new (dalam 12 jam terakhir)
  const isNewItem = (createdAt: string): boolean => {
    const now = new Date();
    const itemTime = new Date(createdAt);
    const diffInHours = Math.abs(now.getTime() - itemTime.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 12;
  };

  // Function untuk handle delete produk
  const handleDelete = async (produkId: number) => {
    Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin menghapus produk ini?',
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

          const response = await fetch(buildApiUrl(`produk/${produkId}`), {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });

          const result = await response.json();

          if (response.ok) {
            Swal.fire('Sukses', result.message || 'Produk berhasil dihapus.', 'success');
            fetchProduks(); // Refresh data setelah penghapusan
          } else {
            Swal.fire('Error', result.message || 'Gagal menghapus produk.', 'error');
          }
        } catch (error) {
          Swal.fire('Error', 'Terjadi kesalahan saat menghapus produk.', 'error');
        }
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Data Produk</h2>
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setProdukParams({
                  id: null,
                  id_produk: null,
                  berat_produk: 0,
                  harga_jual: 0,
                  stok: 0,
                  deskripsi: '',
                });
                setAddProdukModal(true);
              }}
            >
              <Icon icon="solar:add-circle-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
              Tambah Produk
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

      {loading ? (
        <div className="mt-5 panel p-5 text-center">
          <p>Loading data...</p>
        </div>
      ) : (
        <div className="mt-5 panel p-5 border-0">
          <div className="overflow-x-auto">
            <div className="datatables">
              <table ref={tableRef} id="produkTable" className="table-striped table-hover" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode</th>
                  <th>Nama Produk</th>
                  <th>Berat (kg)</th>
                  <th>Harga Jual</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {produks.map((item, index) => {
                  const statusStok = item.stok > 10 ? 'Tersedia' : item.stok > 0 ? 'Terbatas' : 'Habis';
                  const statusColor = item.stok > 10 ? 'text-green-600' : item.stok > 0 ? 'text-yellow-600' : 'text-red-600';
                  
                  return (
                    <tr key={item.kode}>
                      <td>{index + 1}</td>
                      <td>{item.kode}</td>
                      <td>
                        <div className="font-semibold">{item.namaProduk?.nama_produk}</div>
                        {item.deskripsi && (
                          <div className="text-xs text-gray-500">{item.deskripsi}</div>
                        )}
                      </td>
                      <td>{item.berat_produk} kg</td>
                      <td>{formatCurrency(item.harga_jual)}</td>
                      <td>
                        <span className={`badge ${item.stok > 10 ? 'badge-outline-success' : item.stok > 0 ? 'badge-outline-warning' : 'badge-outline-danger'}`}>
                          {item.stok}
                        </span>
                      </td>
                      <td>
                        <span className={statusColor}>
                          {statusStok}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning btn-edit-produk"
                            data-id={item.id_produk_detail}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger btn-delete-produk"
                            data-id={item.id_produk_detail}
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

      {/* Modal Tambah Produk */}
      <Transition appear show={addProdukModal} as={Fragment}>
        <Dialog as="div" open={addProdukModal} onClose={() => setAddProdukModal(false)} className="relative z-[51]">
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
                    onClick={() => setAddProdukModal(false)}
                    className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                  >
                    <IconX />
                  </button>
                  <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                    Tambah Produk
                  </div>
                  <div className="p-5">
                    <form>
                      <div className="mb-5">
                        <label htmlFor="id_produk">Jenis Produk</label>
                        <select
                          id="id_produk"
                          className="form-select"
                          value={produkParams.id_produk || ''}
                          onChange={(e) => setProdukParams({ ...produkParams, id_produk: Number(e.target.value) || null })}
                        >
                          <option value="">Pilih Jenis Produk</option>
                          {namaProdukList.map((item) => (
                            <option key={item.id_produk} value={item.id_produk}>
                              {item.nama_produk} ({item.kode_produk || item.kategori_produk})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-5">
                        <label htmlFor="berat_produk">Berat Produk</label>
                        <div className="relative">
                          <input
                            id="berat_produk"
                            type="text"
                            placeholder="0"
                            className="form-input pr-10"
                            value={formatDisplayValue(produkParams.berat_produk)}
                            onChange={(e) => handleNumberInput(e.target.value, 'berat_produk', true)}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500 text-sm">kg</span>
                          </div>
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
                            value={formatDisplayCurrency(produkParams.harga_jual)}
                            onChange={(e) => handleNumberInput(e.target.value, 'harga_jual', false)}
                          />
                        </div>
                      </div>

                      <div className="mb-5">
                        <label htmlFor="stok">Stok</label>
                        <input
                          id="stok"
                          type="text"
                          placeholder="0"
                          className="form-input"
                          value={formatDisplayValue(produkParams.stok)}
                          onChange={(e) => handleNumberInput(e.target.value, 'stok', false)}
                        />
                      </div>

                      <div className="mb-5">
                        <label htmlFor="deskripsi">Deskripsi</label>
                        <textarea
                          id="deskripsi"
                          rows={3}
                          className="form-textarea"
                          placeholder="Masukkan deskripsi produk..."
                          value={produkParams.deskripsi}
                          onChange={(e) => handleNumberInput(e.target.value, 'deskripsi')}
                        ></textarea>
                      </div>

                      <div className="flex justify-end items-center mt-8">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => setAddProdukModal(false)}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary ltr:ml-4 rtl:mr-4"
                          onClick={saveProduk}
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

      {/* Modal Edit Produk */}
      <Transition appear show={editProdukModal} as={Fragment}>
        <Dialog as="div" open={editProdukModal} onClose={() => setEditProdukModal(false)} className="relative z-[51]">
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
                    onClick={() => setEditProdukModal(false)}
                    className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                  >
                    <IconX />
                  </button>
                  <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                    Edit Produk
                  </div>
                  <div className="p-5">
                    <form>
                      <div className="mb-5">
                        <label htmlFor="edit_id_produk">Jenis Produk</label>
                        <select
                          id="edit_id_produk"
                          className="form-select"
                          value={produkParams.id_produk || ''}
                          onChange={(e) => setProdukParams({ ...produkParams, id_produk: Number(e.target.value) || null })}
                        >
                          <option value="">Pilih Jenis Produk</option>
                          {namaProdukList.map((item) => (
                            <option key={item.id_produk} value={item.id_produk}>
                              {item.nama_produk} ({item.kode_produk || item.kategori_produk})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="edit_berat_produk">Berat (g)</label>
                        <div className="relative">
                          <input
                            id="edit_berat_produk"
                            type="text"
                            placeholder="Masukkan berat"
                            className="form-input pr-12"
                            value={formatDisplayValue(produkParams.berat_produk)}
                            onChange={(e) => handleNumberInput(e.target.value, 'berat_produk', true)}
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            g
                          </span>
                        </div>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="edit_harga_jual">Harga Jual</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            Rp
                          </span>
                          <input
                            id="edit_harga_jual"
                            type="text"
                            placeholder="Masukkan harga jual"
                            className="form-input pl-12"
                            value={formatDisplayCurrency(produkParams.harga_jual)}
                            onChange={(e) => handleNumberInput(e.target.value, 'harga_jual', false)}
                          />
                        </div>
                      </div>
                      <div className="mb-5">
                        <label htmlFor="edit_stok">Stok</label>
                        <input
                          id="edit_stok"
                          type="text"
                          placeholder="Masukkan stok"
                          className="form-input"
                          value={formatDisplayValue(produkParams.stok)}
                          onChange={(e) => handleNumberInput(e.target.value, 'stok', false)}
                        />
                      </div>
                      <div className="mb-5">
                        <label htmlFor="edit_deskripsi">Deskripsi</label>
                        <textarea
                          id="edit_deskripsi"
                          rows={3}
                          className="form-textarea"
                          placeholder="Masukkan deskripsi produk..."
                          value={produkParams.deskripsi}
                          onChange={(e) => handleNumberInput(e.target.value, 'deskripsi')}
                        ></textarea>
                      </div>
                      <div className="flex justify-end items-center mt-8">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => setEditProdukModal(false)}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary ltr:ml-4 rtl:mr-4"
                          onClick={handleUpdateProduk}
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

export default InventarisProduk;