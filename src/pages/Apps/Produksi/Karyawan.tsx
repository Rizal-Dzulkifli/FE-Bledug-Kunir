import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../../contexts/AuthContext';
import UpdateBeratModal from '../../../components/UpdateBeratModal';

interface BahanMentah {
    nama: string;
    berat: number;
    satuan: string;
}

interface ProdukInfo {
    nama: string;
    kode: string;
    mode: 'existing_product' | 'new_product';
    target_berat: number;
    target_harga: number;
}

interface MyDetail {
    id_dproduksi: number;
    berat_hasil: number | null;
    gaji_total: number | null;
    asset: {
        nama: string;
        id_asset: number;
    };
}

interface ProgressBerat {
    target: number;
    hasil: number;
    persentase: number;
}

interface ProduksiKaryawan {
    id_produksi: number;
    kode_produksi: string;
    status_produksi: 'belum produksi' | 'sedang produksi' | 'telat produksi' | 'selesai';
    tgl_produksi: string | null;
    tgl_tenggat: string;
    deskripsi: string;
    my_detail: MyDetail | null;
    produk_info: ProdukInfo;
    bahan_mentah: BahanMentah[];
    total_karyawan: number;
    progress_berat: ProgressBerat;
}

interface ApiResponse {
    message: string;
    data: {
        data: ProduksiKaryawan[];
        meta: {
            total: number;
            current_page: number;
            per_page: number;
        };
    };
}

