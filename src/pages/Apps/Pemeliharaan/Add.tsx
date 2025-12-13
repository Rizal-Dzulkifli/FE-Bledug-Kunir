import React, { useState, useEffect, Fragment, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../../components/Icon/IconX';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';

interface Asset {
    id_asset: number;
    asset: string;
}

interface User {
    user_id: number;
    nama: string;
}

interface Pemeliharaan {
    pemeliharaan_id: number;
    nomor_pemeliharaan: string;
    tanggal_pemeliharaan: string;
    biaya: number;
    keterangan: string;
    created_at: string;
    user: User;
    asset: Asset;
}

const PemeliharaanAsset = () => {
    const { asset_id } = useParams<{ asset_id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [assetDetail, setAssetDetail] = useState<Asset | null>(null);
    const [pemeliharaanList, setPemeliharaanList] = useState<Pemeliharaan[]>([]);
    const [loading, setLoading] = useState(true);
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Pemeliharaan | null>(null);
    const [formData, setFormData] = useState({
        tanggal_pemeliharaan: new Date().toISOString().split('T')[0], // Default ke hari ini
        biaya: '',
        keterangan: ''
    });
    const [editFormData, setEditFormData] = useState({
        tanggal_pemeliharaan: '',
        biaya: '',
        keterangan: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    // Get selected asset from location state if available
    const selectedAsset = location.state?.selectedAsset as Asset;

    // Helper function to safely destroy DataTable
    const destroyDataTable = () => {
        if (dataTableRef.current) {
            try {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            } catch (e) {
                console.log('Error destroying DataTable:', e);
            }
        }
    };

    useEffect(() => {
        if (selectedAsset) {
            setAssetDetail(selectedAsset);
            fetchPemeliharaanByAsset(selectedAsset.id_asset);
        } else if (asset_id) {
            fetchAssetDetail();
            fetchPemeliharaanByAsset(parseInt(asset_id));
        }
    }, [asset_id, selectedAsset]);

    const fetchAssetDetail = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(`http://localhost:3333/api/assets/${asset_id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to fetch asset detail');
            }

            const data = await response.json();
            setAssetDetail(data);
        } catch (error) {
            console.error('Error fetching asset detail:', error);
            Swal.fire('Error', 'Unable to fetch asset detail', 'error');
        }
    };

    const fetchPemeliharaanByAsset = async (assetId: number) => {
        try {
            setLoading(true);
            
            // Destroy DataTable before updating state
            destroyDataTable();
            
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            console.log('Fetching pemeliharaan for asset:', assetId);
            const url = `http://localhost:3333/api/pemeliharaan?asset_id=${assetId}&limit=1000`;
            console.log('API URL:', url);

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const result = await response.json();
                console.error('API Error:', result);
                throw new Error(result.message || 'Failed to fetch pemeliharaan');
            }

            const data = await response.json();
            console.log('API Response data:', data);
            setPemeliharaanList(data.data || []);
        } catch (error) {
            console.error('Error fetching pemeliharaan:', error);
            Swal.fire('Error', 'Unable to fetch pemeliharaan data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pemeliharaan_id: number) => {
        const result = await Swal.fire({
            title: 'Apakah Anda yakin?',
            text: 'Data pemeliharaan ini akan dihapus permanen!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                // Destroy DataTable before deleting to prevent DOM conflicts
                destroyDataTable();
                
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3333/api/pemeliharaan/${pemeliharaan_id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    Swal.fire('Berhasil!', 'Data pemeliharaan berhasil dihapus.', 'success');
                    // Refresh data
                    if (assetDetail) {
                        fetchPemeliharaanByAsset(assetDetail.id_asset);
                    }
                } else {
                    const errorData = await response.json();
                    Swal.fire('Error', errorData.message || 'Gagal menghapus data', 'error');
                }
            } catch (error) {
                console.error('Error deleting pemeliharaan:', error);
                Swal.fire('Error', 'Terjadi kesalahan saat menghapus data', 'error');
            }
        }
    };

    const handleAddPemeliharaan = async () => {
        if (!assetDetail) return;
        
        setFormLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3333/api/pemeliharaan', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    asset_id: assetDetail.id_asset,
                    tanggal_pemeliharaan: formData.tanggal_pemeliharaan,
                    biaya: parseFloat(formData.biaya.replace(/[^\d]/g, '')) || 0,
                    keterangan: formData.keterangan
                }),
            });

            if (response.ok) {
                Swal.fire('Berhasil', 'Data pemeliharaan berhasil ditambahkan', 'success');
                setShowModal(false);
                setFormData({ 
                    tanggal_pemeliharaan: new Date().toISOString().split('T')[0],
                    biaya: '', 
                    keterangan: '' 
                });
                fetchPemeliharaanByAsset(assetDetail.id_asset);
            } else {
                throw new Error('Gagal menambahkan data pemeliharaan');
            }
        } catch (error) {
            console.error('Error adding pemeliharaan:', error);
            Swal.fire('Error', 'Gagal menambahkan data pemeliharaan', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const formatRupiah = (value: string | number) => {
        // Convert to string and remove all non-digit characters
        const stringValue = value.toString();
        const numericValue = stringValue.replace(/[^\d]/g, '');
        
        // Format with thousands separator
        if (numericValue && numericValue !== '0') {
            return new Intl.NumberFormat('id-ID').format(parseInt(numericValue));
        }
        return '';
    };

    const formatRupiahFromNumber = (value: number) => {
        // Direct formatting from number (for data from database)
        if (value && value > 0) {
            return new Intl.NumberFormat('id-ID').format(value);
        }
        return '';
    };

    const handleBiayaChange = (value: string) => {
        // Only allow numbers and format as Rupiah
        const formattedValue = formatRupiah(value);
        setFormData({...formData, biaya: formattedValue});
    };

    const handleEditBiayaChange = (value: string) => {
        // Only allow numbers and format as Rupiah
        const formattedValue = formatRupiah(value);
        setEditFormData({...editFormData, biaya: formattedValue});
    };

    const handleEdit = (item: Pemeliharaan) => {
        setEditingItem(item);
        setEditFormData({
            tanggal_pemeliharaan: item.tanggal_pemeliharaan ? new Date(item.tanggal_pemeliharaan).toISOString().split('T')[0] : '',
            biaya: formatRupiahFromNumber(item.biaya),
            keterangan: item.keterangan || ''
        });
        setShowEditModal(true);
    };

    const handleUpdatePemeliharaan = async () => {
        if (!editingItem) return;
        
        setFormLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3333/api/pemeliharaan/${editingItem.pemeliharaan_id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tanggal_pemeliharaan: editFormData.tanggal_pemeliharaan,
                    biaya: parseFloat(editFormData.biaya.replace(/[^\d]/g, '')) || 0,
                    keterangan: editFormData.keterangan
                }),
            });

            if (response.ok) {
                Swal.fire('Berhasil', 'Data pemeliharaan berhasil diperbarui', 'success');
                setShowEditModal(false);
                setEditingItem(null);
                fetchPemeliharaanByAsset(assetDetail?.id_asset || parseInt(asset_id || '0'));
            } else {
                throw new Error('Gagal memperbarui data pemeliharaan');
            }
        } catch (error) {
            console.error('Error updating pemeliharaan:', error);
            Swal.fire('Error', 'Gagal memperbarui data pemeliharaan', 'error');
        } finally {
            setFormLoading(false);
        }
    };    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    // Initialize DataTable
    useEffect(() => {
        // Jika masih loading, jangan inisialisasi
        if (loading) return;

        // Destroy existing DataTable jika ada
        destroyDataTable();

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            if (tableRef.current && !dataTableRef.current) {
                try {
                    dataTableRef.current = new DataTable(tableRef.current, {
                        pageLength: 10,
                        lengthMenu: [5, 10, 25, 50],
                        searching: true,
                        ordering: true,
                        paging: true,
                        info: true,
                        autoWidth: false,
                        retrieve: true,
                        destroy: true,
                        order: [[1, 'desc']], // Sort by Nomor Pemeliharaan descending
                        language: {
                            lengthMenu: 'Tampilkan _MENU_ data per halaman',
                            zeroRecords: 'Data tidak ditemukan',
                            info: 'Menampilkan halaman _PAGE_ dari _PAGES_',
                            infoEmpty: 'Tidak ada data',
                            infoFiltered: '(difilter dari _MAX_ total data)',
                            paginate: {
                                first: '<iconify-icon icon="mdi:chevron-double-left" style="font-size: 1.25rem;"></iconify-icon>',
                                last: '<iconify-icon icon="mdi:chevron-double-right" style="font-size: 1.25rem;"></iconify-icon>',
                                next: '<iconify-icon icon="mdi:chevron-right" style="font-size: 1.25rem;"></iconify-icon>',
                                previous: '<iconify-icon icon="mdi:chevron-left" style="font-size: 1.25rem;"></iconify-icon>',
                            },
                            search: 'Cari:',
                            emptyTable: 'Tidak ada data tersedia'
                        },
                        dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>',
                        columnDefs: [
                            {
                                targets: -1, // Last column (Aksi)
                                orderable: false,
                            },
                        ],
                    });
                } catch (error) {
                    console.error('Error initializing DataTable:', error);
                }
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [pemeliharaanList, loading]);

    const handleCreateNew = () => {
        setShowModal(true);
    };

    const getAssetIcon = (assetName: string) => {
        const name = assetName.toLowerCase();
        if (name.includes('truk')) {
            return 'solar:truck-bold-duotone';
        } else if (name.includes('mesin')) {
            return 'solar:settings-bold-duotone';
        } else {
            return 'solar:widget-4-bold-duotone';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header dengan informasi asset */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
               
                        onClick={() => navigate('/pemeliharaan')}
                    >
                        <Icon icon="solar:arrow-left-line-duotone" width="24" height="24" />
                    
                    </button>
                    {assetDetail && (
                        <div className="flex items-center gap-3">
                            <div className="bg-primary text-white-light w-12 h-12 rounded-md flex items-center justify-center">
                                <Icon icon="svg-spinners:blocks-scale" width="24" height="24" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Pemeliharaan - {assetDetail.asset}</h2>
                                <p className="text-gray-600">Riwayat pemeliharaan untuk asset ini</p>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="btn btn-primary gap-2"
                    onClick={handleCreateNew}
                >
                    <Icon icon="solar:add-circle-line-duotone" width="1rem" height="1rem" />
                    Tambah Pemeliharaan
                </button>
            </div>

            {/* Tabel Pemeliharaan */}
            <div className="mt-5 panel p-5 border-0">
                {loading ? (
                    <div className="text-center py-4">
                        <Icon icon="eos-icons:loading" className="text-primary mx-auto" width="2rem" />
                        <p className="mt-2 text-gray-500">Memuat data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="datatables">
                            <table ref={tableRef} id="pemeliharaanTable" className="table-striped table-hover" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nomor Pemeliharaan</th>
                                        <th>Tanggal</th>
                                        <th>Biaya</th>
                                        <th>Keterangan</th>
                                        <th>Oleh</th>
                                        <th className="text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pemeliharaanList.map((item, index) => (
                                    <tr key={item.pemeliharaan_id}>
                                        <td>{index + 1}</td>
                                        <td>{item.nomor_pemeliharaan}</td>
                                        <td>{formatDate(item.tanggal_pemeliharaan)}</td>
                                        <td>Rp {parseFloat(item.biaya.toString()).toLocaleString()}</td>
                                        <td>{item.keterangan}</td>
                                        <td>{item.user?.nama || 'N/A'}</td>
                                        <td className="text-center">
                                            <ul className="flex items-center justify-center gap-2">
                                                <li>
                                                    <Tippy content="Edit">
                                                        <button
                                                            type="button"
                                                            className="group"
                                                            onClick={() => handleEdit(item)}
                                                        >
                                                            <Icon icon="solar:pen-new-square-line-duotone" width="1.2rem" height="1.2rem" />
                                                        </button>
                                                    </Tippy>
                                                </li>
                                                <li>
                                                    <Tippy content="Hapus">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(item.pemeliharaan_id)}
                                                            className='text-danger'
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-line-duotone" width="1.2rem" height="1.2rem" />
                                                        </button>
                                                    </Tippy>
                                                </li>
                                            </ul>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form Tambah Pemeliharaan */}
            <Transition appear show={showModal} as={Fragment}>
                <Dialog as="div" open={showModal} onClose={() => setShowModal(false)} className="relative z-[51]">
                    <Transition.Child 
                        as={Fragment} 
                        enter="ease-out duration-300" 
                        enterFrom="opacity-0" 
                        enterTo="opacity-100" 
                        leave="ease-in duration-200" 
                        leaveFrom="opacity-100" 
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        Tambah Pemeliharaan
                                        {assetDetail && (
                                            <div className="text-sm font-normal text-gray-600 dark:text-gray-300 mt-1">
                                                Asset: {assetDetail.asset}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <form onSubmit={(e) => { e.preventDefault(); handleAddPemeliharaan(); }}>
                                            <div className="mb-5">
                                                <label htmlFor="tanggal_pemeliharaan" className="block text-sm font-medium mb-2">Tanggal Pemeliharaan</label>
                                                <input
                                                    id="tanggal_pemeliharaan"
                                                    type="date"
                                                    className="form-input"
                                                    value={formData.tanggal_pemeliharaan}
                                                    onChange={(e) => setFormData({...formData, tanggal_pemeliharaan: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="biaya" className="block text-sm font-medium mb-2">Biaya Pemeliharaan</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                        <span className="text-gray-500 text-sm">Rp</span>
                                                    </div>
                                                    <input
                                                        id="biaya"
                                                        type="text"
                                                        className="form-input pl-10"
                                                        placeholder="0"
                                                        value={formData.biaya}
                                                        onChange={(e) => handleBiayaChange(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="keterangan" className="block text-sm font-medium mb-2">Keterangan Pemeliharaan</label>
                                                <textarea
                                                    id="keterangan"
                                                    className="form-input"
                                                    placeholder="Masukkan deskripsi pemeliharaan yang dilakukan"
                                                    rows={3}
                                                    value={formData.keterangan}
                                                    onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => setShowModal(false)}
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={formLoading}
                                                    className="btn btn-primary ltr:ml-4 rtl:mr-4"
                                                >
                                                    {formLoading ? 'Menyimpan...' : 'Tambah'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Modal Form Edit Pemeliharaan */}
            <Transition appear show={showEditModal} as={Fragment}>
                <Dialog as="div" open={showEditModal} onClose={() => setShowEditModal(false)} className="relative z-[51]">
                    <Transition.Child 
                        as={Fragment} 
                        enter="ease-out duration-300" 
                        enterFrom="opacity-0" 
                        enterTo="opacity-100" 
                        leave="ease-in duration-200" 
                        leaveFrom="opacity-100" 
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        Edit Pemeliharaan
                                        {editingItem && (
                                            <div className="text-sm font-normal text-gray-600 dark:text-gray-300 mt-1">
                                                No: {editingItem.nomor_pemeliharaan}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <form onSubmit={(e) => { e.preventDefault(); handleUpdatePemeliharaan(); }}>
                                            <div className="mb-5">
                                                <label htmlFor="edit_tanggal" className="block text-sm font-medium mb-2">Tanggal Pemeliharaan</label>
                                                <input
                                                    id="edit_tanggal"
                                                    type="date"
                                                    className="form-input"
                                                    value={editFormData.tanggal_pemeliharaan}
                                                    onChange={(e) => setEditFormData({...editFormData, tanggal_pemeliharaan: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="edit_biaya" className="block text-sm font-medium mb-2">Biaya Pemeliharaan</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                        <span className="text-gray-500 text-sm">Rp</span>
                                                    </div>
                                                    <input
                                                        id="edit_biaya"
                                                        type="text"
                                                        className="form-input pl-10"
                                                        placeholder="0"
                                                        value={editFormData.biaya}
                                                        onChange={(e) => handleEditBiayaChange(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="edit_keterangan" className="block text-sm font-medium mb-2">Keterangan Pemeliharaan</label>
                                                <textarea
                                                    id="edit_keterangan"
                                                    className="form-input"
                                                    placeholder="Masukkan deskripsi pemeliharaan yang dilakukan"
                                                    rows={3}
                                                    value={editFormData.keterangan}
                                                    onChange={(e) => setEditFormData({...editFormData, keterangan: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => setShowEditModal(false)}
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={formLoading}
                                                    className="btn btn-primary ltr:ml-4 rtl:mr-4"
                                                >
                                                    {formLoading ? 'Menyimpan...' : 'Perbarui'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default PemeliharaanAsset;
