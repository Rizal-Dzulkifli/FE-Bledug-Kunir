import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../../contexts/AuthContext';
import UpdateBeratModal from '../../../components/UpdateBeratModal';

interface BahanMentah {
    nama: string;
    berat: number;
    satuan: string;
}

interface ProdukTarget {
    nama: string;
    kode: string;
    berat_target: number;
    harga_target: number;
    deskripsi_produk: string | null;
}

interface MyAssignment {
    id_dproduksi: number;
    berat_hasil: number | null;
    gaji_total: number | null;
    asset: {
        nama: string;
        id_asset: number;
    };
}

interface Karyawan {
    nama: string;
    berat_hasil: number | null;
    status: string;
}

interface TeamInfo {
    total_karyawan: number;
    karyawan_list: Karyawan[];
}

interface Progress {
    total_berat_target: number;
    total_berat_hasil: number;
    persentase: number;
    status_completion: string;
}

interface ProduksiInfo {
    id_produksi: number;
    kode_produksi: string;
    status_produksi: string;
    tgl_produksi: string | null;
    tgl_tenggat: string;
    deskripsi: string | null;
    mode_produksi: string;
}

interface DetailProduksi {
    produksi_info: ProduksiInfo;
    produk_target: ProdukTarget;
    bahan_mentah: BahanMentah[];
    my_assignment: MyAssignment | null;
    team_info: TeamInfo;
    progress: Progress;
}

