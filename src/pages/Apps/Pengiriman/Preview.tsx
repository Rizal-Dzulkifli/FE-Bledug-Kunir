import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import IconEdit from '../../../components/Icon/IconEdit';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../../contexts/AuthContext';
import PengirimanService, { Pengiriman } from '../../../services/PengirimanService';

const PreviewPengiriman = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { state } = useAuth();
    const [pengiriman, setPengiriman] = useState<Pengiriman | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Detail Pengiriman'));

        if (!id) {
            Swal.fire('Error', 'ID Pengiriman tidak ditemukan', 'error');
            navigate('/apps/pengiriman');
            return;
        }

        fetchPengirimanDetail(id);
    }, [dispatch, id, navigate]);

    const fetchPengirimanDetail = async (pengirimanId: string) => {
        try {
            setLoading(true);
            const response = await PengirimanService.getPengirimanById(parseInt(pengirimanId));
            setPengiriman(response.data);
        } catch (error: any) {
            console.error('Error fetching pengiriman detail:', error);
            Swal.fire('Error', error.message || 'Gagal memuat detail pengiriman', 'error');
            navigate('/apps/pengiriman');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!pengiriman) return;

        const result = await Swal.fire({
            title: 'Hapus Pengiriman?',
            text: 'Pengiriman yang dihapus tidak dapat dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await PengirimanService.deletePengiriman(pengiriman.id);
                
                Swal.fire({
                    title: 'Terhapus!',
                    text: 'Pengiriman berhasil dihapus.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                navigate('/apps/pengiriman');
            } catch (error: any) {
                console.error('Error deleting pengiriman:', error);
                Swal.fire('Error', error.message || 'Gagal menghapus pengiriman', 'error');
            }
        }
    };

    const handleUpdateStatus = async (newStatus: 'Dalam Perjalanan' | 'Selesai' | 'Gagal') => {
        if (!pengiriman) return;

        try {
            const result = await Swal.fire({
                title: 'Konfirmasi',
                text: `Apakah Anda yakin ingin mengubah status menjadi "${newStatus}"?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya, Ubah',
                cancelButtonText: 'Batal',
                input: newStatus === 'Gagal' ? 'textarea' : undefined,
                inputPlaceholder: newStatus === 'Gagal' ? 'Masukkan alasan kegagalan...' : undefined,
                inputValidator: newStatus === 'Gagal' ? (value) => {
                    if (!value) {
                        return 'Alasan kegagalan harus diisi!'
                    }
                    return null
                } : undefined
            });

            if (result.isConfirmed) {
                await PengirimanService.updatePengiriman(pengiriman.id, {
                    status_pengiriman: newStatus,
                    catatan: result.value || undefined
                });
                
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Status pengiriman berhasil diubah',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                fetchPengirimanDetail(id!);
            }
        } catch (error: any) {
            console.error('Error updating status:', error);
            Swal.fire('Error', error.message || 'Gagal mengubah status pengiriman', 'error');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Dalam Perjalanan':
                return 'bg-info text-white px-3 py-1 rounded-full text-sm font-medium';
            case 'Selesai':
                return 'bg-success text-white px-3 py-1 rounded-full text-sm font-medium';
            case 'Gagal':
                return 'bg-danger text-white px-3 py-1 rounded-full text-sm font-medium';
            default:
                return 'bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium';
        }
    };

    const canEdit = () => {
        return state.user?.role === 'admin' || 
               (state.user?.role === 'driver' && pengiriman?.driver_id === state.user.user_id);
    };

    const canDelete = () => {
        return state.user?.role === 'admin' && pengiriman?.status_pengiriman === 'Dalam Perjalanan';
    };

    const canUpdateStatus = () => {
        return (state.user?.role === 'admin' || 
                (state.user?.role === 'driver' && pengiriman?.driver_id === state.user.user_id)) &&
               pengiriman?.status_pengiriman === 'Dalam Perjalanan';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="eos-icons:loading" width="3rem" height="3rem" className="animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Memuat detail pengiriman...</p>
                </div>
            </div>
        );
    }

    if (!pengiriman) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="solar:close-circle-bold-duotone" width="4rem" height="4rem" className="mx-auto mb-4 text-danger" />
                    <p className="text-gray-600 text-lg">Pengiriman tidak ditemukan</p>
                    <Link to="/apps/pengiriman" className="btn btn-primary mt-4">
                        Kembali ke Daftar Pengiriman
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Link to="/apps/pengiriman" className="btn btn-outline-primary">
                        <IconArrowLeft className="w-4 h-4" />
                        Kembali
                    </Link>
                    <h2 className="text-xl font-semibold">Detail Pengiriman</h2>
                </div>

                <div className="flex items-center gap-2">
                    {canEdit() && (
                        <Link to={`/apps/pengiriman/edit/${pengiriman.id}`} className="btn btn-outline-warning">
                            <IconEdit className="w-4 h-4" />
                            Edit
                        </Link>
                    )}
                    {canDelete() && (
                        <button onClick={handleDelete} className="btn btn-outline-danger">
                            <IconTrashLines className="w-4 h-4" />
                            Hapus
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Info Pengiriman */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Informasi Pengiriman</h3>
                            <span className={getStatusBadge(pengiriman.status_pengiriman)}>
                                {pengiriman.status_pengiriman}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">ID Pengiriman</p>
                                    <p className="font-semibold">#PGR-{pengiriman.id.toString().padStart(4, '0')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Nomor Pesanan</p>
                                    <p className="font-semibold">{pengiriman.pesanan.no_pesanan}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Tanggal Pengiriman</p>
                                    <p className="font-semibold">{formatDate(pengiriman.tanggal_pengiriman)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Driver</p>
                                    <p className="font-semibold">{pengiriman.driver.nama}</p>
                                    <p className="text-sm text-gray-600">{pengiriman.driver.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Dibuat</p>
                                    <p className="font-semibold">{formatDateTime(pengiriman.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Terakhir Diupdate</p>
                                    <p className="font-semibold">{formatDateTime(pengiriman.updatedAt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Informasi Gaji Driver */}
                        <div className="mt-6 pt-4 border-t">
                            <h4 className="font-semibold mb-3 text-primary">Informasi Gaji Driver</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Gaji Per Pengiriman</p>
                                    <p className="font-semibold text-lg text-primary">{formatCurrency(pengiriman.gaji_driver)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status Pembayaran</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        pengiriman.gaji_dibayar 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {pengiriman.gaji_dibayar ? 'Sudah Dibayar' : 'Belum Dibayar'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {pengiriman.catatan && (
                            <div className="mt-6 pt-4 border-t">
                                <p className="text-sm text-gray-600 mb-1">Catatan</p>
                                <p className="text-gray-800">{pengiriman.catatan}</p>
                            </div>
                        )}
                    </div>

                    {/* Info Pesanan */}
                    <div className="panel">
                        <h3 className="text-lg font-semibold mb-4">Detail Pesanan</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Pelanggan</p>
                                    <p className="font-semibold">{pengiriman.pesanan.pelanggan.nama}</p>
                                    {pengiriman.pesanan.pelanggan.no_telp && (
                                        <p className="text-sm text-gray-600">{pengiriman.pesanan.pelanggan.no_telp}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Alamat Tujuan</p>
                                    <p className="font-medium">{pengiriman.pesanan.pelanggan.alamat}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Tanggal Pesanan</p>
                                    <p className="font-semibold">{formatDate(pengiriman.pesanan.tgl_pesanan)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Harga</p>
                                    <p className="font-semibold text-lg text-primary">
                                        {formatCurrency(pengiriman.pesanan.total_harga)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Items Pesanan */}
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-3">Items Pesanan</h4>
                            <div className="overflow-x-auto">
                                <table className="table-auto w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-2 text-left">Item</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pengiriman.pesanan.detailPesanan?.map((detail, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">
                                                            {detail.jenis_barang === 'barang_mentah' 
                                                                ? detail.barangMentah?.namaBarangMentah?.nama_barang_mentah 
                                                                : detail.produk?.namaProduk?.nama_produk
                                                            }
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Kode: {detail.jenis_barang === 'barang_mentah' 
                                                                ? detail.barangMentah?.kode 
                                                                : detail.produk?.kode
                                                            }
                                                        </p>
                                                    </div>
                                                </td>
                                                
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Panel */}
                <div className="lg:col-span-1">
                    <div className="panel">
                        <h3 className="text-lg font-semibold mb-4">Actions</h3>
                        
                        {canUpdateStatus() && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleUpdateStatus('Selesai')}
                                    className="btn btn-success w-full"
                                >
                                    <Icon icon="solar:check-circle-bold-duotone" width="16" height="16" />
                                    Tandai Selesai
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus('Gagal')}
                                    className="btn btn-danger w-full"
                                >
                                    <Icon icon="solar:close-circle-bold-duotone" width="16" height="16" />
                                    Tandai Gagal
                                </button>
                            </div>
                        )}

                        {pengiriman.status_pengiriman !== 'Dalam Perjalanan' && (
                            <div className="text-center py-4">
                                <Icon 
                                    icon={pengiriman.status_pengiriman === 'Selesai' ? 
                                        "solar:check-circle-bold-duotone" : "solar:close-circle-bold-duotone"
                                    } 
                                    width="48" 
                                    height="48" 
                                    className={pengiriman.status_pengiriman === 'Selesai' ? 
                                        "text-success mx-auto mb-2" : "text-danger mx-auto mb-2"
                                    } 
                                />
                                <p className="font-medium">
                                    Pengiriman {pengiriman.status_pengiriman === 'Selesai' ? 'Selesai' : 'Gagal'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Status History atau Info Tambahan bisa ditambahkan di sini */}
                </div>
            </div>
        </div>
    );
};

export default PreviewPengiriman;