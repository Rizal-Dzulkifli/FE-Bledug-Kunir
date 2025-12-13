import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import IconEye from '../../../components/Icon/IconEye';

// Interface untuk data produksi
interface ProduksiDetail {
    id_produksi: number;
    id_pemesanan: number | null;
    mode_produksi: 'existing_product' | 'new_product';
    id_produk_detail: number;
    id_nama_produk: number;
    berat_produk_target: number | null;
    harga_jual_target: string;
    deskripsi_produk: string | null;
    tgl_produksi: string;
    tgl_tenggat: string;
    stok_hasil: number;
    berat_hasil: number;
    deskripsi: string | null;
    status_produksi: string;
    kode_produksi: string;
    created_at: string;
    updated_at: string;
    namaProduk: {
        id_produk: number;
        nama_produk: string;
        kode_produk: string;
        created_at: string;
        updated_at: string;
    };
    produk: {
        id_produk_detail: number;
        id_produk: number;
        kode: string;
        berat_produk: number;
        harga_jual: string;
        stok: number;
        deskripsi: string;
        created_at: string;
        updated_at: string;
        namaProduk: {
            id_produk: number;
            nama_produk: string;
            kode_produk: string;
            created_at: string;
            updated_at: string;
        };
    };
    detailProduksi: Array<{
        id_dproduksi: number;
        id_produksi: number;
        id_user: number;
        id_asset: number;
        berat_hasil: number;
        gaji_total: string;
        created_at: string;
        updated_at: string;
        user: {
            user_id: number;
            email: string;
            nama: string;
            role: string;
            activation_token: string;
            status: string;
            created_at: string;
            updated_at: string;
        };
        asset: {
            id_asset: number;
            asset: string;
            created_at: string;
            updated_at: string;
        };
    }>;
    detailBahan: Array<{
        id_detailbahan: number;
        id_barangmentah: number;
        id_produksi: number;
        berat: number;
        totalharga_barangmentah: string;
        created_at: string;
        updated_at: string;
        barangMentah: {
            id_barangmentah: number;
            id_bm: number;
            kode: string;
            berat_mentah: number;
            harga_beli: string;
            harga_jual: string;
            created_at: string;
            updated_at: string;
            namaBarangMentah: {
                id_bm: number;
                nama_barang_mentah: string;
                kode_barang: string;
                created_at: string;
                updated_at: string;
            };
        };
    }>;
}