const DetailProduksiKaryawan = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { state } = useAuth();
    
    const [detail, setDetail] = useState<DetailProduksi | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updateModal, setUpdateModal] = useState<{
        isOpen: boolean;
        assignment: MyAssignment | null;
    }>({ isOpen: false, assignment: null });

    useEffect(() => {
        if (id) {
            fetchDetailProduksi();
        }
    }, [id]);

    const fetchDetailProduksi = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Token tidak ditemukan, silakan login kembali');
                return;
            }

            const response = await fetch(`http://localhost:3333/api/karyawan/produksi/${id}/detail`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setError('Produksi tidak ditemukan atau Anda tidak terlibat dalam produksi ini');
                    return;
                }
                if (response.status === 401) {
                    setError('Sesi telah berakhir, silakan login kembali');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setDetail(result.data);
        } catch (error) {
            console.error('Error fetching detail produksi:', error);
            setError('Gagal memuat detail produksi. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBerat = async (berat: number) => {
        if (!updateModal.assignment) {
            throw new Error('Assignment tidak ditemukan');
        }

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        const response = await fetch(`http://localhost:3333/api/karyawan/produksi/detail/${updateModal.assignment.id_dproduksi}/berat-hasil`, {
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
        await fetchDetailProduksi();
    };

    const openUpdateModal = (assignment: MyAssignment) => {
        setUpdateModal({ isOpen: true, assignment });
    };

    const closeUpdateModal = () => {
        setUpdateModal({ isOpen: false, assignment: null });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Belum dimulai';
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="eos-icons:loading" width="3rem" height="3rem" className="animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading detail produksi...</p>
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
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => navigate('/apps/produksi/karyawan')}
                            className="btn btn-outline-primary"
                        >
                            Kembali
                        </button>
                        <button 
                            onClick={fetchDetailProduksi}
                            className="btn btn-primary"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="text-center py-12">
                <Icon icon="solar:widget-add-bold-duotone" width="4rem" height="4rem" className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 text-lg">Detail produksi tidak ditemukan</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/apps/produksi/karyawan')}
                        className="btn btn-outline-primary"
                    >
                        <Icon icon="solar:arrow-left-bold-duotone" width="20" height="20" className="mr-2" />
                        Kembali
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{detail.produksi_info.kode_produksi}</h1>
                        <p className="text-gray-600">Detail produksi bubuk - {detail.produk_target.nama}</p>
                    </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(detail.produksi_info.status_produksi)}`}>
                    {getStatusText(detail.produksi_info.status_produksi)}
                </span>
            </div>

            {/* Main Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Produk Target */}
                <div className="panel">
                    <div className="mb-5">
                        <h5 className="font-semibold text-lg">Produk Target</h5>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-500">Nama Produk:</label>
                            <p className="font-semibold">{detail.produk_target.nama}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Kode:</label>
                            <p className="font-semibold">{detail.produk_target.kode}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Target Berat:</label>
                            <p className="font-semibold">{detail.produk_target.berat_target}kg</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Target Harga:</label>
                            <p className="font-semibold">{formatCurrency(detail.produk_target.harga_target)}/kg</p>
                        </div>
                        {detail.produk_target.deskripsi_produk && (
                            <div>
                                <label className="text-sm text-gray-500">Deskripsi:</label>
                                <p className="text-sm">{detail.produk_target.deskripsi_produk}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <div className="panel">
                    <div className="mb-5">
                        <h5 className="font-semibold text-lg">Timeline</h5>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-500">Tanggal Mulai:</label>
                            <p className="font-semibold">{formatDate(detail.produksi_info.tgl_produksi)}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Deadline:</label>
                            <p className="font-semibold">{formatDate(detail.produksi_info.tgl_tenggat)}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Mode Produksi:</label>
                            <p className="font-semibold">
                                {detail.produksi_info.mode_produksi === 'new_product' ? 'Produk Baru' : 'Produk Existing'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="panel">
                    <div className="mb-5">
                        <h5 className="font-semibold text-lg">Progress</h5>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Berat Hasil</span>
                                <span className="text-sm font-bold">{detail.progress.persentase}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(detail.progress.persentase)}`}
                                    style={{ width: `${detail.progress.persentase}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{detail.progress.total_berat_hasil}kg</span>
                                <span>{detail.progress.total_berat_target}kg</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Status:</label>
                            <p className="font-semibold">{detail.progress.status_completion}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bahan Mentah */}
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg flex items-center gap-2">
                        <Icon icon="solar:leaf-bold-duotone" width="20" height="20" className="text-green-500" />
                        Bahan Mentah
                    </h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {detail.bahan_mentah.map((bahan, index) => (
                        <div key={index} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon icon="solar:box-bold-duotone" width="16" height="16" className="text-green-600" />
                                <h6 className="font-medium text-green-800 dark:text-green-200">{bahan.nama}</h6>
                            </div>
                            <p className="text-lg font-bold text-green-900 dark:text-green-100">
                                {bahan.berat} {bahan.satuan}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* My Assignment */}
            {detail.my_assignment && (
                <div className="panel">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="font-semibold text-lg flex items-center gap-2">
                            <Icon icon="solar:user-bold-duotone" width="20" height="20" className="text-blue-500" />
                            Tugas Saya
                        </h5>
                        {(detail.produksi_info.status_produksi === 'sedang produksi' || detail.produksi_info.status_produksi === 'telat produksi') && (
                            <button
                                onClick={() => openUpdateModal(detail.my_assignment!)}
                                className="btn btn-primary"
                            >
                                <Icon icon="solar:pen-new-square-bold-duotone" width="16" height="16" className="mr-2" />
                                Update Hasil
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon icon="solar:scale-bold-duotone" width="16" height="16" className="text-blue-600" />
                                <label className="text-sm text-blue-600 dark:text-blue-400">Berat Hasil:</label>
                            </div>
                            <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                                {detail.my_assignment.berat_hasil ? `${detail.my_assignment.berat_hasil}kg` : 'Belum input'}
                            </p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon icon="solar:settings-bold-duotone" width="16" height="16" className="text-purple-600" />
                                <label className="text-sm text-purple-600 dark:text-purple-400">Asset:</label>
                            </div>
                            <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                                {detail.my_assignment.asset.nama}
                            </p>
                        </div>
                        {detail.my_assignment.gaji_total && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="solar:wallet-money-bold-duotone" width="16" height="16" className="text-yellow-600" />
                                    <label className="text-sm text-yellow-600 dark:text-yellow-400">Gaji:</label>
                                </div>
                                <p className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                                    {formatCurrency(detail.my_assignment.gaji_total)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Team Info */}
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg flex items-center gap-2">
                        <Icon icon="solar:users-group-two-rounded-bold-duotone" width="20" height="20" className="text-indigo-500" />
                        Tim Produksi ({detail.team_info.total_karyawan} orang)
                    </h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {detail.team_info.karyawan_list.map((karyawan, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon icon="solar:user-circle-bold-duotone" width="20" height="20" className="text-indigo-500" />
                                <h6 className="font-medium">{karyawan.nama}</h6>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Berat Hasil:</span>
                                    <span className="font-medium">
                                        {karyawan.berat_hasil ? `${karyawan.berat_hasil}kg` : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`font-medium ${karyawan.status === 'Sudah Input' ? 'text-success' : 'text-warning'}`}>
                                        {karyawan.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Deskripsi */}
            {detail.produksi_info.deskripsi && (
                <div className="panel">
                    <div className="mb-5">
                        <h5 className="font-semibold text-lg flex items-center gap-2">
                            <Icon icon="solar:note-bold-duotone" width="20" height="20" className="text-gray-500" />
                            Deskripsi Produksi
                        </h5>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300">{detail.produksi_info.deskripsi}</p>
                    </div>
                </div>
            )}

            {/* Update Berat Modal */}
            <UpdateBeratModal
                isOpen={updateModal.isOpen}
                onClose={closeUpdateModal}
                onSubmit={handleUpdateBerat}
                currentBerat={updateModal.assignment?.berat_hasil || null}
                produksiKode={detail.produksi_info.kode_produksi}
            />
        </div>
    );
};

export default DetailProduksiKaryawan;