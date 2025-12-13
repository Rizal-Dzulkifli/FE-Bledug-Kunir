import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import IconEye from '../../../components/Icon/IconEye';
import IconEdit from '../../../components/Icon/IconEdit';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';

interface PengadaanDetail {
  id_pemesanan: number;
  id_kontak: number;
  no_pemesanan: string;
  tgl_transaksi: string;
  total_harga: number;
  status: 'selesai' | 'belum di bayar' | 'dibatalkan' | 'proses';
  deskripsi: string | null;
  created_at: string;
  updated_at: string;
  kontak: {
    id_kontak: number;
    nama: string;
    no_telp: string | null;
    alamat: string | null;
    role: string;
  };
  detailPengadaan: Array<{
    id_dpemesananb: number;
    id_barangmentah: number;
    berat: number;
    barangMentah: {
      id_barangmentah: number;
      id_bm: number;
      kode: string;
      berat_mentah: number;
      harga_beli: number;
      harga_jual: number;
      namaBarangMentah: {
        id_bm: number;
        nama_barang_mentah: string;
        kode_barang: string;
      };
    };
  }>;
}

const PreviewPengadaan = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pengadaan, setPengadaan] = useState<PengadaanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(setPageTitle('Detail Pengadaan Barang Mentah'));

    if (!id) {
      Swal.fire('Error', 'ID Pengadaan tidak ditemukan', 'error');
      navigate('/apps/pengadaan');
      return;
    }

    fetchPengadaanDetail(id);
  }, [dispatch, id, navigate]);

  const fetchPengadaanDetail = async (pengadaanId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token tidak ditemukan', 'error');
        return;
      }

      const response = await fetch(buildApiUrl(`pengadaan-barang-mentah/${pengadaanId}`), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        setPengadaan(result.data);
      } else {
        throw new Error('Gagal mengambil data pengadaan');
      }
    } catch (error: any) {
      console.error('Error fetching pengadaan detail:', error);
      Swal.fire('Error', error.message || 'Gagal mengambil data pengadaan', 'error');
      navigate('/apps/pengadaan');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    const cleanValue = amount % 1 === 0 ? Math.floor(amount) : amount;
    return `Rp ${cleanValue.toLocaleString('id-ID')}`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'selesai': 'badge-success',
      'proses': 'badge-warning',
      'belum di bayar': 'badge-danger',
      'dibatalkan': 'badge-secondary'
    };
    return badges[status as keyof typeof badges] || 'badge-primary';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'selesai': 'Selesai',
      'proses': 'Proses',
      'belum di bayar': 'Belum Dibayar',
      'dibatalkan': 'Dibatalkan'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pengadaan) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Data tidak ditemukan</h3>
          <Link to="/apps/pengadaan" className="btn btn-primary">
            Kembali ke List
          </Link>
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
              <IconEye className="ltr:mr-2 rtl:ml-2" />
              <h2 className="text-xl font-semibold">Detail Pengadaan Barang Mentah</h2>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              No. Pemesanan: <span className="font-semibold">{pengadaan.no_pemesanan}</span>
            </p>
          </div>
          <div className="lg:w-1/2 w-full lg:max-w-fit flex gap-3">
            <Link to="/apps/pengadaan" className="btn btn-outline-primary">
              <IconArrowLeft className="ltr:mr-2 rtl:ml-2" />
              Kembali ke List
            </Link>
            <Link to={`/apps/pengadaan/edit/${pengadaan.id_pemesanan}`} className="btn btn-warning">
              <IconEdit className="ltr:mr-2 rtl:ml-2" />
              Edit
            </Link>
          </div>
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

        {/* Pengadaan Information */}
        <div className="px-4 mb-8">
          <h3 className="text-lg font-semibold mb-4">Informasi Pengadaan</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Supplier
                </label>
                <p className="text-base font-semibold">{pengadaan.kontak.nama}</p>
                {pengadaan.kontak.no_telp && (
                  <p className="text-sm text-gray-600">{pengadaan.kontak.no_telp}</p>
                )}
                {pengadaan.kontak.alamat && (
                  <p className="text-sm text-gray-600">{pengadaan.kontak.alamat}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Status
                </label>
                <span className={`badge ${getStatusBadge(pengadaan.status)}`}>
                  {getStatusText(pengadaan.status)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Tanggal Transaksi
                </label>
                <p className="text-base">{formatDate(pengadaan.tgl_transaksi)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Total Harga
                </label>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(pengadaan.total_harga)}
                </p>
              </div>
            </div>
          </div>

          {pengadaan.deskripsi && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Deskripsi
              </label>
              <p className="text-base bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {pengadaan.deskripsi}
              </p>
            </div>
          )}
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

        {/* Detail Barang */}
        <div className="px-4">
          <h3 className="text-lg font-semibold mb-4">Detail Barang Mentah</h3>
          
          <div className="table-responsive">
            <table className="table-hover">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Barang</th>
                  <th>Kode</th>
                  <th>Berat (kg)</th>
                  <th>Harga Satuan</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pengadaan.detailPengadaan.map((detail, index) => (
                  <tr key={detail.id_dpemesananb}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="font-semibold">
                        {detail.barangMentah.namaBarangMentah.nama_barang_mentah}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-outline-info">
                        {detail.barangMentah.kode}
                      </span>
                    </td>
                    <td>{Math.round(detail.berat).toLocaleString('id-ID')} kg</td>
                    <td>{formatCurrency(detail.barangMentah.harga_beli)}</td>
                    <td className="font-semibold">
                      {formatCurrency(detail.berat * detail.barangMentah.harga_beli)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td colSpan={5} className="text-right font-bold">
                    Total Keseluruhan:
                  </td>
                  <td className="font-bold text-lg text-primary">
                    {formatCurrency(pengadaan.total_harga)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

        {/* Metadata */}
        <div className="px-4">
          <h3 className="text-lg font-semibold mb-4">Informasi Sistem</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Dibuat pada
              </label>
              <p>{formatDate(pengadaan.created_at)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Terakhir diupdate
              </label>
              <p>{formatDate(pengadaan.updated_at)}</p>
            </div>
          </div>
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

        {/* Action Buttons */}
        <div className="px-4 flex justify-end gap-3">
          <Link to="/apps/pengadaan" className="btn btn-outline-primary">
            <IconArrowLeft className="ltr:mr-2 rtl:ml-2" />
            Kembali ke List
          </Link>
          <Link to={`/apps/pengadaan/edit/${pengadaan.id_pemesanan}`} className="btn btn-warning">
            <IconEdit className="ltr:mr-2 rtl:ml-2" />
            Edit Pengadaan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PreviewPengadaan;