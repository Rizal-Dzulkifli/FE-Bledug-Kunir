import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconFile from '../../components/Icon/IconFile';
import IconPrinter from '../../components/Icon/IconPrinter';
import IconCalculator from '../../components/Icon/IconDollarSign';
import Swal from 'sweetalert2';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

interface User {
    user_id: number;
    nama: string;
    email: string;
    role: string;
    status: string;
}

interface SettingGaji {
    id_setting_gaji: number;
    role: string;
    gaji: number;
    keterangan: string;
}

interface SalaryCalculation {
    user_id: number;
    nama: string;
    role: string;
    units_completed: number;
    unit_rate: number;
    total_salary: number;
    periode: string;
}

const PerhitunganGaji = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Perhitungan Gaji'));
    });

    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<SalaryCalculation[]>([]);
    const [recordsData, setRecordsData] = useState<SalaryCalculation[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<SalaryCalculation[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'user_id',
        direction: 'asc',
    });

    const [users, setUsers] = useState<User[]>([]);
    const [settingGajis, setSettingGajis] = useState<SettingGaji[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCalculateModal, setShowCalculateModal] = useState(false);
    
    // Form state for calculation
    const [calculationForm, setCalculationForm] = useState({
        user_id: '',
        units_completed: '',
        periode: new Date().toISOString().substr(0, 7) // YYYY-MM format
    });

    // Fetch users data
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl('users'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const result = await response.json();
            const data = result.data || [];
            // Filter only driver and karyawan roles
            const filteredUsers = data.filter((user: User) => 
                user.role === 'driver' || user.role === 'karyawan'
            );
            setUsers(filteredUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Fetch setting gaji data
    const fetchSettingGajis = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl('setting-gaji'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch setting gajis');
            }

            const result = await response.json();
            const data = result.data || [];
            setSettingGajis(data);
        } catch (error) {
            console.error('Error fetching setting gajis:', error);
        }
    };

    // Calculate salary for a user
    const calculateUserSalary = async () => {
        if (!calculationForm.user_id || !calculationForm.units_completed) {
            Swal.fire('Error', 'Harap lengkapi semua field', 'error');
            return;
        }

        try {
            const user = users.find(u => u.user_id.toString() === calculationForm.user_id);
            const settingGaji = settingGajis.find(s => s.role === user?.role);

            if (!user || !settingGaji) {
                Swal.fire('Error', 'Data user atau setting gaji tidak ditemukan', 'error');
                return;
            }

            const unitsCompleted = parseInt(calculationForm.units_completed);
            const unitRate = settingGaji.gaji;
            const totalSalary = unitsCompleted * unitRate;

            const newCalculation: SalaryCalculation = {
                user_id: user.user_id,
                nama: user.nama,
                role: user.role,
                units_completed: unitsCompleted,
                unit_rate: unitRate,
                total_salary: totalSalary,
                periode: calculationForm.periode
            };

            // Add to records
            const updatedRecords = [...initialRecords];
            const existingIndex = updatedRecords.findIndex(
                r => r.user_id === newCalculation.user_id && r.periode === newCalculation.periode
            );

            if (existingIndex !== -1) {
                updatedRecords[existingIndex] = newCalculation;
            } else {
                updatedRecords.push(newCalculation);
            }

            setInitialRecords(updatedRecords);
            setFilteredRecords(updatedRecords);
            setShowCalculateModal(false);
            resetCalculationForm();

            Swal.fire('Success', `Gaji berhasil dihitung: ${formatCurrency(totalSalary)}`, 'success');
        } catch (error) {
            console.error('Error calculating salary:', error);
            Swal.fire('Error', 'Gagal menghitung gaji', 'error');
        }
    };

    const resetCalculationForm = () => {
        setCalculationForm({
            user_id: '',
            units_completed: '',
            periode: new Date().toISOString().substr(0, 7)
        });
    };

    // Initialize data
    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            await Promise.all([fetchUsers(), fetchSettingGajis()]);
            // Initialize with empty array for calculations
            setInitialRecords([]);
            setFilteredRecords([]);
            setLoading(false);
        };
        initData();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...filteredRecords.slice(from, to)]);
    }, [page, pageSize, filteredRecords]);

    useEffect(() => {
        const filteredData = initialRecords.filter((item) => {
            return (
                item.nama.toLowerCase().includes(search.toLowerCase()) ||
                item.role.toLowerCase().includes(search.toLowerCase()) ||
                item.periode.includes(search.toLowerCase())
            );
        });
        setFilteredRecords(filteredData);
        setPage(1);
    }, [search, initialRecords]);

    useEffect(() => {
        const data = sortBy(filteredRecords, sortStatus.columnAccessor);
        const sortedData = sortStatus.direction === 'desc' ? data.reverse() : data;
        setFilteredRecords(sortedData);
        setPage(1);
    }, [sortStatus]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    // Export functions
    const exportTable = (type: string) => {
        let columns: any = ['Nama', 'Role', 'Periode', 'Unit Selesai', 'Rate per Unit', 'Total Gaji'];
        let records = filteredRecords.map((item: SalaryCalculation) => ({
            Nama: item.nama,
            Role: item.role,
            Periode: item.periode,
            'Unit Selesai': item.units_completed,
            'Rate per Unit': formatCurrency(item.unit_rate),
            'Total Gaji': formatCurrency(item.total_salary),
        }));

        if (type === 'csv') {
            const csvContent = [
                columns.join(','),
                ...records.map(record => Object.values(record).map(value => 
                    typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                ).join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'perhitungan_gaji.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    };

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <div className="flex items-center flex-wrap">
                        <h2 className="text-xl">Perhitungan Gaji</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                        <div className="flex gap-3">
                            <div>
                                <button type="button" className="btn btn-primary btn-sm m-1" onClick={() => exportTable('csv')}>
                                    <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                    CSV
                                </button>
                            </div>
                            <div>
                                <button type="button" className="btn btn-primary btn-sm m-1" onClick={() => window.print()}>
                                    <IconPrinter className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                    PRINT
                                </button>
                            </div>
                        </div>
                        <div className="text-right">
                            <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <button type="button" onClick={() => setShowCalculateModal(true)} className="btn btn-primary">
                            <IconCalculator className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            Hitung Gaji
                        </button>
                    </div>
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'nama', title: 'Nama Karyawan', sortable: true },
                            { accessor: 'role', title: 'Role', sortable: true },
                            { accessor: 'periode', title: 'Periode', sortable: true },
                            { 
                                accessor: 'units_completed', 
                                title: 'Unit Selesai', 
                                sortable: true,
                                render: ({ units_completed, role }) => 
                                    `${units_completed} ${role === 'driver' ? 'pengiriman' : 'ton'}`
                            },
                            { 
                                accessor: 'unit_rate', 
                                title: 'Rate per Unit', 
                                sortable: true,
                                render: ({ unit_rate }) => formatCurrency(unit_rate)
                            },
                            { 
                                accessor: 'total_salary', 
                                title: 'Total Gaji', 
                                sortable: true,
                                render: ({ total_salary }) => (
                                    <span className="font-semibold text-success">
                                        {formatCurrency(total_salary)}
                                    </span>
                                )
                            },
                        ]}
                        totalRecords={filteredRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                        fetching={loading}
                    />
                </div>
            </div>

            {/* Calculate Modal */}
            {showCalculateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowCalculateModal(false)}></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-md">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Hitung Gaji Karyawan
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Pilih Karyawan
                                        </label>
                                        <select
                                            className="form-select w-full"
                                            value={calculationForm.user_id}
                                            onChange={(e) => setCalculationForm({...calculationForm, user_id: e.target.value})}
                                            required
                                        >
                                            <option value="">Pilih Karyawan</option>
                                            {users.map((user) => (
                                                <option key={user.user_id} value={user.user_id}>
                                                    {user.nama} ({user.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Periode (Bulan/Tahun)
                                        </label>
                                        <input
                                            type="month"
                                            className="form-input w-full"
                                            value={calculationForm.periode}
                                            onChange={(e) => setCalculationForm({...calculationForm, periode: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {calculationForm.user_id && users.find(u => u.user_id.toString() === calculationForm.user_id)?.role === 'driver' 
                                                ? 'Jumlah Pengiriman' 
                                                : 'Jumlah Ton Produksi'}
                                        </label>
                                        <input
                                            type="number"
                                            className="form-input w-full"
                                            placeholder="Masukkan jumlah unit"
                                            value={calculationForm.units_completed}
                                            onChange={(e) => setCalculationForm({...calculationForm, units_completed: e.target.value})}
                                            required
                                        />
                                    </div>
                                    {calculationForm.user_id && (
                                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                <strong>Rate: </strong>
                                                {(() => {
                                                    const user = users.find(u => u.user_id.toString() === calculationForm.user_id);
                                                    const setting = settingGajis.find(s => s.role === user?.role);
                                                    return setting ? formatCurrency(setting.gaji) : 'N/A';
                                                })()}
                                                {' per '}
                                                {users.find(u => u.user_id.toString() === calculationForm.user_id)?.role === 'driver' 
                                                    ? 'pengiriman' 
                                                    : 'ton'}
                                            </p>
                                            {calculationForm.units_completed && (
                                                <p className="text-sm font-semibold text-success mt-1">
                                                    <strong>Estimasi Total: </strong>
                                                    {(() => {
                                                        const user = users.find(u => u.user_id.toString() === calculationForm.user_id);
                                                        const setting = settingGajis.find(s => s.role === user?.role);
                                                        const total = setting ? parseInt(calculationForm.units_completed) * setting.gaji : 0;
                                                        return formatCurrency(total);
                                                    })()}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            setShowCalculateModal(false);
                                            resetCalculationForm();
                                        }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={calculateUserSalary}
                                        disabled={!calculationForm.user_id || !calculationForm.units_completed}
                                    >
                                        Hitung Gaji
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerhitunganGaji;