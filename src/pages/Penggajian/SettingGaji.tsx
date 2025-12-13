import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconFile from '../../components/Icon/IconFile';
import IconPrinter from '../../components/Icon/IconPrinter';
import Swal from 'sweetalert2';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

interface SettingGaji {
    id_setting_gaji: number;
    role: string;
    gaji: number;
    keterangan: string;
    created_at: string;
    updated_at: string;
}

const SettingGaji = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Setting Gaji'));
    });

    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<SettingGaji[]>([]);
    const [recordsData, setRecordsData] = useState<SettingGaji[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<SettingGaji[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id_setting_gaji',
        direction: 'asc',
    });

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<SettingGaji | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
    const [editValues, setEditValues] = useState<{ [key: number]: { gaji: string } }>({});

    // Form state
    const [formData, setFormData] = useState({
        role: '',
        gaji: '',
        keterangan: '',
    });

    // Fetch data from API
    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                Swal.fire('Kesalahan', 'Token autentikasi tidak ditemukan', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('setting-gaji/all'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil data');
            }

            const result = await response.json();
            // Ambil data dari pagination response
            const data = result.data || result;
            setInitialRecords(Array.isArray(data) ? data : []);
            setFilteredRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Kesalahan saat mengambil data setting gaji:', error);
            setInitialRecords([]);
            setFilteredRecords([]);
            Swal.fire('Kesalahan', 'Tidak dapat mengambil data setting gaji', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        // Pastikan filteredRecords adalah array sebelum menggunakan slice
        if (Array.isArray(filteredRecords)) {
            setRecordsData([...filteredRecords.slice(from, to)]);
        } else {
            setRecordsData([]);
        }
    }, [page, pageSize, filteredRecords]);

    useEffect(() => {
        // Pastikan initialRecords adalah array sebelum filter
        if (Array.isArray(initialRecords)) {
            const filteredData = initialRecords.filter((item) => {
                return item.role.toLowerCase().includes(search.toLowerCase()) || item.keterangan.toLowerCase().includes(search.toLowerCase()) || item.gaji.toString().includes(search.toLowerCase());
            });
            setFilteredRecords(filteredData);
        } else {
            setFilteredRecords([]);
        }
        setPage(1);
    }, [search, initialRecords]);

    useEffect(() => {
        // Pastikan filteredRecords adalah array sebelum sorting
        if (Array.isArray(filteredRecords)) {
            const data = sortBy(filteredRecords, sortStatus.columnAccessor);
            const sortedData = sortStatus.direction === 'desc' ? data.reverse() : data;
            setFilteredRecords(sortedData);
        }
        setPage(1);
    }, [sortStatus]);

    // Reset form
    const resetForm = () => {
        setFormData({
            role: '',
            gaji: '',
            keterangan: '',
        });
        setEditingItem(null);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Get unit description based on role
    const getUnitDescription = (role: string) => {
        switch (role.toLowerCase()) {
            case 'driver':
                return 'per pengiriman';
            case 'karyawan':
                return 'per ton produksi';
            default:
                return 'per unit';
        }
    };

    // Toggle edit mode for specific card
    const toggleEditMode = (id: number) => {
        if (editMode[id]) {
            // Jika sedang edit, reset nilai
            const newEditValues = { ...editValues };
            delete newEditValues[id];
            setEditValues(newEditValues);
        } else {
            // Jika masuk edit mode, set nilai awal
            const item = filteredRecords.find(item => item.id_setting_gaji === id);
            if (item) {
                setEditValues({
                    ...editValues,
                    [id]: { gaji: item.gaji.toString() }
                });
            }
        }
        
        setEditMode({
            ...editMode,
            [id]: !editMode[id]
        });
    };

    // Update edit value
    const updateEditValue = (id: number, field: string, value: string) => {
        setEditValues({
            ...editValues,
            [id]: {
                ...editValues[id],
                [field]: value
            }
        });
    };

    // Save edited item
    const saveEditedItem = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Kesalahan', 'Token autentikasi tidak ditemukan', 'error');
            return;
        }

        const editValue = editValues[id];
        if (!editValue || !editValue.gaji) {
            Swal.fire('Kesalahan', 'Nilai gaji harus diisi', 'error');
            return;
        }

        try {
            const item = filteredRecords.find(item => item.id_setting_gaji === id);
            if (!item) return;

            const response = await fetch(buildApiUrl(`setting-gaji/${id}`), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    role: item.role,
                    gaji: parseInt(editValue.gaji),
                    keterangan: item.keterangan,
                }),
            });

            if (!response.ok) {
                throw new Error('Gagal memperbarui data');
            }

            Swal.fire('Berhasil', 'Setting gaji berhasil diperbarui!', 'success');
            
            // Reset edit mode dan reload data
            const newEditMode = { ...editMode };
            const newEditValues = { ...editValues };
            delete newEditMode[id];
            delete newEditValues[id];
            setEditMode(newEditMode);
            setEditValues(newEditValues);
            
            fetchData();
        } catch (error) {
            console.error('Kesalahan saat memperbarui setting gaji:', error);
            Swal.fire('Kesalahan', 'Gagal memperbarui setting gaji', 'error');
        }
    };

    // Handle add
    const handleAdd = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl('setting-gaji'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    role: formData.role,
                    gaji: parseInt(formData.gaji),
                    keterangan: formData.keterangan,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add data');
            }

            Swal.fire('Success', 'Setting gaji berhasil ditambahkan!', 'success');
            setShowAddModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error adding data:', error);
            Swal.fire('Error', 'Gagal menambahkan setting gaji', 'error');
        }
    };

    // Handle edit
    const handleEdit = async () => {
        if (!editingItem) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl(`setting-gaji/${editingItem.id_setting_gaji}`), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    role: formData.role,
                    gaji: parseInt(formData.gaji),
                    keterangan: formData.keterangan,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update data');
            }

            Swal.fire('Success', 'Setting gaji berhasil diperbarui!', 'success');
            setShowEditModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error updating data:', error);
            Swal.fire('Error', 'Gagal memperbarui setting gaji', 'error');
        }
    };

    // Handle delete
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Apakah Anda yakin?',
            text: 'Data setting gaji akan dihapus secara permanen!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(buildApiUrl(`setting-gaji/${id}`), {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error('Failed to delete data');
                }

                Swal.fire('Terhapus!', 'Setting gaji berhasil dihapus.', 'success');
                fetchData();
            } catch (error) {
                console.error('Error deleting data:', error);
                Swal.fire('Error', 'Gagal menghapus setting gaji', 'error');
            }
        }
    };

    // Open edit modal
    const openEditModal = (item: SettingGaji) => {
        setEditingItem(item);
        setFormData({
            role: item.role,
            gaji: item.gaji.toString(),
            keterangan: item.keterangan,
        });
        setShowEditModal(true);
    };

    // Export functions
    const exportTable = (type: string) => {
        let columns: any = ['Role', 'Gaji', 'Keterangan'];
        let records = filteredRecords.map((item: SettingGaji) => ({
            Role: item.role,
            Gaji: formatCurrency(item.gaji),
            Keterangan: item.keterangan,
        }));

        if (type === 'xlsx') {
            // Simple CSV export as alternative
            const csvContent = [columns.join(','), ...records.map((record) => Object.values(record).join(','))].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'setting_gaji.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Panel */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h2 className="text-xl">Setting Gaji    </h2>
            </div>

          

            {/* Loading State */}
            {loading ? (
                <div className="panel">
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Memuat data setting gaji...</span>
                    </div>
                </div>
            ) : (
                <>
                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6">
                        {filteredRecords.map((item) => (
                            <div key={item.id_setting_gaji} className="panel p-0">
                                <div
                                    className="panel h-full overflow-hidden before:bg-[#1937cc] before:absolute before:-right-44 before:top-0 before:bottom-0 before:m-auto before:rounded-full before:w-96 before:h-96 grid grid-cols-1 content-between relative min-h-[200px]"
                                    style={{ background: 'linear-gradient(0deg,#00c6fb -227%,#005bea)' }}
                                >
                                    {/* Header dengan Role dan Gaji */}
                                    <div className="flex items-start justify-between text-white-light mb-6 z-[7]">
                                        <div>
                                            <h5 className="font-bold text-lg capitalize mb-1">{item.role}</h5>
                                            
                                        </div>

                                        <div className="relative text-right">
                                            {editMode[item.id_setting_gaji] ? (
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        type="number"
                                                        className="form-input bg-white/20 text-white placeholder-white/70 border-white/30 text-sm w-32"
                                                        placeholder="Masukkan gaji"
                                                        value={editValues[item.id_setting_gaji]?.gaji || ''}
                                                        onChange={(e) => updateEditValue(item.id_setting_gaji, 'gaji', e.target.value)}
                                                    />
                                                    <span className="text-xs opacity-75">Rupiah</span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-lg font-bold">{formatCurrency(item.gaji)}</div>
                                                    <span className="text-xs bg-[#4361ee] rounded px-2 py-1 mt-1 inline-block">
                                                        {getUnitDescription(item.role)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Keterangan */}
                                    <div className="text-white-light text-sm mb-6 z-[7] flex-grow">
                                        {item.keterangan ? (
                                            <div className="bg-white/10 rounded-lg p-3">
                                                <p className="opacity-90 leading-relaxed">{item.keterangan}</p>
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="opacity-60 italic">Tidak ada keterangan</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between z-10">
                                       
                                        <button 
                                            type="button" 
                                            className="shadow-[0_0_2px_0_#bfc9d4] rounded px-4 py-2 text-white-light hover:bg-[#4361ee] z-10 text-sm font-medium transition-colors"
                                            onClick={() => {
                                                if (editMode[item.id_setting_gaji]) {
                                                    saveEditedItem(item.id_setting_gaji);
                                                } else {
                                                    toggleEditMode(item.id_setting_gaji);
                                                }
                                            }}
                                        >
                                            {editMode[item.id_setting_gaji] ? (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Simpan
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredRecords.length === 0 && !loading && (
                        <div className="panel">
                            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                                <IconFile className="w-20 h-20 mb-4 opacity-30" />
                                <h3 className="text-xl font-semibold mb-2">Tidak ada data setting gaji</h3>
                                <p className="text-center max-w-md">
                                    {search ? 
                                        `Tidak ditemukan data setting gaji untuk pencarian "${search}"` : 
                                        'Belum ada data setting gaji yang tersedia. Pastikan seeder sudah dijalankan.'}
                                </p>
                                {search && (
                                    <button 
                                        className="btn btn-primary mt-4"
                                        onClick={() => setSearch('')}
                                    >
                                        Hapus Filter
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SettingGaji;