const Preview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [produksiData, setProduksiData] = useState<ProduksiDetail | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Preview Produksi'));
        if (id) {
            loadProduksiDetail(id);
        }
    }, [id]);

    const loadProduksiDetail = async (produksiId: string) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl(`produksi/${produksiId}`), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Produksi Detail:', result.data);
                setProduksiData(result.data);
            } else {
                throw new Error('Failed to fetch produksi detail');
            }
        } catch (error) {
            console.error('Error loading produksi detail:', error);
            Swal.fire('Error', 'Gagal memuat detail produksi', 'error');
            navigate('/apps/produksi');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('id-ID');
        } catch (error) {
            return '-';
        }
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleString('id-ID');
        } catch (error) {
            return '-';
        }
    };

    const formatCurrency = (amount: string | number) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(numAmount);
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'belum produksi':
                return 'badge badge-outline-secondary';
            case 'sedang produksi':
                return 'badge badge-outline-primary';
            case 'telat produksi':
                return 'badge badge-outline-danger';
            case 'selesai':
                return 'badge badge-outline-success';
            default:
                return 'badge badge-outline-secondary';
        }
    };

    const getModeBadge = (mode: string) => {
        return mode === 'new_product' 
            ? 'badge badge-outline-info' 
            : 'badge badge-outline-warning';
    };

    const getModeText = (mode: string) => {
        return mode === 'new_product' ? 'Produk Baru' : 'Produk Existing';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!produksiData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Data tidak ditemukan</h3>
                    <Link to="/apps/produksi" className="btn btn-primary mt-4">
                        <IconArrowLeft className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                        Kembali ke Daftar
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <IconEye className="w-5 h-5" />
                    <h2 className="text-xl font-semibold">Preview Produksi</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/apps/produksi" className="btn btn-outline-primary">
                        <IconArrowLeft className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                        Kembali
                    </Link>
                    <Link 
                        to={`/apps/produksi/edit/${produksiData.id_produksi}`}
                        className="btn btn-warning"
                    >
                        Edit Produksi
                    </Link>
                </div>
            </div>

            <div className="panel">
                {/* Header Informasi */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Informasi Produksi</h3>
                        <div className="flex items-center gap-2">
                            <span className={getStatusBadge(produksiData.status_produksi)}>
                                {produksiData.status_produksi}
                            </span>
                            <span className={getModeBadge(produksiData.mode_produksi)}>
                                {getModeText(produksiData.mode_produksi)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Kode Produksi</label>
                            <p className="font-semibold text-lg">{produksiData.kode_produksi}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Tanggal Produksi</label>
                            <p className="font-medium">{formatDate(produksiData.tgl_produksi)}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Tanggal Tenggat</label>
                            <p className="font-medium">{formatDate(produksiData.tgl_tenggat)}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Berat Hasil</label>
                            <p className="font-medium">{produksiData.berat_hasil} kg</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Stok Hasil</label>
                            <p className="font-medium">{produksiData.stok_hasil} unit</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Harga Jual Target</label>
                            <p className="font-medium">{formatCurrency(produksiData.harga_jual_target)}</p>
                        </div>
                    </div>

                    {produksiData.deskripsi && (
                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Deskripsi</label>
                            <p className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                {produksiData.deskripsi}
                            </p>
                        </div>
                    )}
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                {/* Informasi Produk */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Informasi Produk</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nama Produk</label>
                                <p className="font-medium">{produksiData.namaProduk?.nama_produk || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Kode Produk</label>
                                <p className="font-medium">{produksiData.produk?.kode || produksiData.namaProduk?.kode_produk || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {produksiData.produk && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Berat Produk</label>
                                        <p className="font-medium">{produksiData.produk?.berat_produk || 'N/A'} kg</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Harga Jual Produk</label>
                                        <p className="font-medium">{produksiData.produk?.harga_jual ? formatCurrency(produksiData.produk.harga_jual) : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Stok Produk</label>
                                        <p className="font-medium">{produksiData.produk?.stok || 'N/A'} unit</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                {/* Detail Bahan */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Detail Bahan Baku</h3>
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kode Barang</th>
                                    <th>Nama Barang Mentah</th>
                                    <th>Berat Digunakan</th>
                                    <th>Harga Beli</th>
                                    <th>Total Harga</th>
                                    <th>Sisa Stok</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produksiData.detailBahan.map((item, index) => (
                                    <tr key={item.id_detailbahan}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <span className="font-medium">{item.barangMentah.kode}</span>
                                        </td>
                                        <td>
                                            <div>
                                                <div className="font-medium">{item.barangMentah.namaBarangMentah?.nama_barang_mentah || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{item.barangMentah.namaBarangMentah?.kode_barang || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td>{item.berat} kg</td>
                                        <td>{formatCurrency(item.barangMentah.harga_beli)}</td>
                                        <td>
                                            <span className="font-semibold text-success">
                                                {formatCurrency(item.totalharga_barangmentah)}
                                            </span>
                                        </td>
                                        <td>{item.barangMentah.berat_mentah} kg</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50 dark:bg-gray-800 font-semibold">
                                    <td colSpan={5} className="text-right">Total Biaya Bahan Baku:</td>
                                    <td className="text-success">
                                        {formatCurrency(
                                            produksiData.detailBahan.reduce((sum, item) => 
                                                sum + parseFloat(item.totalharga_barangmentah), 0
                                            )
                                        )}
                                    </td>
                                    <td>-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                {/* Detail Produksi (Karyawan) */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Detail Produksi (Karyawan)</h3>
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Nama Karyawan</th>
                                    <th>Email</th>
                                    <th>Asset/Mesin</th>
                                    <th>Berat Hasil</th>
                                    <th>Gaji Total</th>
                                    {/* <th>Status</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {produksiData.detailProduksi.map((item, index) => (
                                    <tr key={item.id_dproduksi}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div>
                                                <div className="font-medium">{item.user.nama}</div>
                                                <div className="text-xs text-gray-500 capitalize">{item.user.role}</div>
                                            </div>
                                        </td>
                                        <td>{item.user.email}</td>
                                        <td>
                                            <span className="font-medium">{item.asset.asset}</span>
                                        </td>
                                        <td>{item.berat_hasil} kg</td>
                                        <td>
                                            <span className="font-semibold text-primary">
                                                {formatCurrency(item.gaji_total)}
                                            </span>
                                        </td>
                                        {/* <td>
                                            <span className={`badge ${
                                                item.user.status === 'active' ? 'badge-outline-success' : 
                                                item.user.status === 'pending' ? 'badge-outline-warning' :
                                                'badge-outline-secondary'
                                            }`}>
                                                {item.user.status}
                                            </span>
                                        </td> */}
                                    </tr>
                                ))}
                                <tr className="bg-gray-50 dark:bg-gray-800 font-semibold">
                                    <td colSpan={4} className="text-right">Total Berat Hasil:</td>
                                    <td>
                                        {produksiData.detailProduksi.reduce((sum, item) => sum + item.berat_hasil, 0)} kg
                                    </td>
                                    <td className="text-primary">
                                        {formatCurrency(
                                            produksiData.detailProduksi.reduce((sum, item) => 
                                                sum + parseFloat(item.gaji_total), 0
                                            )
                                        )}
                                    </td>
                             
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                {/* Summary/Ringkasan */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Ringkasan Produksi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-primary-light dark:bg-primary/10 p-4 rounded-lg">
                            <div className="text-primary font-semibold text-sm">Total Biaya Bahan</div>
                            <div className="text-lg font-bold text-primary">
                                {formatCurrency(
                                    produksiData.detailBahan.reduce((sum, item) => 
                                        sum + parseFloat(item.totalharga_barangmentah), 0
                                    )
                                )}
                            </div>
                        </div>
                        <div className="bg-success-light dark:bg-success/10 p-4 rounded-lg">
                            <div className="text-success font-semibold text-sm">Total Gaji Karyawan</div>
                            <div className="text-lg font-bold text-success">
                                {formatCurrency(
                                    produksiData.detailProduksi.reduce((sum, item) => 
                                        sum + parseFloat(item.gaji_total), 0
                                    )
                                )}
                            </div>
                        </div>
                        <div className="bg-warning-light dark:bg-warning/10 p-4 rounded-lg">
                            <div className="text-warning font-semibold text-sm">Total Berat Hasil</div>
                            <div className="text-lg font-bold text-warning">
                                {produksiData.detailProduksi.reduce((sum, item) => sum + item.berat_hasil, 0)} kg
                            </div>
                        </div>
                        {/* <div className="bg-info-light dark:bg-info/10 p-4 rounded-lg">
                            <div className="text-info font-semibold text-sm">Estimasi Pendapatan</div>
                            <div className="text-lg font-bold text-info">
                                {formatCurrency(
                                    produksiData.detailProduksi.reduce((sum, item) => sum + item.berat_hasil, 0) * 
                                    parseFloat(produksiData.harga_jual_target)
                                )}
                            </div>
                        </div> */}
                    </div>
                </div>

                {/* Metadata */}
                <div className="border-t border-white-light dark:border-[#1b2e4b] pt-6">
                    <h4 className="font-semibold mb-2 text-gray-600 dark:text-gray-400">Metadata</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Dibuat:</span>
                            <span className="ml-2">{formatDateTime(produksiData.created_at)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Diperbarui:</span>
                            <span className="ml-2">{formatDateTime(produksiData.updated_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preview;
