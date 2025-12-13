import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconTrendingUp from '../../components/Icon/IconTrendingUp';
import IconShoppingCart from '../../components/Icon/IconShoppingCart';
import IconDollarSignCircle from '../../components/Icon/IconDollarSignCircle';
import IconBox from '../../components/Icon/IconBox';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconEye from '../../components/Icon/IconEye';
import ReactApexChart from 'react-apexcharts';
import { buildApiUrl } from '../../config/api';

interface DashboardStats {
  overview: {
    totalPesanan: number;
    totalRevenue: number;
    revenueMonthly: number;
    todayOrders: number;
    lowStockItems: number;
    netProfit: number;
  };
  pesanan: {
    menunggu: number;
    diproses: number;
    dikirim: number;
    selesai: number;
    byStatus: Array<{ status_pemesanan: string; count: number }>;
  };
  revenueTrend: Array<{ month: string; revenue: number; order_count: number }>;
  topProducts: Array<{ nama_produk: string; total_sold: number; total_revenue: number }>;
  keuangan: {
    totalMasuk: number;
    totalKeluar: number;
    netProfit: number;
  };
  recentOrders: Array<{
    id: number;
    no_pesanan: string;
    tanggal: string;
    pelanggan: string;
    total: number;
    status_pemesanan: string;
    status_pembayaran: string;
  }>;
  inventory: {
    totalBarangMentah: number;
    totalProduk: number;
    totalBeratBarangMentah: number;
    totalStokProduk: number;
  };
}

interface MonthlyComparison {
  thisMonth: { orders: number; revenue: number };
  lastMonth: { orders: number; revenue: number };
  growth: { orders: number; revenue: number };
}