const ProduksiKaryawan = () => {
    const { state } = useAuth();
    const navigate = useNavigate();
    const [produksiList, setProduksiList] = useState<ProduksiKaryawan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [updateModal, setUpdateModal] = useState<{
        isOpen: boolean;
        produksi: ProduksiKaryawan | null;
    }>({ isOpen: false, produksi: null });

    useEffect(() => {
        fetchProduksiKaryawan();
    }, [searchTerm, statusFilter]);

    const fetchProduksiKaryawan = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Token tidak ditemukan, silakan login kembali');
                return;
            }

            // Buat URL dengan query parameters
            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('limit', '10');
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`http://localhost:3333/api/karyawan/produksi?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Sesi telah berakhir, silakan login kembali');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: ApiResponse = await response.json();
            console.log('Dashboard Karyawan - Data received:', result.data.data);
            setProduksiList(result.data.data);
        } catch (error) {
            console.error('Error fetching produksi:', error);
            setError('Gagal memuat data produksi. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sedang produksi':
                return 'text-info bg-info/20';
            case 'selesai':
                return 'text-success bg-success/20';
            case 'belum produksi':
                return 'text-warning bg-warning/20';
            case 'telat produksi':
                return 'text-danger bg-danger/20';
            default:
                return 'text-gray-500 bg-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'sedang produksi':
                return 'Sedang Produksi';
            case 'selesai':
                return 'Selesai';
            case 'belum produksi':
                return 'Belum Dimulai';
            case 'telat produksi':
                return 'Terlambat';
            default:
                return status;
        }
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'bg-success';
        if (progress >= 75) return 'bg-info';
        if (progress >= 50) return 'bg-warning';
        return 'bg-danger';
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString || dateString === 'null' || dateString === '') return 'Belum dimulai';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Belum dimulai';
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            });
        } catch (error) {
            return 'Belum dimulai';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleUpdateBerat = async (berat: number) => {
        if (!updateModal.produksi?.my_detail) {
            throw new Error('Detail produksi tidak ditemukan');
        }

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        const response = await fetch(`http://localhost:3333/api/karyawan/produksi/detail/${updateModal.produksi.my_detail.id_dproduksi}/berat-hasil`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ berat_hasil: berat }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal mengupdate berat hasil');
        }

        // Refresh data setelah update
        await fetchProduksiKaryawan();
    };

    const openUpdateModal = (produksi: ProduksiKaryawan) => {
        setUpdateModal({ isOpen: true, produksi });
    };

    const closeUpdateModal = () => {
        setUpdateModal({ isOpen: false, produksi: null });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="eos-icons:loading" width="3rem" height="3rem" className="animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading produksi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="solar:danger-circle-bold-duotone" width="3rem" height="3rem" className="mx-auto mb-4 text-danger" />
                    <p className="text-danger text-lg font-medium mb-2">Terjadi Kesalahan</p>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={fetchProduksiKaryawan}
                        className="btn btn-primary"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-white-light w-12 h-12 rounded-md flex items-center justify-center">
                        <Icon icon="solar:widget-add-bold-duotone" width="24" height="24" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Produksi Bubuk Saya</h1>
                        <p className="text-gray-600">Selamat datang, {state.user?.nama} - Produksi barang mentah menjadi produk bubuk yang Anda ikuti</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                    <Icon icon="solar:user-bold-duotone" width="20" height="20" className="text-primary" />
                    <span className="text-primary font-medium">Karyawan Produksi</span>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Icon icon="solar:magnifer-linear" width="20" height="20" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari produksi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select"
                >
                    <option value="">Semua Status</option>
                    <option value="belum produksi">Belum Dimulai</option>
                    <option value="sedang produksi">Sedang Produksi</option>
                    <option value="telat produksi">Terlambat</option>
                    <option value="selesai">Selesai</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100">Total Produksi</p>
                            <p className="text-2xl font-bold">{produksiList.length}</p>
                        </div>
                        <Icon icon="solar:widget-2-bold-duotone" width="2.5rem" height="2.5rem" className="text-blue-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100">Selesai</p>
                            <p className="text-2xl font-bold">{produksiList.filter(p => p.status_produksi === 'selesai').length}</p>
                        </div>
                        <Icon icon="solar:check-circle-bold-duotone" width="2.5rem" height="2.5rem" className="text-green-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100">Sedang Produksi</p>
                            <p className="text-2xl font-bold">{produksiList.filter(p => p.status_produksi === 'sedang produksi').length}</p>
                        </div>
                        <Icon icon="solar:play-circle-bold-duotone" width="2.5rem" height="2.5rem" className="text-orange-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100">Terlambat</p>
                            <p className="text-2xl font-bold">{produksiList.filter(p => p.status_produksi === 'telat produksi').length}</p>
                        </div>
                        <Icon icon="solar:danger-triangle-bold-duotone" width="2.5rem" height="2.5rem" className="text-red-200" />
                    </div>
                </div>
            </div>

            {/* Produksi Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {produksiList.map((produksi) => (
                    <div key={produksi.id_produksi} className="panel p-0 border-0 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-white-light dark:border-[#1b2e4b]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-primary">{produksi.kode_produksi}</h3>
                                <div className="text-xs text-gray-500">
                                    ID: {produksi.id_produksi}
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{produksi.produk_info.nama}</h4>
                            
                            {/* Status Badge yang lebih prominent */}
                            <div className="mb-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(produksi.status_produksi)}`}>
                                    <Icon icon={
                                        produksi.status_produksi === 'selesai' ? 'solar:check-circle-bold' :
                                        produksi.status_produksi === 'sedang produksi' ? 'solar:play-circle-bold' :
                                        produksi.status_produksi === 'telat produksi' ? 'solar:danger-triangle-bold' :
                                        'solar:clock-circle-bold'
                                    } width="16" height="16" className="mr-1" />
                                    {getStatusText(produksi.status_produksi)}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-1">
                                    <Icon icon="solar:calendar-bold-duotone" width="16" height="16" />
                                    <span>Mulai: {formatDate(produksi.tgl_produksi)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Icon icon="solar:calendar-mark-bold-duotone" width="16" height="16" />
                                    <span>Deadline: {formatDate(produksi.tgl_tenggat)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                        
                            {/* <div className="mb-4 flex items-center gap-2">
                                <Icon icon="solar:clipboard-text-bold-duotone" width="16" height="16" className="text-primary" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(produksi.status_produksi)}`}>
                                    {getStatusText(produksi.status_produksi)}
                                </span>
                            </div>

                         
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress Berat Hasil</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{produksi.progress_berat.persentase}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                                    <div 
                                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(produksi.progress_berat.persentase)}`}
                                        style={{ width: `${produksi.progress_berat.persentase}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>{produksi.progress_berat.hasil || 0}kg / {produksi.progress_berat.target || 0}kg</span>
                                    <span>Target: {produksi.progress_berat.target || 0}kg</span>
                                </div>
                            </div> */}

                            {/* Bahan Mentah */}
                            <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bahan Mentah:</h5>
                                <div className="flex flex-wrap gap-2">
                                    {produksi.bahan_mentah.map((bahan, index) => (
                                        <span key={index} className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                                            {bahan.nama}: {bahan.berat}{bahan.satuan}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* My Assignment */}
                            {produksi.my_detail && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300">Hasil Saya:</h5>
                                        {(produksi.status_produksi === 'sedang produksi' || produksi.status_produksi === 'telat produksi') && (
                                            <button
                                                onClick={() => openUpdateModal(produksi)}
                                                className="btn btn-sm btn-primary"
                                            >
                                                <Icon icon="solar:pen-new-square-bold-duotone" width="16" height="16" className="mr-1" />
                                                Update Hasil
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-blue-600 dark:text-blue-400">Berat Hasil:</span>
                                            <p className="font-bold text-blue-800 dark:text-blue-200">
                                                {produksi.my_detail.berat_hasil ? `${produksi.my_detail.berat_hasil}kg` : 'Belum input'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-blue-600 dark:text-blue-400">Asset:</span>
                                            <p className="font-bold text-blue-800 dark:text-blue-200">{produksi.my_detail.asset?.nama || 'Belum ditentukan'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-blue-600 dark:text-blue-400">Gaji:</span>
                                        <p className="font-bold text-blue-800 dark:text-blue-200">
                                            {produksi.my_detail.gaji_total ? formatCurrency(produksi.my_detail.gaji_total) : 'Rp 0'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon icon="solar:target-bold-duotone" width="16" height="16" className="text-blue-500" />
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Target Harga</span>
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {produksi.produk_info.target_harga ? formatCurrency(produksi.produk_info.target_harga) : 'Rp 0'}/kg
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon icon="solar:users-group-two-rounded-bold-duotone" width="16" height="16" className="text-green-500" />
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tim</span>
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white">{produksi.total_karyawan} karyawan</p>
                                </div>
                            </div>

                            {/* Deskripsi */}
                            {produksi.deskripsi && (
                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border-l-4 border-green-500 mb-4">
                                    <div className="flex items-start gap-2">
                                        <Icon icon="solar:note-bold-duotone" width="16" height="16" className="text-green-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Deskripsi:</p>
                                            <p className="text-sm text-green-800 dark:text-green-200">{produksi.deskripsi}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <button
                                    onClick={() => navigate(`/apps/produksi/karyawan/${produksi.id_produksi}`)}
                                    className="flex-1 btn btn-outline-primary btn-sm"
                                >
                                    <Icon icon="solar:eye-bold-duotone" width="16" height="16" className="mr-1" />
                                    Lihat Detail
                                </button>
                                {(produksi.status_produksi === 'sedang produksi' || produksi.status_produksi === 'telat produksi') && produksi.my_detail && (
                                    <button
                                        onClick={() => openUpdateModal(produksi)}
                                        className="flex-1 btn btn-primary btn-sm"
                                    >
                                        <Icon icon="solar:pen-new-square-bold-duotone" width="16" height="16" className="mr-1" />
                                        Update Hasil
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {produksiList.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Icon icon="solar:widget-add-bold-duotone" width="4rem" height="4rem" className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 text-lg">Belum ada produksi yang Anda ikuti</p>
                    <p className="text-gray-500 text-sm mt-2">Produksi baru akan muncul di sini ketika Anda ditugaskan</p>
                </div>
            )}

            {/* Update Berat Modal */}
            <UpdateBeratModal
                isOpen={updateModal.isOpen}
                onClose={closeUpdateModal}
                onSubmit={handleUpdateBerat}
                currentBerat={updateModal.produksi?.my_detail?.berat_hasil || null}
                produksiKode={updateModal.produksi?.kode_produksi || ''}
            />
        </div>
    );
};

export default ProduksiKaryawan;