import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface BarangItem {
  barang_id: number;
  nama_barang: string;
  jumlah: number;
  harga_satuan: number;
  total_harga: number;
}

interface PengadaanItem {
  id: number;
  nomor_surat: string | null;
  tanggal_pengadaan: string;
  keterangan: string | null;
  total_harga: number;
  barang: BarangItem[];
  dibuat_oleh: string;
}

const PengadaanList: React.FC = () => {
  const navigate = useNavigate();
  const [pengadaan, setPengadaan] = useState<PengadaanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const maxVisiblePages = 5;

  const fetchPengadaanData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token is missing', 'error');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`http://localhost:3333/api/pengadaan?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      // Debugging response dari API
      console.log('Full API Response:', result);

      if (response.ok) {
        if (result.data && result.meta) {
          setPengadaan(result.data);
          setTotalPages(result.meta.last_page); // Update total halaman dari metadata
        } else {
          console.error('Unexpected data format:', result);
          Swal.fire('Error', 'Format data tidak sesuai', 'error');
        }
      } else {
        Swal.fire('Error', result.message || 'Gagal mengambil data pengadaan', 'error');
      }
    } catch (error) {
      console.error('Error fetching pengadaan data:', error);
      Swal.fire('Error', 'Terjadi kesalahan saat mengambil data pengadaan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengadaanData();
  }, [page]); // Tambahkan `page` sebagai dependency untuk memuat data saat halaman berubah

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
  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token is missing', 'error');
      return;
    }

    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Pengadaan ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:3333/api/pengadaan/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            Swal.fire('Berhasil', 'Pengadaan berhasil dihapus.', 'success');
            fetchPengadaanData(); // Refresh data setelah penghapusan
          } else {
            const errorResult = await response.json();
            Swal.fire('Error', errorResult.message || 'Gagal menghapus pengadaan', 'error');
          }
        } catch (error) {
          Swal.fire('Error', 'Terjadi kesalahan saat menghapus pengadaan', 'error');
        }
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Pengadaan - Data Pengadaan</h2>
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
          <div className="flex gap-3">
            <button
              type="button"
              className="btn bg-primary text-white btn-outline-primary"
              onClick={() => navigate('/apps/invoice/add')} // Navigasi ke halaman tujuan
            >
              Tambah Barang
            </button>
            <button type="button" className="btn btn-outline-primary p-2">Filter</button>
          </div>
        </div>
      </div>
      <div className="mt-5 panel p-0 border-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table-striped table-hover">
            <thead>
              <tr>
                <th>No</th>
                <th>Nomor Surat</th>
                <th>Tanggal Pengadaan</th>
                <th>Keterangan</th>
                <th className="text-center">Aksi</th>
                <th className=""></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : pengadaan.length > 0 ? (
                pengadaan.map((item, index) => (
                  <tr key={item.id}>
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>{item.nomor_surat || 'Tidak Diketahui'}</td>
                    <td>
                      {item.tanggal_pengadaan
                        ? new Date(item.tanggal_pengadaan).toLocaleDateString()
                        : 'Tidak Diketahui'}
                    </td>
                    <td className="text-center">
                      {item.keterangan
                        ? item.keterangan.length > 20
                          ? `${item.keterangan.slice(0, 20)}...` // Tampilkan maksimal 20 karakter
                          : item.keterangan
                        : 'Tidak Ada'}
                    </td>

                    <td className="">
                      <ul className="flex items-center justify-center gap-2">
                        <li>
                          <Tippy content="Edit">
                            <button
                              type="button"
                              className="group"
                              onClick={() => navigate(`/apps/invoice/add/${item.id}`)}
                            >
                              <Icon icon="solar:pen-new-square-line-duotone" width="1.2rem" height="1.2rem" />
                            </button>
                          </Tippy>
                        </li>
                        <li>
                          <Tippy content="Lihat">
                            <button type="button"
                              onClick={() => navigate(`/apps/invoice/preview/${item.id}`)}>
                              <Icon icon="solar:eye-line-duotone" width="1.2rem" height="1.2rem" />
                            </button>
                          </Tippy>
                        </li>

                      </ul>
                    </td>
                    <td className="text-center">
                      <ul className="flex items-center justify-center gap-2">
                        <li>
                          <Tippy content="Hapus">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className='text-danger'
                            >
                             <Icon icon="solar:trash-bin-trash-line-duotone" width="1.2rem" height="1.2rem" />
                            </button>
                          </Tippy>
                        </li>

                      </ul>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">
                    Data tidak ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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

export default PengadaanList;
