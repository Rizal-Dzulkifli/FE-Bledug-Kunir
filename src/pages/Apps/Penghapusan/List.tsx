import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface PenghapusanItem {
  penghapusan_id: number;
  nomor_penghapusan: string;
  tanggal_penghapusan: string;
  keterangan: string;
  user: { nama: string };
}

const PenghapusanList: React.FC = () => {
  const navigate = useNavigate();
  const [penghapusans, setPenghapusans] = useState<PenghapusanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const maxVisiblePages = 5;

  const fetchPenghapusanData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token is missing', 'error');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`http://localhost:3333/api/penghapusan?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        if (result.data && result.meta) {
          setPenghapusans(result.data);
          setTotalPages(result.meta.last_page);
        } else {
          Swal.fire('Error', 'Format data tidak sesuai', 'error');
        }
      } else {
        Swal.fire('Error', result.message || 'Gagal mengambil data penghapusan', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat mengambil data penghapusan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenghapusanData();
  }, [page]);

  const handleDelete = async (penghapusanId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token is missing', 'error');
      return;
    }

    Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin menghapus penghapusan ini? Status inventaris akan dikembalikan ke "Tersedia".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:3333/api/penghapusan/${penghapusanId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Gagal menghapus penghapusan');
          }

          Swal.fire('Sukses', 'Penghapusan berhasil dihapus.', 'success');
          fetchPenghapusanData(); // Refresh data
        } catch (error) {
          Swal.fire('Error', (error as Error).message, 'error');
        }
      }
    });
  };

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

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Penghapusan - Daftar Transaksi Penghapusan</h2>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn bg-primary text-white btn-outline-primary"
            onClick={() => navigate('/penghapusan/add')}
          >
            Tambah Penghapusan
          </button>
        </div>
      </div>
      <div className="mt-5 panel p-0 border-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="text-center py-2">No</th>
                <th className="text-center py-2">Nomor Penghapusan</th>
                <th className="text-center py-2">Tanggal Penghapusan</th>
                <th className="text-center py-2">Keterangan</th>
                <th className="text-center py-2">Petugas</th>
                <th className="text-center py-2">Aksi</th>
                <th className=""></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 font-semibold text-gray-600">
                    Loading...
                  </td>
                </tr>
              ) : penghapusans.length > 0 ? (
                penghapusans.map((item, index) => (
                  <tr
                    key={item.penghapusan_id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <td className="text-center">{(page - 1) * limit + index + 1}</td>
                    <td className="text-center">{item.nomor_penghapusan || 'Tidak Ada'}</td>
                    <td className="text-center">
                      {item.tanggal_penghapusan
                        ? new Date(item.tanggal_penghapusan).toLocaleDateString()
                        : 'Tidak Ada'}
                    </td>
                    <td className="text-center">{item.keterangan || 'Tidak Ada'}</td>
                    <td className="text-center py-2">{item.user?.nama || 'Tidak Diketahui'}</td>
                    <td className="text-center">
                      <ul className="flex items-center justify-center gap-2">
                        <li>
                          <Tippy content="Edit">
                            <button
                              type="button"
                              className="group"
                              onClick={() => navigate(`/penghapusan/edit/${item.penghapusan_id}`)}
                            >
                              <Icon icon="solar:pen-new-square-line-duotone" width="1.2rem" height="1.2rem" />
                            </button>
                          </Tippy>
                        </li>
                        <li>
                          <Tippy content="Lihat">
                            <button
                              type="button"
                              onClick={() => navigate(`/penghapusan/view/${item.penghapusan_id}`)}
                            >
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
                              onClick={() => handleDelete(item.penghapusan_id)}
                              className="text-danger"
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
                  <td colSpan={7} className="text-center py-4 font-semibold text-gray-600">
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
              className={`flex justify-center font-semibold px-3.5 py-2 rounded-full transition ${
                page === pageNum ? 'bg-primary text-white' : 'bg-white-light text-dark hover:bg-primary hover:text-white dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary'
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

export default PenghapusanList;
