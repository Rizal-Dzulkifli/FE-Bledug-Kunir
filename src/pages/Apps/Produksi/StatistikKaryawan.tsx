import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../../contexts/AuthContext';

interface Statistics {
    periode: string;
    total_produksi_diikuti: number;
    total_berat_hasil: number;
    total_gaji_diperoleh: number;
    breakdown_status: Array<{
        status: string;
        jumlah: number;
    }>;
}

const StatistikKinerjaKaryawan = () => {
    const { state } = useAuth();
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bulanFilter, setBulanFilter] = useState('');

    useEffect(() => {
        fetchStatistik();
    }, [bulanFilter]);

    const fetchStatistik = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Token tidak ditemukan, silakan login kembali');
                return;
            }

            const params = new URLSearchParams();
            if (bulanFilter) params.append('bulan', bulanFilter);

            const response = await fetch(`http://localhost:3333/api/karyawan/produksi/statistik?${params.toString()}`, {
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

            const result = await response.json();
            console.log('Statistik API Response:', result);
            setStatistics(result.data);
        } catch (error) {
            console.error('Error fetching statistik:', error);
            setError('Gagal memuat statistik kinerja. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
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
            case 'selesai':
                return 'bg-success';
            case 'sedang produksi':
                return 'bg-info';
            case 'belum produksi':
                return 'bg-warning';
            case 'telat produksi':
                return 'bg-danger';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'selesai':
                return 'Selesai';
            case 'sedang produksi':
                return 'Sedang Produksi';
            case 'belum produksi':
                return 'Belum Dimulai';
            case 'telat produksi':
                return 'Terlambat';
            default:
                return status;
        }
    };

    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const calculatePercentage = (value: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="eos-icons:loading" width="3rem" height="3rem" className="animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading statistik kinerja...</p>
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
                        <Icon icon="solar:chart-square-bold-duotone" width="24" height="24" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Statistik Kinerja</h1>
                        <p className="text-gray-600">Selamat datang, {state.user?.nama} - Analisis kinerja produksi Anda</p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filter Periode
                    </label>
                    <input
                        type="month"
                        value={bulanFilter}
                        onChange={(e) => setBulanFilter(e.target.value)}
                        className="form-input"
                        max={getCurrentMonth()}
                    />
                </div>
                <div className="md:col-span-2 flex items-end">
                    <button
                        onClick={() => setBulanFilter('')}
                        className="btn btn-outline-primary"
                    >
                        <Icon icon="solar:refresh-bold-duotone" width="16" height="16" className="mr-2" />
                        Reset Filter
                    </button>
                </div>
            </div>

            {statistics && (
                <>
                    {/* Main Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Produksi Diikuti</p>
                                    <p className="text-3xl font-bold">{statistics.total_produksi_diikuti}</p>
                                    <p className="text-blue-200 text-sm mt-1">Periode: {statistics.periode}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-full">
                                    <Icon icon="solar:widget-2-bold-duotone" width="2rem" height="2rem" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Total Berat Hasil</p>
                                    <p className="text-3xl font-bold">{statistics.total_berat_hasil}<span className="text-lg">kg</span></p>
                                    <p className="text-green-200 text-sm mt-1">
                                        Rata-rata: {statistics.total_produksi_diikuti > 0 ? 
                                            (statistics.total_berat_hasil / statistics.total_produksi_diikuti).toFixed(1) : 0}kg/produksi
                                    </p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-full">
                                    <Icon icon="solar:scale-bold-duotone" width="2rem" height="2rem" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-100 text-sm">Total Gaji Diperoleh</p>
                                    <p className="text-2xl font-bold">{formatCurrency(statistics.total_gaji_diperoleh)}</p>
                                    <p className="text-yellow-200 text-sm mt-1">
                                        Rata-rata: {statistics.total_produksi_diikuti > 0 ? 
                                            formatCurrency(statistics.total_gaji_diperoleh / statistics.total_produksi_diikuti) : formatCurrency(0)}/produksi
                                    </p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-full">
                                    <Icon icon="solar:wallet-money-bold-duotone" width="2rem" height="2rem" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className="panel">
                        <div className="mb-5">
                            <h5 className="font-semibold text-lg flex items-center gap-2">
                                <Icon icon="solar:pie-chart-bold-duotone" width="20" height="20" className="text-primary" />
                                Breakdown Status Produksi
                            </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Status Cards */}
                            <div className="space-y-4">
                                {statistics.breakdown_status.map((item, index) => (
                                    <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full ${getStatusColor(item.status)}`}></div>
                                                <span className="font-medium">{getStatusText(item.status)}</span>
                                            </div>
                                            <span className="text-lg font-bold">{item.jumlah}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                                                style={{ 
                                                    width: `${calculatePercentage(item.jumlah, statistics.total_produksi_diikuti)}%` 
                                                }}
                                            ></div>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {calculatePercentage(item.jumlah, statistics.total_produksi_diikuti)}% dari total
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Performance Insights */}
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
                                <h6 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Icon icon="solar:lightbulb-bold-duotone" width="20" height="20" className="text-purple-500" />
                                    Insights Kinerja
                                </h6>
                                
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Icon icon="solar:check-circle-bold-duotone" width="16" height="16" className="text-green-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Tingkat Penyelesaian</p>
                                            <p className="text-xs text-gray-600">
                                                {statistics.breakdown_status.find(s => s.status === 'selesai')?.jumlah || 0} dari {statistics.total_produksi_diikuti} produksi selesai
                                                ({calculatePercentage(
                                                    statistics.breakdown_status.find(s => s.status === 'selesai')?.jumlah || 0, 
                                                    statistics.total_produksi_diikuti
                                                )}%)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Icon icon="solar:scale-bold-duotone" width="16" height="16" className="text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Produktivitas</p>
                                            <p className="text-xs text-gray-600">
                                                Rata-rata {statistics.total_produksi_diikuti > 0 ? 
                                                    (statistics.total_berat_hasil / statistics.total_produksi_diikuti).toFixed(1) : 0}kg 
                                                per produksi yang diikuti
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Icon icon="solar:wallet-money-bold-duotone" width="16" height="16" className="text-yellow-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Efisiensi Gaji</p>
                                            <p className="text-xs text-gray-600">
                                                {statistics.total_berat_hasil > 0 ? 
                                                    formatCurrency(statistics.total_gaji_diperoleh / statistics.total_berat_hasil) : formatCurrency(0)} 
                                                per kg hasil produksi
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Comparison */}
                    {bulanFilter && (
                        <div className="panel">
                            <div className="mb-5">
                                <h5 className="font-semibold text-lg flex items-center gap-2">
                                    <Icon icon="solar:calendar-bold-duotone" width="20" height="20" className="text-primary" />
                                    Performa Bulan {bulanFilter}
                                </h5>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <Icon icon="solar:target-bold-duotone" width="2rem" height="2rem" className="mx-auto mb-2 text-blue-500" />
                                        <p className="text-sm text-gray-600">Target Bulanan</p>
                                        <p className="text-xl font-bold text-blue-600">-</p>
                                        <p className="text-xs text-gray-500">Belum tersedia</p>
                                    </div>
                                    <div className="text-center">
                                        <Icon icon="solar:chart-2-bold-duotone" width="2rem" height="2rem" className="mx-auto mb-2 text-green-500" />
                                        <p className="text-sm text-gray-600">Pencapaian</p>
                                        <p className="text-xl font-bold text-green-600">{statistics.total_berat_hasil}kg</p>
                                        <p className="text-xs text-gray-500">Berat hasil total</p>
                                    </div>
                                    <div className="text-center">
                                        <Icon icon="solar:medal-star-bold-duotone" width="2rem" height="2rem" className="mx-auto mb-2 text-yellow-500" />
                                        <p className="text-sm text-gray-600">Kinerja</p>
                                        <p className="text-xl font-bold text-yellow-600">
                                            {calculatePercentage(
                                                statistics.breakdown_status.find(s => s.status === 'selesai')?.jumlah || 0, 
                                                statistics.total_produksi_diikuti
                                            )}%
                                        </p>
                                        <p className="text-xs text-gray-500">Tingkat penyelesaian</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {!statistics && !loading && (
                <div className="text-center py-12">
                    <Icon icon="solar:chart-square-bold-duotone" width="4rem" height="4rem" className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 text-lg">Belum ada data statistik</p>
                    <p className="text-gray-500 text-sm mt-2">Statistik akan muncul setelah Anda mengikuti produksi</p>
                </div>
            )}
        </div>
    );
};

export default StatistikKinerjaKaryawan;