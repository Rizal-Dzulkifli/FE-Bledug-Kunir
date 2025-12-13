import React, { useState, useEffect, Fragment } from 'react';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [addInventarisModal, setAddInventarisModal] = useState(false);

  const [params, setParams] = useState<ParamsState>({
    id: null,
    barang_id: null,
    jumlah: 0,
    jurusan_id: null,
    keterangan: '',
    harga: 0,
    asal_barang: '',
  });

  const limit = 30;
  const maxVisiblePages = 5;

  const fetchBarangMentahs = async (isSearching = false) => {
    try {
      if (isSearching) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token is missing', 'error');
        return;
      }

      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const url = buildApiUrl(`barang-mentah?page=${page}&limit=${limit}${searchParam}`);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch barang mentah');
      }

      const result = await response.json();
      setBarangMentahs(result.data.data || []);
      setTotalPages(result.data.lastPage || 1);
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat mengambil data barang mentah', 'error');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Effect untuk fetch data saat page berubah (tanpa search)
  useEffect(() => {
    fetchBarangMentahs();
  }, [page]);

  // Effect untuk debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1); // Reset ke halaman pertama saat search
      fetchBarangMentahs(true); // isSearching = true
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

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
          status_barang: 'Tersedia',
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

  const getSerialNumber = (index: number): number => (page - 1) * limit + index + 1;

  const getVisiblePages = () => {
    const pages = [];
    const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const goToPage = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
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

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Data Barang Mentah</h2>
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
          <div className="flex gap-3">
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

      <div className="mt-5 panel p-0 border-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table-striped table-hover">
            <thead>
              <tr>
                <th>No</th>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Berat (kg)</th>
                <th>Harga Beli</th>
                <th>Harga Jual</th>
                <th>Margin</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && !searchLoading ? (
                <tr>
                  <td colSpan={8} className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : barangMentahs.length > 0 ? (
                barangMentahs.map((item, index) => {
                  return (
                    <tr
                      key={item.kode}
                    >
                      <td className="relative">
                        {getSerialNumber(index)}
                      </td>
                      <td>{item.kode}</td>
                      <td>{item.namaBarangMentah?.nama_barang_mentah}</td>
                      <td>{item.berat_mentah} kg</td>
                      <td>Rp {item.harga_beli?.toLocaleString()}</td>
                      <td>Rp {item.harga_jual?.toLocaleString()}</td>
                      <td>Rp {((item.harga_jual || 0) - (item.harga_beli || 0))?.toLocaleString()}</td>
                      <td className="text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => console.log('View barang mentah', item.id_barangmentah)}
                          >
                            Lihat
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-center">
                    Tidak ada data barang mentah
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Pagination */}
      <ul className="flex justify-center items-center space-x-1 rtl:space-x-reverse mt-5 mb-auto">
        <li>
          <button
            type="button"
            onClick={() => goToPage(1)}
            className="flex justify-center font-semibold p-2 rounded-full transition bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary"
            disabled={page === 1}
          >
            <Icon icon="mdi:chevron-double-left" />
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            className="flex justify-center font-semibold p-2 rounded-full transition bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary"
            disabled={page === 1}
          >
            <Icon icon="mdi:chevron-left" />
          </button>
        </li>
        {getVisiblePages().map((pageNum) => (
          <li key={pageNum}>
            <button
              type="button"
              onClick={() => goToPage(pageNum)}
              className={`flex justify-center font-semibold px-3.5 py-2 rounded-full transition ${page === pageNum ? 'bg-primary text-white' : 'bg-white-light text-dark hover:bg-primary hover:text-white dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary'
                }`}
            >
              {pageNum}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            className="flex justify-center font-semibold p-2 rounded-full transition bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary"
            disabled={page === totalPages}
          >
            <Icon icon="mdi:chevron-right" />
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => goToPage(totalPages)}
            className="flex justify-center font-semibold p-2 rounded-full transition bg-white-light text-dark hover:text-white hover:bg-primary dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary"
            disabled={page === totalPages}
          >
            <Icon icon="mdi:chevron-double-right" />
          </button>
        </li>
      </ul>

    </div>
  );
};

export default InventarisBarang;
