import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { useAuth } from '../contexts/AuthContext';
import DriverService from '../services/DriverService';
import type { RecentDelivery } from '../services/DriverService';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';
import ReactApexChart from 'react-apexcharts';

interface MonthlyEarnings {
    month: string;
    year: number;
    total_pengiriman: number;
    total_gaji: number;
    gaji_dibayar: number;
    gaji_belum_dibayar: number;
    deliveries: RecentDelivery[];
}

const DriverLaporanGaji = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { state } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyEarnings[]>([]);
    const [allDeliveries, setAllDeliveries] = useState<RecentDelivery[]>([]);

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    useEffect(() => {
        dispatch(setPageTitle('Laporan Pendapatan'));
        
        if (state.user?.role !== 'driver') {
            navigate('/dashboard');
            return;
        }
        
        fetchEarningsData();
    }, [dispatch, navigate, state.user, selectedYear]);

    const fetchEarningsData = async () => {
        if (!state.user?.user_id) return;

        try {
            setLoading(true);
            
            // Fetch all deliveries for the driver
            const response = await DriverService.getRecentDeliveries(state.user.user_id, 1000);
            
            if (response.success && response.data) {
                setAllDeliveries(response.data);
                processMonthlyData(response.data);
            }
            
        } catch (error: any) {
            console.error('Error fetching earnings data:', error);
            Swal.fire('Error', error.message || 'Gagal memuat data pendapatan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const processMonthlyData = (deliveries: RecentDelivery[]) => {
        const monthlyMap = new Map<string, MonthlyEarnings>();

        deliveries.forEach(delivery => {
            const date = new Date(delivery.tanggal_pengiriman);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            if (year !== selectedYear) return;

            const key = `${year}-${month}`;
            const gaji = delivery.gaji_driver ? (typeof delivery.gaji_driver === 'string' ? parseFloat(delivery.gaji_driver) : delivery.gaji_driver) : 0;
            const validGaji = isNaN(gaji) ? 0 : gaji;

            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, {
                    month: monthNames[month],
                    year: year,
                    total_pengiriman: 0,
                    total_gaji: 0,
                    gaji_dibayar: 0,
                    gaji_belum_dibayar: 0,
                    deliveries: []
                });
            }

            const monthData = monthlyMap.get(key)!;
            monthData.total_pengiriman++;
            monthData.total_gaji += validGaji;
            
            if (delivery.gaji_dibayar) {
                monthData.gaji_dibayar += validGaji;
            } else {
                monthData.gaji_belum_dibayar += validGaji;
            }
            
            monthData.deliveries.push(delivery);
        });

        const sortedData = Array.from(monthlyMap.values())
            .sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));

        setMonthlyData(sortedData);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Dalam Perjalanan':
                return 'badge-outline-warning';
            case 'Selesai':
                return 'badge-outline-success';
            case 'Gagal':
                return 'badge-outline-danger';
            default:
                return 'badge-outline-primary';
        }
    };

    const selectedMonthData = selectedMonth !== null ? monthlyData[selectedMonth] : null;

    // Chart data
    const yearlyChart: any = {
        series: [{
            name: 'Total Gaji',
            data: monthlyData.map(m => m.total_gaji)
        }, {
            name: 'Sudah Dibayar',
            data: monthlyData.map(m => m.gaji_dibayar)
        }, {
            name: 'Belum Dibayar',
            data: monthlyData.map(m => m.gaji_belum_dibayar)
        }],
        options: {
            chart: {
                height: 350,
                type: 'bar',
                toolbar: { show: true }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                }
            },
            dataLabels: { enabled: false },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: monthlyData.map(m => m.month),
            },
            yaxis: {
                labels: {
                    formatter: (val: number) => formatCurrency(val)
                }
            },
            colors: ['#4361ee', '#10b981', '#f59e0b'],
            fill: { opacity: 1 },
            tooltip: {
                y: {
                    formatter: (val: number) => formatCurrency(val)
                }
            },
            legend: {
                position: 'top'
            }
        }
    };

    const totalYearly = monthlyData.reduce((sum, m) => sum + m.total_gaji, 0);
    const totalYearlyPaid = monthlyData.reduce((sum, m) => sum + m.gaji_dibayar, 0);
    const totalYearlyUnpaid = monthlyData.reduce((sum, m) => sum + m.gaji_belum_dibayar, 0);
    const totalDeliveries = monthlyData.reduce((sum, m) => sum + m.total_pengiriman, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Icon icon="solar:loading-linear" className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-500">Memuat data laporan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Laporan Pendapatan Driver</h2>
                    <p className="text-sm text-gray-500 mt-1">Ringkasan gaji dan pengiriman per bulan</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="form-select w-32"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <button
                        onClick={fetchEarningsData}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        <Icon icon="solar:refresh-linear" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Yearly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="panel bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Total Pengiriman</div>
                            <div className="text-2xl font-bold mt-1">{totalDeliveries}</div>
                            <div className="text-xs opacity-70 mt-1">{selectedYear}</div>
                        </div>
                        <Icon icon="solar:delivery-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Total Pendapatan</div>
                            <div className="text-xl font-bold mt-1">{formatCurrency(totalYearly)}</div>
                            <div className="text-xs opacity-70 mt-1">{selectedYear}</div>
                        </div>
                        <Icon icon="solar:wallet-money-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Sudah Dibayar</div>
                            <div className="text-xl font-bold mt-1">{formatCurrency(totalYearlyPaid)}</div>
                            <div className="text-xs opacity-70 mt-1">{selectedYear}</div>
                        </div>
                        <Icon icon="solar:check-circle-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Belum Dibayar</div>
                            <div className="text-xl font-bold mt-1">{formatCurrency(totalYearlyUnpaid)}</div>
                            <div className="text-xs opacity-70 mt-1">{selectedYear}</div>
                        </div>
                        <Icon icon="solar:clock-circle-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="panel">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold">Grafik Pendapatan Bulanan {selectedYear}</h5>
                </div>
                {monthlyData.length > 0 ? (
                    <ReactApexChart
                        series={yearlyChart.series}
                        options={yearlyChart.options}
                        type="bar"
                        height={350}
                    />
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Icon icon="solar:chart-bold-duotone" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Belum ada data untuk tahun {selectedYear}</p>
                    </div>
                )}
            </div>

            {/* Monthly Table */}
            <div className="panel">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold">Rincian Per Bulan</h5>
                </div>
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>Bulan</th>
                                <th>Jumlah Pengiriman</th>
                                <th>Total Gaji</th>
                                <th>Sudah Dibayar</th>
                                <th>Belum Dibayar</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.length > 0 ? (
                                monthlyData.map((month, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="font-semibold">{month.month} {month.year}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-outline-primary">
                                                {month.total_pengiriman} pengiriman
                                            </span>
                                        </td>
                                        <td className="font-semibold text-primary">
                                            {formatCurrency(month.total_gaji)}
                                        </td>
                                        <td className="text-success">
                                            {formatCurrency(month.gaji_dibayar)}
                                        </td>
                                        <td className="text-warning">
                                            {formatCurrency(month.gaji_belum_dibayar)}
                                        </td>
                                        <td className="text-center">
                                            <button
                                                onClick={() => setSelectedMonth(index)}
                                                className="btn btn-sm btn-outline-primary"
                                            >
                                                <Icon icon="solar:eye-bold" className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        Belum ada data untuk tahun {selectedYear}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Monthly Detail Modal */}
            {selectedMonthData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedMonth(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold">
                                Detail Pengiriman - {selectedMonthData.month} {selectedMonthData.year}
                            </h3>
                            <button
                                onClick={() => setSelectedMonth(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-5 overflow-y-auto max-h-[calc(90vh-8rem)]">
                            {/* Month Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Pengiriman</div>
                                    <div className="text-2xl font-bold text-blue-600">{selectedMonthData.total_pengiriman}</div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Gaji</div>
                                    <div className="text-lg font-bold text-purple-600">{formatCurrency(selectedMonthData.total_gaji)}</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Sudah Dibayar</div>
                                    <div className="text-lg font-bold text-green-600">{formatCurrency(selectedMonthData.gaji_dibayar)}</div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Belum Dibayar</div>
                                    <div className="text-lg font-bold text-amber-600">{formatCurrency(selectedMonthData.gaji_belum_dibayar)}</div>
                                </div>
                            </div>

                            {/* Deliveries List */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-lg mb-3">Daftar Pengiriman</h4>
                                {selectedMonthData.deliveries.map((delivery) => (
                                    <div key={delivery.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-semibold text-primary">
                                                {delivery.pesanan.no_pesanan}
                                            </div>
                                            <span className={`badge ${getStatusBadge(delivery.status_pengiriman)} text-xs`}>
                                                {delivery.status_pengiriman}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Icon icon="solar:user-bold-duotone" className="w-4 h-4" />
                                                {delivery.pesanan.pelanggan.nama}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4" />
                                                {formatDate(delivery.tanggal_pengiriman)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4" />
                                                {delivery.alamat_pengiriman || 'Alamat tidak tersedia'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Icon icon="solar:wallet-money-bold-duotone" className="w-4 h-4" />
                                                <span className="font-semibold">{formatCurrency(delivery.gaji_driver)}</span>
                                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                    delivery.gaji_dibayar 
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                }`}>
                                                    {delivery.gaji_dibayar ? 'Dibayar' : 'Belum'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverLaporanGaji;
