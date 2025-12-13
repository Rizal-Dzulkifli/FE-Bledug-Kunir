import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import IconEye from '../../../components/Icon/IconEye';
import IconEdit from '../../../components/Icon/IconEdit';
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
  berat?: number; // dalam gram dari database
  stok?: number; // untuk produk dalam pcs
  harga_satuan: number;
  subtotal: number;
  catatan?: string;
  barangMentah?: BarangMentah;
  produk?: Produk;
}

interface PesananDetail {
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

const PreviewPesanan = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pesanan, setPesanan] = useState<PesananDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(setPageTitle('Detail Pesanan'));

    if (!id) {
      Swal.fire('Error', 'ID Pesanan tidak ditemukan', 'error');
      navigate('/apps/pesanan');
      return;
    }

    fetchPesananDetail(id);
  }, [dispatch, id, navigate]);

  const fetchPesananDetail = async (pesananId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token tidak ditemukan', 'error');
        return;
      }

      const response = await fetch(buildApiUrl(`pesanan/${pesananId}`), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        setPesanan(result.data);
      } else {
        throw new Error('Gagal mengambil data pesanan');
      }
    } catch (error: any) {
      console.error('Error fetching pesanan detail:', error);
      Swal.fire('Error', error.message || 'Gagal mengambil data pesanan', 'error');
      navigate('/apps/pesanan');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'Menunggu': 'badge-warning',
      'Diproses': 'badge-info',
      'Dikirim': 'badge-primary',
      'Selesai': 'badge-success',
      'Dibatalkan': 'badge-danger',
      'Belum Dibayar': 'badge-danger',
      'DP': 'badge-warning',
      'Sudah Dibayar': 'badge-success',
      'Lunas': 'badge-success',
      'Dijemput': 'badge-info'
    };
    return badges[status as keyof typeof badges] || 'badge-primary';
  };

  const getStatusText = (status: string) => {
    return status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pesanan) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Data tidak ditemukan</h3>
          <Link to="/apps/pesanan" className="btn btn-primary">
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
              <h2 className="text-xl font-semibold">Detail Pesanan</h2>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              No. Pesanan: <span className="font-semibold">{pesanan.no_pesanan}</span>
            </p>
          </div>
          <div className="lg:w-1/2 w-full lg:max-w-fit flex gap-3">
            <Link to="/apps/pesanan" className="btn btn-outline-primary">
              <IconArrowLeft className="ltr:mr-2 rtl:ml-2" />
              Kembali ke List
            </Link>
            <Link to={`/apps/pesanan/edit/${pesanan.id_pesanan}`} className="btn btn-warning">
              <IconEdit className="ltr:mr-2 rtl:ml-2" />
              Edit
            </Link>
          </div>
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

        {/* Pesanan Information */}
        <div className="px-4 mb-8">
          <h3 className="text-lg font-semibold mb-4">Informasi Pesanan</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Pelanggan
                </label>
                <p className="text-base font-semibold">{pesanan.pelanggan?.nama || '-'}</p>
                {pesanan.pelanggan?.no_telp && (
                  <p className="text-sm text-gray-600">{pesanan.pelanggan.no_telp}</p>
                )}
                {pesanan.pelanggan?.alamat && (
                  <p className="text-sm text-gray-600">{pesanan.pelanggan.alamat}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Status Pemesanan
                </label>
                <span className={`badge ${getStatusBadge(pesanan.status_pemesanan)}`}>
                  {getStatusText(pesanan.status_pemesanan)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Status Pembayaran
                </label>
                <span className={`badge ${getStatusBadge(pesanan.status_pembayaran)}`}>
                  {getStatusText(pesanan.status_pembayaran)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Tanggal Pesanan
                </label>
                <p className="text-base">{formatDate(pesanan.tgl_pesanan)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Mode Pengiriman
                </label>
                <span className={`badge ${getStatusBadge(pesanan.mode_pengiriman)}`}>
                  {getStatusText(pesanan.mode_pengiriman)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Total Harga
                </label>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(pesanan.total_harga || 0)}
                </p>
              </div>
            </div>
          </div>

          {pesanan.deskripsi && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Deskripsi
              </label>
              <p className="text-base bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {pesanan.deskripsi}
              </p>
            </div>
          )}
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

        {/* Detail Barang */}
        <div className="px-4">
          <h3 className="text-lg font-semibold mb-4">Detail Barang Pesanan</h3>
          
          <div className="table-responsive">
            <table className="table-hover">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Jenis Barang</th>
                  <th>Nama Barang</th>
                  <th>Kode</th>
                  <th>Kuantitas</th>
                  <th>Harga Satuan</th>
                  <th>Subtotal</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {(pesanan.detailPesanan || []).length > 0 ? (
                  (pesanan.detailPesanan || []).map((detail, index) => (
                    <tr key={detail.id_detail_pesanan || index}>
                      <td>{index + 1}</td>
                      <td>
                        <span className={`badge ${detail.jenis_barang === 'barang_mentah' ? 'badge-outline-warning' : 'badge-outline-info'}`}>
                          {detail.jenis_barang === 'barang_mentah' ? 'Barang Mentah' : 'Produk'}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold">
                          {detail.jenis_barang === 'barang_mentah' 
                            ? detail.barangMentah?.namaBarangMentah?.nama_barang_mentah || 'Nama tidak tersedia'
                            : detail.produk?.namaProduk?.nama_produk || 'Nama tidak tersedia'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline-info">
                          {detail.jenis_barang === 'barang_mentah' 
                            ? detail.barangMentah?.kode || '-'
                            : detail.produk?.kode || '-'}
                        </span>
                      </td>
                      <td>
                        {detail.jenis_barang === 'barang_mentah' 
                          ? (() => {
                              const beratGram = detail.berat || 0;
                              return `${beratGram.toLocaleString('id-ID')} kg`;
                            })()
                          : `${(detail.stok || 0).toLocaleString('id-ID')} pcs`
                        }
                      </td>
                      <td>{formatCurrency(detail.harga_satuan || 0)}</td>
                      <td className="font-semibold">
                        {formatCurrency(detail.subtotal || 0)}
                      </td>
                      <td>
                        {detail.catatan ? (
                          <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            {detail.catatan}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      Tidak ada detail barang pesanan
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td colSpan={6} className="text-right font-bold">
                    Total Keseluruhan:
                  </td>
                  <td className="font-bold text-lg text-primary">
                    {formatCurrency(pesanan.total_harga || 0)}
                  </td>
                  <td></td>
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
              <p>{formatDate(pesanan.created_at)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Terakhir diupdate
              </label>
              <p>{formatDate(pesanan.updated_at)}</p>
            </div>
          </div>
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

        {/* Action Buttons */}
        <div className="px-4 flex justify-end gap-3">
          <Link to="/apps/pesanan" className="btn btn-outline-primary">
            <IconArrowLeft className="ltr:mr-2 rtl:ml-2" />
            Kembali ke List
          </Link>
          <Link to={`/apps/pesanan/edit/${pesanan.id_pesanan}`} className="btn btn-warning">
            <IconEdit className="ltr:mr-2 rtl:ml-2" />
            Edit Pesanan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PreviewPesanan;