import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { KeuanganEksternalService, KeuanganEksternal } from '../../services/KeuanganEksternalService';
import IconPlus from '../../components/Icon/IconPlus';
import IconEdit from '../../components/Icon/IconEdit';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconSearch from '../../components/Icon/IconSearch';
import IconSettings from '../../components/Icon/IconSettings';
import IconEye from '../../components/Icon/IconEye';

const KeuanganTransaksi = () => {
    const { state: authState } = useAuth();
    
    // Refs for DataTable
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);
    
    // State management
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<KeuanganEksternal[]>([]);
    const [summary, setSummary] = useState({
        total_masuk: 0,
        total_keluar: 0,
    });
    
    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [kategoriFilter, setKategoriFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Destroy DataTable helper
    const destroyDataTable = () => {
        if (dataTableRef.current) {
            try {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            } catch (error) {
                console.log('DataTable cleanup:', error);
            }
        }
    };

    // Fetch data
    const fetchData = async () => {
        try {
            destroyDataTable();
            setLoading(true);
            const params = {
                limit: 50,
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
                ...(kategoriFilter && { kategori: kategoriFilter }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            };

            const response = await KeuanganEksternalService.getTransaksi(params);
            
            if (response.data) {
                setRecords(response.data);
                
                if (response.summary) {
                    setSummary(response.summary);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'Gagal memuat data transaksi', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Effects
    useEffect(() => {
        fetchData();
    }, [search, statusFilter, kategoriFilter, startDate, endDate]);

    // Initialize DataTable
    useEffect(() => {
        if (!loading && tableRef.current) {
            setTimeout(() => {
                if (tableRef.current && !dataTableRef.current) {
                    try {
                        dataTableRef.current = new DataTable(tableRef.current, {
                            pageLength: 10,
                            lengthMenu: [10, 25],
                            deferRender: true,
                            stateSave: false,
                            searching: false,
                            ordering: true,
                            info: true,
                            paging: true,
                            autoWidth: false,
                            retrieve: true,
                            destroy: true,
                            order: [[0, 'desc']],
                            language: {
                                lengthMenu: '_MENU_',
                                info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ data',
                                infoEmpty: 'Menampilkan 0 sampai 0 dari 0 data',
                                infoFiltered: '(difilter dari _MAX_ total data)',
                                paginate: {
                                    first: 'Pertama',
                                    last: 'Terakhir',
                                    next: 'Selanjutnya',
                                    previous: 'Sebelumnya'
                                },
                                zeroRecords: 'Data tidak ditemukan'
                            }
                        });
                    } catch (error) {
                        console.error('DataTable initialization error:', error);
                    }
                }
            }, 150);
        }

        return () => {
            destroyDataTable();
        };
    }, [loading, records]);

    // Handle delete
    const handleDelete = async (id: number, deskripsi: string) => {
        const result = await Swal.fire({
            title: 'Konfirmasi Hapus',
            text: `Yakin ingin menghapus transaksi: ${deskripsi}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            try {
                await KeuanganEksternalService.deleteTransaksi(id);
                
                Swal.fire('Berhasil', 'Transaksi berhasil dihapus', 'success');
                fetchData(); // Refresh data
            } catch (error) {
                console.error('Error deleting transaction:', error);
                Swal.fire('Error', 'Gagal menghapus transaksi', 'error');
            }
        }
    };

    // Handle search
    const handleSearch = (value: string) => {
        setSearch(value);
    };

    // Clear filters
    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setKategoriFilter('');
        setStartDate('');
        setEndDate('');
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        return status === 'masuk' 
            ? <span className="badge bg-success text-white">{status.toUpperCase()}</span>
            : <span className="badge bg-danger text-white">{status.toUpperCase()}</span>;
    };

    // Get kategori badge
    const getKategoriBadge = (kategori: string) => {
        const colors = {
            operasional: 'bg-info',
            investasi: 'bg-warning',
            penjualan: 'bg-success',
            pembelian: 'bg-primary',
            lainnya: 'bg-secondary',
        };
        
        return <span className={`badge ${colors[kategori as keyof typeof colors]} text-white`}>
            {kategori.toUpperCase()}
        </span>;
    };

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">
                    Transaksi Keuangan Eksternal
                </h5>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="panel bg-gradient-to-r from-cyan-500 to-blue-500">
                    <div className="flex justify-between items-center">
                        <div className="text-white">
                            <div className="text-3xl font-bold">{formatCurrency(summary.total_masuk)}</div>
                            <div className="text-base mt-1 opacity-80">Total Pemasukan</div>
                        </div>
                        <div className="text-white opacity-20">
                            <IconPlus className="w-12 h-12" />
                        </div>
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-violet-500 to-purple-500">
                    <div className="flex justify-between items-center">
                        <div className="text-white">
                            <div className="text-3xl font-bold">{formatCurrency(summary.total_keluar)}</div>
                            <div className="text-base mt-1 opacity-80">Total Pengeluaran</div>
                        </div>
                        <div className="text-white opacity-20">
                            <IconTrashLines className="w-12 h-12" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    <Link 
                        to="/keuangan/transaksi/add" 
                        className="btn btn-primary gap-2"
                    >
                        <IconPlus className="w-4 h-4" />
                        Tambah Transaksi
                    </Link>
                    <Link 
                        to="/keuangan/transaksi-terpadu" 
                        className="btn btn-success gap-2"
                    >
                        <IconEye className="w-4 h-4" />
                        Lihat Semua Transaksi
                    </Link>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn btn-outline-primary gap-2"
                    >
                        <IconSettings className="w-4 h-4" />
                        Filter
                    </button>
                    {(search || statusFilter || kategoriFilter || startDate || endDate) && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-outline-danger"
                        >
                            Bersihkan Filter
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            className="form-input w-64 pr-10"
                            placeholder="Cari deskripsi..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <IconSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="panel mb-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Semua Status</option>
                                <option value="masuk">Masuk</option>
                                <option value="keluar">Keluar</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Kategori</label>
                            <select
                                className="form-select"
                                value={kategoriFilter}
                                onChange={(e) => setKategoriFilter(e.target.value)}
                            >
                                <option value="">Semua Kategori</option>
                                <option value="operasional">Operasional</option>
                                <option value="investasi">Investasi</option>
                                <option value="penjualan">Penjualan</option>
                                <option value="pembelian">Pembelian</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                            <input
                                type="date"
                                className="form-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Tanggal Akhir</label>
                            <input
                                type="date"
                                className="form-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="mt-5 panel p-5 border-0">
                <div className="overflow-x-auto">
                    <div className="datatables">
                        <table ref={tableRef} id="keuanganTable" className="table-striped table-hover" style={{width:'100%'}}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>Deskripsi</th>
                                <th>Biaya</th>
                                <th>Status</th>
                                <th>Kategori</th>
                                <th>Referensi</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-4">
                                        <IconSearch className="text-primary mx-auto w-8 h-8" />
                                        <p className="mt-2 text-gray-500">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : (
                                records.map((item, index) => (
                                    <tr key={item.keuangan_id}>
                                        <td>{index + 1}</td>
                                        <td>{formatDate(item.tanggal)}</td>
                                        <td>{item.deskripsi}</td>
                                        <td>
                                            <span className={item.status === 'masuk' ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                                                {formatCurrency(item.biaya)}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(item.status)}</td>
                                        <td>{getKategoriBadge(item.kategori)}</td>
                                        <td>{item.referensi || '-'}</td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    to={`/keuangan/transaksi/edit/${item.keuangan_id}`}
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="Edit"
                                                >
                                                    <IconEdit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.keuangan_id, item.deskripsi)}
                                                    className="btn btn-sm btn-outline-danger"
                                                    title="Hapus"
                                                >
                                                    <IconTrashLines className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KeuanganTransaksi;