const Dashboard = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null);

  useEffect(() => {
    dispatch(setPageTitle('Dashboard'));
    fetchDashboardData();
  }, [dispatch]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch statistics
      const statsResponse = await fetch(buildApiUrl('dashboard/statistics'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsResponse.json();
      
      // Fetch monthly comparison
      const comparisonResponse = await fetch(buildApiUrl('dashboard/monthly-comparison'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const comparisonData = await comparisonResponse.json();

      if (statsData.data) setStats(statsData.data);
      if (comparisonData.data) setComparison(comparisonData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Chart configurations
  const revenueChartOptions: any = {
    series: [{
      name: 'Revenue',
      data: stats?.revenueTrend.map(item => item.revenue) || []
    }],
    options: {
      chart: {
        height: 300,
        type: 'area',
        fontFamily: 'Nunito, sans-serif',
        zoom: { enabled: false },
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, curve: 'smooth', width: 2 },
      xaxis: {
        categories: stats?.revenueTrend.map(item => {
          const [year, month] = item.month.split('-');
          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        }) || [],
      },
      yaxis: {
        labels: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
      tooltip: {
        y: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
      colors: ['#4361ee'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
        },
      },
    },
  };

  const statusPieOptions: any = {
    series: stats?.pesanan.byStatus.map(item => item.count) || [],
    options: {
      chart: {
        type: 'donut',
        height: 300,
        fontFamily: 'Nunito, sans-serif',
      },
      labels: stats?.pesanan.byStatus.map(item => item.status_pemesanan) || [],
      colors: ['#ffc107', '#4361ee', '#00ab55', '#2196f3', '#e7515a'],
      legend: {
        position: 'bottom',
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Pesanan',
                formatter: () => stats?.overview.totalPesanan.toString() || '0',
              },
            },
          },
        },
      },
    },
  };

  const topProductsBarOptions: any = {
    series: [{
      name: 'Terjual',
      data: stats?.topProducts.map(item => item.total_sold) || []
    }],
    options: {
      chart: {
        height: 300,
        type: 'bar',
        fontFamily: 'Nunito, sans-serif',
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: stats?.topProducts.map(item => item.nama_produk) || [],
      },
      colors: ['#00ab55'],
      grid: {
        borderColor: '#e0e6ed',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-12 h-12"></span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-white-dark">Selamat datang di Dashboard Manajemen Bledug Kunir 🌾</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {/* Total Revenue Card */}
        <div className="panel bg-gradient-to-r from-cyan-500 to-cyan-400 text-white">
          <div className="flex justify-between">
            <div className="ltr:mr-1 rtl:ml-1 text-md font-semibold">Total Revenue</div>
            <div className="dropdown">
              <IconDollarSignCircle className="text-white-light w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center mt-5">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">{formatCurrency(stats?.overview.totalRevenue || 0)}</div>
          </div>
          <div className="flex items-center font-semibold mt-5">
            <IconEye className="ltr:mr-2 rtl:ml-2 shrink-0" />
            Semua transaksi lunas
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="panel bg-gradient-to-r from-violet-500 to-violet-400 text-white">
          <div className="flex justify-between">
            <div className="ltr:mr-1 rtl:ml-1 text-md font-semibold">Total Pesanan</div>
            <div className="dropdown">
              <IconShoppingCart className="text-white-light w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center mt-5">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">{stats?.overview.totalPesanan || 0}</div>
          </div>
          <div className="flex items-center font-semibold mt-5">
            <IconTrendingUp className="ltr:mr-2 rtl:ml-2 shrink-0" />
            {comparison?.growth.orders ? 
              `${comparison.growth.orders > 0 ? '+' : ''}${comparison.growth.orders.toFixed(1)}% dari bulan lalu` 
              : 'Semua pesanan'}
          </div>
        </div>

        {/* Monthly Revenue Card */}
        <div className="panel bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 text-white">
          <div className="flex justify-between">
            <div className="ltr:mr-1 rtl:ml-1 text-md font-semibold">Revenue Bulan Ini</div>
            <div className="dropdown">
              <IconDollarSignCircle className="text-white-light w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center mt-5">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">{formatCurrency(stats?.overview.revenueMonthly || 0)}</div>
          </div>
          <div className="flex items-center font-semibold mt-5">
            <IconTrendingUp className="ltr:mr-2 rtl:ml-2 shrink-0" />
            {comparison?.growth.revenue ? 
              `${comparison.growth.revenue > 0 ? '+' : ''}${comparison.growth.revenue.toFixed(1)}% dari bulan lalu` 
              : 'Bulan ini'}
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="panel bg-gradient-to-r from-rose-500 to-rose-400 text-white">
          <div className="flex justify-between">
            <div className="ltr:mr-1 rtl:ml-1 text-md font-semibold">Stok Menipis</div>
            <div className="dropdown">
              <IconBox className="text-white-light w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center mt-5">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">{stats?.overview.lowStockItems || 0}</div>
          </div>
          <div className="flex items-center font-semibold mt-5">
            <IconEye className="ltr:mr-2 rtl:ml-2 shrink-0" />
            Item perlu restock
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <div className="panel h-full">
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Trend Revenue</h5>
          </div>
          <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
            <ReactApexChart 
              options={revenueChartOptions.options} 
              series={revenueChartOptions.series} 
              type="area" 
              height={300} 
            />
          </div>
        </div>

        {/* Status Pesanan Pie Chart */}
        <div className="panel h-full">
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Status Pesanan</h5>
          </div>
          <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
            <ReactApexChart 
              options={statusPieOptions.options} 
              series={statusPieOptions.series} 
              type="donut" 
              height={300} 
            />
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Top Products Bar Chart */}
        <div className="panel h-full">
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Top 5 Produk Terlaris</h5>
          </div>
          <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
            <ReactApexChart 
              options={topProductsBarOptions.options} 
              series={topProductsBarOptions.series} 
              type="bar" 
              height={300} 
            />
          </div>
        </div>

        {/* Keuangan Summary */}
        <div className="panel h-full">
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Ringkasan Keuangan</h5>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-success-light rounded-lg">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pemasukan</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(stats?.keuangan.totalMasuk || 0)}</p>
              </div>
              <div className="text-success">
                <IconTrendingUp className="w-10 h-10" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-danger-light rounded-lg">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pengeluaran</p>
                <p className="text-2xl font-bold text-danger">{formatCurrency(stats?.keuangan.totalKeluar || 0)}</p>
              </div>
              <div className="text-danger">
                <IconArrowLeft className="w-10 h-10" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-primary-light rounded-lg">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Net Profit</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats?.keuangan.netProfit || 0)}</p>
              </div>
              <div className="text-primary">
                <IconDollarSignCircle className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="panel">
        <div className="flex items-center justify-between mb-5">
          <h5 className="font-semibold text-lg dark:text-white-light">Pesanan Terbaru</h5>
          <Link to="/apps/pesanan" className="ltr:ml-auto rtl:mr-auto btn btn-primary btn-sm">
            Lihat Semua
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table-hover">
            <thead>
              <tr>
                <th>No. Pesanan</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Status Pesanan</th>
                <th>Status Pembayaran</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="font-semibold">{order.no_pesanan}</td>
                  <td>{order.tanggal}</td>
                  <td>{order.pelanggan}</td>
                  <td className="font-semibold">{formatCurrency(order.total)}</td>
                  <td>
                    <span className={`badge ${
                      order.status_pemesanan === 'Selesai' ? 'bg-success' :
                      order.status_pemesanan === 'Dikirim' ? 'bg-info' :
                      order.status_pemesanan === 'Diproses' ? 'bg-primary' :
                      order.status_pemesanan === 'Dibatalkan' ? 'bg-danger' :
                      'bg-warning'
                    }`}>
                      {order.status_pemesanan}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      order.status_pembayaran === 'Lunas' ? 'bg-success' :
                      order.status_pembayaran === 'DP' ? 'bg-info' :
                      order.status_pembayaran === 'Sudah Dibayar' ? 'bg-primary' :
                      'bg-warning'
                    }`}>
                      {order.status_pembayaran}
                    </span>
                  </td>
                  <td className="text-center">
                    <Link to={`/apps/pesanan/preview/${order.id}`} className="btn btn-sm btn-outline-primary">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
