import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../store';
import { setPageTitle } from '../store/themeConfigSlice';
import { useAuth } from '../contexts/AuthContext';
import DriverService, { DriverStats, RecentDelivery } from '../services/DriverService';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';

const DriverDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { state } = useAuth();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const [stats, setStats] = useState<DriverStats>({
        total_pengiriman: 0,
        dalam_perjalanan: 0,
        selesai: 0,
        gagal: 0,
        pengiriman_hari_ini: 0,
        total_gaji: 0,
        gaji_dibayar: 0,
        gaji_belum_dibayar: 0,
    });
    
    const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Dashboard Driver'));
        
        // Pastikan user adalah driver
        if (state.user?.role !== 'driver') {
            navigate('/dashboard');
            return;
        }
        
        fetchDashboardData();
    }, [dispatch, navigate, state.user]);

    const fetchDashboardData = async () => {
        if (!state.user?.user_id) return;

        try {
            setLoading(true);
            
            const [statsResponse, recentResponse] = await Promise.all([
                DriverService.getDriverStats(state.user.user_id),
                DriverService.getRecentDeliveries(state.user.user_id, 5),
            ]);

            // Update stats from backend
            if (statsResponse.success) {
                setStats(statsResponse.data);
            }
            
            setRecentDeliveries(recentResponse.data);
            
            // If stats API fails, calculate from recent deliveries
            if (!statsResponse.success) {
                calculateStats(recentResponse.data);
            }
            
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            Swal.fire('Error', error.message || 'Gagal memuat data dashboard', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (deliveries: RecentDelivery[]) => {
        const today = new Date().toDateString();
        
        const calculatedStats = {
            total_pengiriman: deliveries.length,
            dalam_perjalanan: deliveries.filter(d => d.status_pengiriman === 'Dalam Perjalanan').length,
            selesai: deliveries.filter(d => d.status_pengiriman === 'Selesai').length,
            gagal: deliveries.filter(d => d.status_pengiriman === 'Gagal').length,
            pengiriman_hari_ini: deliveries.filter(d => new Date(d.tanggal_pengiriman).toDateString() === today).length,
            total_gaji: deliveries.reduce((sum, d) => {
                const gaji = d.gaji_driver ? (typeof d.gaji_driver === 'string' ? parseFloat(d.gaji_driver) : d.gaji_driver) : 0;
                return sum + (isNaN(gaji) ? 0 : gaji);
            }, 0),
            gaji_dibayar: deliveries.filter(d => d.gaji_dibayar).reduce((sum, d) => {
                const gaji = d.gaji_driver ? (typeof d.gaji_driver === 'string' ? parseFloat(d.gaji_driver) : d.gaji_driver) : 0;
                return sum + (isNaN(gaji) ? 0 : gaji);
            }, 0),
            gaji_belum_dibayar: deliveries.filter(d => !d.gaji_dibayar).reduce((sum, d) => {
                const gaji = d.gaji_driver ? (typeof d.gaji_driver === 'string' ? parseFloat(d.gaji_driver) : d.gaji_driver) : 0;
                return sum + (isNaN(gaji) ? 0 : gaji);
            }, 0),
        };
        
        setStats(calculatedStats);
    };

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = isNaN(numAmount) ? 0 : numAmount;
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(validAmount);
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

    // Chart data untuk status pengiriman
    const statusChart: any = {
        series: [stats.dalam_perjalanan, stats.selesai, stats.gagal],
        options: {
            chart: {
                height: 300,
                type: 'donut',
                zoom: { enabled: false },
                toolbar: { show: false },
            },
            stroke: { show: false },
            labels: ['Dalam Perjalanan', 'Selesai', 'Gagal'],
            colors: ['#f59e0b', '#10b981', '#ef4444'],
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: { width: 200 },
                    },
                },
            ],
            legend: { position: 'bottom' },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Icon icon="solar:loading-linear" className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-500">Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-semibold">Dashboard Driver</h2>
                    <p className="text-sm text-gray-500 mt-1">Selamat datang, {state.user?.nama}</p>
                </div>
                <Link
                    to="/driver/laporan-gaji"
                    className="btn btn-primary"
                >
                    <Icon icon="solar:chart-bold-duotone" className="w-4 h-4 mr-2" />
                    Laporan Pendapatan
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <div className="panel bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Total Pengiriman</div>
                            <div className="text-2xl font-bold mt-1">{stats.total_pengiriman}</div>
                        </div>
                        <Icon icon="solar:delivery-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Dalam Perjalanan</div>
                            <div className="text-2xl font-bold mt-1">{stats.dalam_perjalanan}</div>
                        </div>
                        <Icon icon="solar:delivery-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Selesai</div>
                            <div className="text-2xl font-bold mt-1">{stats.selesai}</div>
                        </div>
                        <Icon icon="solar:check-circle-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Hari Ini</div>
                            <div className="text-2xl font-bold mt-1">{stats.pengiriman_hari_ini}</div>
                        </div>
                        <Icon icon="solar:calendar-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Gaji Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500">Total Gaji</div>
                            <div className="text-xl font-bold text-primary mt-1">
                                {formatCurrency(stats.total_gaji)}
                            </div>
                        </div>
                        <Icon icon="solar:wallet-money-bold-duotone" className="w-8 h-8 text-primary" />
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500">Sudah Dibayar</div>
                            <div className="text-xl font-bold text-success mt-1">
                                {formatCurrency(stats.gaji_dibayar)}
                            </div>
                        </div>
                        <Icon icon="solar:check-circle-bold-duotone" className="w-8 h-8 text-success" />
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500">Belum Dibayar</div>
                            <div className="text-xl font-bold text-warning mt-1">
                                {formatCurrency(stats.gaji_belum_dibayar)}
                            </div>
                        </div>
                        <Icon icon="solar:clock-circle-bold-duotone" className="w-8 h-8 text-warning" />
                    </div>
                </div>
            </div>

            {/* Charts and Recent Deliveries */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {/* Status Pengiriman Chart */}
                <div className="panel">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-lg font-semibold">Status Pengiriman</h5>
                    </div>
                    <div className="mb-5">
                        {stats.total_pengiriman > 0 ? (
                            <ReactApexChart 
                                series={statusChart.series} 
                                options={statusChart.options} 
                                type="donut" 
                                height={300} 
                            />
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-500">
                                <div className="text-center">
                                    <Icon icon="solar:delivery-bold-duotone" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Belum ada data pengiriman</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Deliveries */}
                <div className="panel">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-lg font-semibold">Pengiriman Terbaru</h5>
                        <Link 
                            to="/apps/pengiriman"
                            className="text-primary hover:text-primary-dark text-sm font-medium"
                        >
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentDeliveries.length > 0 ? (
                            recentDeliveries.map((delivery) => (
                                <div key={delivery.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-primary">
                                            {delivery.pesanan.no_pesanan}
                                        </div>
                                        <span className={`badge ${getStatusBadge(delivery.status_pengiriman)} text-xs`}>
                                            {delivery.status_pengiriman}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon icon="solar:user-bold-duotone" className="w-4 h-4" />
                                            {delivery.pesanan.pelanggan.nama}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4" />
                                            {formatDate(delivery.tanggal_pengiriman)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:wallet-money-bold-duotone" className="w-4 h-4" />
                                            Gaji: {formatCurrency(delivery.gaji_driver)}
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                delivery.gaji_dibayar 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {delivery.gaji_dibayar ? 'Dibayar' : 'Belum'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Icon icon="solar:delivery-bold-duotone" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Belum ada pengiriman</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;