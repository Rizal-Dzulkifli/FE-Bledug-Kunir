import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface MutasiItem {
  mutasi_id: number;
  nomor_mutasi: string;
  tanggal_mutasi: string;
  user: { nama: string };
  status_tujuan: string;
  keterangan: string;
}

const MutasiList: React.FC = () => {
  const navigate = useNavigate();
  const [mutasis, setMutasis] = useState<MutasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const maxVisiblePages = 5;

  const fetchMutasiData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token is missing', 'error');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`http://localhost:3333/api/mutasi?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        if (result.data && result.meta) {
          setMutasis(result.data);
          setTotalPages(result.meta.last_page);
        } else {
          Swal.fire('Error', 'Format data tidak sesuai', 'error');
        }
      } else {
        Swal.fire('Error', result.message || 'Gagal mengambil data mutasi', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat mengambil data mutasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMutasiData();
  }, [page]);

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
        <h2 className="text-xl">Mutasi - Daftar Transaksi Mutasi</h2>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn bg-primary text-white btn-outline-primary"
            onClick={() => navigate('/mutasi/add')}
          >
            Tambah Mutasi
          </button>
        </div>
      </div>
      <div className="mt-5 panel p-0 border-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="text-center py-2">No</th>
                <th className="text-center py-2">Nomor Mutasi</th>
                <th className="text-center py-2">Tanggal Mutasi</th>
                <th className="text-center py-2">Status Tujuan</th>
                <th className="text-center py-2">Petugas</th>
                <th className="text-center py-2">Keterangan</th>
                <th className="text-center py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 font-semibold text-gray-600">
                    Loading...
                  </td>
                </tr>
              ) : mutasis.length > 0 ? (
                mutasis.map((item, index) => (
                  <tr
                    key={item.mutasi_id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <td className="text-center">{(page - 1) * limit + index + 1}</td>
                    <td className="">{item.nomor_mutasi || 'Tidak Ada'}</td>
                    <td className="text-center">
                      {item.tanggal_mutasi
                        ? new Date(item.tanggal_mutasi).toLocaleDateString()
                        : 'Tidak Ada'}
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${item.status_tujuan === 'Tersedia' ? 'bg-primary' : 'badge-outline-warning'}`}
                      >
                        {item.status_tujuan}
                      </span>
                    </td>
                    <td className="text-center">{item.user?.nama || 'Tidak Diketahui'}</td>
                    <td className="text-center">
                      {item.keterangan
                        ? item.keterangan.length > 20
                          ? `${item.keterangan.slice(0, 20)}...` // Tampilkan maksimal 20 karakter
                          : item.keterangan
                        : 'Tidak Ada'}
                    </td>

                    <td className="text-center">
                      <ul className="flex items-center justify-center gap-2">
                        <li>
                          <Tippy content="Lihat">
                            <button
                              type="button"
                              onClick={() => navigate(`/mutasi/view/${item.mutasi_id}`)}
                            >
                              <Icon icon="solar:eye-line-duotone" width="1.2rem" height="1.2rem" />
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
              className={`flex justify-center font-semibold px-3.5 py-2 rounded-full transition ${page === pageNum
                  ? 'bg-primary text-white'
                  : 'bg-white-light text-dark hover:bg-primary hover:text-white dark:text-white-light dark:bg-[#191e3a] dark:hover:bg-primary'
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

export default MutasiList;
