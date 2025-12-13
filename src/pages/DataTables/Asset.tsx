import { Icon } from '@iconify-icon/react';
import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconBell from '../../components/Icon/IconBell';
import IconX from '../../components/Icon/IconX';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';
import '../Inventaris/datatables-custom.css';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

// Definisikan tipe data untuk Asset
type Asset = {
    id_asset: number;
    asset: string;
};

const MasterDataAsset = () => {
    const dispatch = useDispatch();
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

    useEffect(() => {
        dispatch(setPageTitle('Master Data Asset'));
        ambilDaftarAsset();
    }, []);

    const [addModal, setAddModal] = useState(false);
    const [search, setSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [params, setParams] = useState<Asset>({
        id_asset: 0,
        asset: '',
    });

    const [daftarAsset, setDaftarAsset] = useState<Asset[]>([]);
    const [dataAwal, setDataAwal] = useState<Asset[]>([]);

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

    // Ambil daftar asset dari API
    const ambilDaftarAsset = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Token autentikasi tidak ditemukan', 'error');
            return;
        }

        try {
            setLoading(true);
            // Destroy DataTable before updating state
            destroyDataTable();
            
            // Ambil semua data tanpa pagination
            const response = await fetch(buildApiUrl('assets?limit=1000'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil data');
            }

            const data = await response.json();
            console.log('API Response:', data); // Debug log
            
            // Handle pagination response - ambil dari data.data jika ada pagination
            let assetData;
            if (data.data && Array.isArray(data.data)) {
                // Response dengan pagination - map data untuk menggunakan id_asset sebagai id
                assetData = data.data.map((item: any) => ({
                    id_asset: item.id_asset,
                    asset: item.asset
                }));
            } else if (Array.isArray(data)) {
                // Response langsung array - map data untuk menggunakan id_asset sebagai id
                assetData = data.map((item: any) => ({
                    id_asset: item.id_asset,
                    asset: item.asset
                }));
            } else {
                throw new Error('Format data tidak sesuai');
            }
            
            console.log('Processed Data:', assetData); // Debug log
            setDaftarAsset(assetData);
            setDataAwal(assetData);
        } catch (error) {
            console.error('Error mengambil asset:', error);
            Swal.fire('Error', 'Tidak dapat mengambil data asset', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Initialize DataTable
    useEffect(() => {
        if (loading) return;
        
        // Destroy existing DataTable before reinitializing
        destroyDataTable();
        
        if (tableRef.current) {
            dataTableRef.current = new DataTable(tableRef.current, {
                pageLength: 10,
                lengthMenu: [5, 10, 25, 50],
                searching: true,
                ordering: true,
                order: [[0, 'asc']],
                info: true,
                paging: true,
                language: {
                    lengthMenu: 'Tampilkan _MENU_ data per halaman',
                    zeroRecords: 'Data tidak ditemukan',
                    info: 'Menampilkan halaman _PAGE_ dari _PAGES_',
                    infoEmpty: 'Tidak ada data yang tersedia',
                    infoFiltered: '(difilter dari _MAX_ total data)',
                    paginate: {
                        first: '<iconify-icon icon="mdi:chevron-double-left" style="font-size: 1.25rem;"></iconify-icon>',
                        last: '<iconify-icon icon="mdi:chevron-double-right" style="font-size: 1.25rem;"></iconify-icon>',
                        next: '<iconify-icon icon="mdi:chevron-right" style="font-size: 1.25rem;"></iconify-icon>',
                        previous: '<iconify-icon icon="mdi:chevron-left" style="font-size: 1.25rem;"></iconify-icon>',
                    },
                },
                dom: '<"flex justify-between items-center mb-4"l>rt<"flex justify-between items-center mt-4"ip>',
                columnDefs: [
                    {
                        targets: -1,
                        orderable: false,
                    },
                ],
            });

            // Move custom search input into DataTables wrapper for proper alignment
            setTimeout(() => {
                const searchWrapper = document.getElementById('asset-search-wrapper');
                const lengthWrapper = document.querySelector('.dataTables_length')?.parentElement;
                if (searchWrapper && lengthWrapper) {
                    lengthWrapper.appendChild(searchWrapper);
                }
            }, 0);
        }

        return () => destroyDataTable();
    }, [daftarAsset, loading]);

    // Custom search handler
    useEffect(() => {
        if (dataTableRef.current) {
            setIsSearching(true);
            const timeoutId = setTimeout(() => {
                dataTableRef.current?.search(search).draw();
                setIsSearching(false);
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [search]);

    const tampilkanPesan = (
        msg = '',
        type: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success'
    ) => {
        Swal.fire({
            icon: type,
            title: msg,
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
        });
    };

    // Simpan atau perbarui data asset
    const simpanData = async () => {
        if (!params.asset.trim()) {
            tampilkanPesan('Nama asset wajib diisi.', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Token autentikasi tidak ditemukan', 'error');
            return;
        }

        try {
            const method = params.id_asset ? 'PUT' : 'POST';
            const url = params.id_asset
                ? buildApiUrl(`assets/${params.id_asset}`)
                : buildApiUrl('assets');

            const requestBody = {
                asset: params.asset.trim(),
            };

            console.log('Request body:', requestBody); // Debug log
            console.log('Method:', method, 'URL:', url); // Debug log

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(requestBody),
            });

            const responseData = await response.json();
            console.log('Response:', responseData); // Debug log

            if (!response.ok) {
                throw new Error(responseData.message || `Gagal ${params.id_asset ? 'memperbarui' : 'menambah'} data`);
            }

            // Tampilkan pesan sukses
            tampilkanPesan(`Data berhasil ${params.id_asset ? 'diperbarui' : 'ditambahkan'}.`);
            setAddModal(false);
            setParams({ id_asset: 0, asset: '' });

            // Refresh data
            await ambilDaftarAsset();
        } catch (error: any) {
            console.error('Error saving asset:', error);
            tampilkanPesan(error.message || 'Terjadi kesalahan saat menyimpan data.', 'error');
        }
    };

    // Edit data asset
    const editData = (data: Asset) => {
        setParams({
            id_asset: data.id_asset,
            asset: data.asset,
        });
        setAddModal(true);
    };

    // Hapus data asset
    const hapusData = (id: number) => {
        Swal.fire({
            title: 'Konfirmasi',
            text: 'Apakah Anda yakin ingin menghapus data asset ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Destroy DataTable before deleting
                destroyDataTable();
                
                const token = localStorage.getItem('token');
                if (!token) {
                    Swal.fire('Error', 'Token autentikasi tidak ditemukan', 'error');
                    return;
                }

                try {
                    const response = await fetch(buildApiUrl(`assets/${id}`), {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                    });

                    const responseData = await response.json();

                    if (!response.ok) {
                        throw new Error(responseData.message || 'Gagal menghapus data');
                    }

                    tampilkanPesan('Data berhasil dihapus.');
                    await ambilDaftarAsset();
                } catch (error: any) {
                    console.error('Error deleting asset:', error);
                    tampilkanPesan(error.message || 'Terjadi kesalahan saat menghapus data.', 'error');
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="panel flex items-center overflow-x-auto whitespace-nowrap p-3 text-primary">
                <div className="rounded-full bg-primary p-1.5 text-white ring-2 ring-primary/30 ltr:mr-3 rtl:ml-3">
                    <IconBell />
                </div>
                <span className="ltr:mr-3 rtl:ml-3">Dokumentasi: Master Data Asset untuk mengelola data aset kendaraan dan mesin</span>
            </div>
            <div className="flex justify-between items-center mb-5">
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setParams({ id_asset: 0, asset: '' });
                        setAddModal(true);
                    }}
                >
                    <Icon icon="solar:widget-add-line-duotone" className="ltr:mr-2 " width="1.2rem" />
                    Tambah Asset
                </button>
                <div id="asset-search-wrapper" className="relative">
                    <input
                        type="text"
                        className="form-input w-64 pl-10"
                        placeholder="Cari nama asset..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Icon
                        icon="ic:outline-search"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        width="1.25rem"
                    />
                    {isSearching && (
                        <Icon
                            icon="eos-icons:loading"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                            width="1.25rem"
                        />
                    )}
                </div>
            </div>
            <div className="panel">
                <div className="overflow-x-auto">
                    <div className="table-responsive mb-5">
                        {loading ? (
                            <div className="text-center py-4">
                                <Icon icon="eos-icons:loading" className="text-primary mx-auto" width="2rem" />
                                <p className="mt-2 text-gray-500">Memuat data...</p>
                            </div>
                        ) : (
                            <table ref={tableRef} id="assetTable" className="table-striped w-full">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 border-b-2 font-semibold text-black dark:text-white whitespace-nowrap">Nama Asset</th>
                                        <th className="px-4 py-3 border-b-2 font-semibold text-black dark:text-white text-center whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {daftarAsset.map((record, index) => (
                                        <tr key={`${record.id_asset}-${index}`} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-6 py-4 whitespace-nowrap">{record.asset}</td>
                                            <td className="px-4 py-2 text-center whitespace-nowrap">
                                                <div className="flex gap-2 justify-center">
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => editData(record)}>
                                                        <Icon icon="solar:pen-line-duotone" className="pr-2" width="1rem" />
                                                        Edit
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => hapusData(record.id_asset)}>
                                                        <Icon icon="solar:trash-bin-minimalistic-line-duotone" className="pr-2" width="1rem" />
                                                        Hapus
                                                    </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    </div>
                </div>
            </div>

            <Transition appear show={addModal} as={Fragment}>
                <Dialog as="div" open={addModal} onClose={() => setAddModal(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button type="button" onClick={() => setAddModal(false)} className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none">
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.id_asset ? 'Edit Asset' : 'Tambah Asset'}
                                    </div>
                                    <div className="p-5">
                                        <form>
                                            <div className="mb-5">
                                                <label htmlFor="asset">Nama Asset *</label>
                                                <input 
                                                    id="asset" 
                                                    type="text" 
                                                    placeholder="Masukkan Nama Asset" 
                                                    className="form-input" 
                                                    value={params.asset} 
                                                    onChange={(e) => setParams({ ...params, asset: e.target.value })} 
                                                />
                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setAddModal(false)}>
                                                    Batal
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={simpanData}>
                                                    {params.id_asset ? 'Perbarui' : 'Tambah'}
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

export default MasterDataAsset;