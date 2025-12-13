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

// Tipe data untuk Jurusan
type Jurusan = {
    jurusan_id: number;
    ruangan: string;
};

const MasterDataRuangan = () => {
    const dispatch = useDispatch();
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

    useEffect(() => {
        dispatch(setPageTitle('Master Data Ruangan'));
        fetchJurusanList();
    }, []);

    const [addModal, setAddModal] = useState(false);
    const [search, setSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [params, setParams] = useState<Jurusan>({ jurusan_id: 0, ruangan: '' });
    const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
    const [initialRecords, setInitialRecords] = useState<Jurusan[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Fungsi untuk mengambil data jurusan dari API
    const fetchJurusanList = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Kesalahan', 'Token autentikasi tidak ditemukan', 'error');
            return;
        }

        setLoading(true);
        try {
            // Destroy DataTable before updating state
            destroyDataTable();
            
            const response = await fetch(buildApiUrl('jurusans'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil data');
            }

            const data = await response.json();
            setJurusanList(data);
            setInitialRecords(data);
        } catch (error) {
            console.error('Kesalahan saat mengambil data jurusan:', error);
            Swal.fire('Kesalahan', 'Tidak dapat mengambil data jurusan', 'error');
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
                const searchWrapper = document.getElementById('ruangan-search-wrapper');
                const lengthWrapper = document.querySelector('.dataTables_length')?.parentElement;
                if (searchWrapper && lengthWrapper) {
                    lengthWrapper.appendChild(searchWrapper);
                }
            }, 0);
        }

        return () => destroyDataTable();
    }, [jurusanList, loading]);

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

    const showMessage = (msg = '', type: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success') => {
        Swal.fire({ icon: type, title: msg, toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000 });
    };

    const saveItem = async () => {
        if (!params.ruangan) {
            showMessage('Jurusan harus diisi.', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Kesalahan', 'Token autentikasi tidak ditemukan', 'error');
            return;
        }

        if (params.jurusan_id) {
            try {
                const response = await fetch(buildApiUrl(`jurusans/${params.jurusan_id}`), {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ ruangan: params.ruangan }),
                });

                if (!response.ok) {
                    throw new Error('Gagal memperbarui data');
                }

                showMessage('Data berhasil diperbarui.');
                await fetchJurusanList();
            } catch (error) {
                console.error('Kesalahan saat memperbarui jurusan:', error);
                showMessage('Gagal memperbarui data', 'error');
            }
        } else {
            try {
                const response = await fetch(buildApiUrl('jurusans'), {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ ruangan: params.ruangan }),
                });

                if (!response.ok) {
                    throw new Error('Gagal menambahkan data');
                }

                showMessage('Data berhasil ditambahkan.');
                await fetchJurusanList();
            } catch (error) {
                console.error('Kesalahan saat menambahkan jurusan:', error);
                showMessage('Gagal menambahkan data', 'error');
            }
        }

        setAddModal(false);
        setParams({ jurusan_id: 0, ruangan: '' });
    };

    const editItem = (item: Jurusan | null) => {
        if (item) {
            setParams({ jurusan_id: item.jurusan_id, ruangan: item.ruangan });
            setAddModal(true);
        }
    };

    const deleteItem = (jurusan_id: number) => {
        // Destroy DataTable before deleting
        destroyDataTable();
        
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Kesalahan', 'Token autentikasi tidak ditemukan', 'error');
            return;
        }

        Swal.fire({
            title: 'Apakah Anda yakin?',
            text: 'Data ini tidak akan bisa dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Tidak, batalkan',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(buildApiUrl(`jurusans/${jurusan_id}`), {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                    });

                    if (response.ok) {
                        showMessage('Item berhasil dihapus.', 'success');
                        await fetchJurusanList();
                    } else {
                        throw new Error('Gagal menghapus item');
                    }
                } catch (error) {
                    console.error('Kesalahan saat menghapus item:', error);
                    Swal.fire('Kesalahan', 'Tidak dapat menghapus item', 'error');
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
                <span className="ltr:mr-3 rtl:ml-3">Dokumentasi: Master Data Ruangan/Jurusan untuk mengelola departemen dan lokasi produksi dalam sistem manajemen operasional</span>
            </div>
            <div className="flex justify-between items-center mb-5">
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setParams({ jurusan_id: 0, ruangan: '' });
                        setAddModal(true);
                    }}
                >
                    <Icon icon="solar:home-add-angle-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
                    Tambah Jurusan
                </button>
                <div id="ruangan-search-wrapper" className="relative">
                    <input
                        type="text"
                        className="form-input w-64 pl-10"
                        placeholder="Cari jurusan..."
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
                            <table ref={tableRef} id="ruanganTable" className="table-striped w-full">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 border-b-2 font-semibold text-black dark:text-white/80 whitespace-nowrap">Jurusan</th>
                                        <th className="px-4 py-3 border-b-2 font-semibold text-black dark:text-white/80 text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jurusanList.map((record) => (
                                    <tr key={record.jurusan_id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4">{record.ruangan}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => editItem(record)}
                                                >
                                                    <Icon icon="solar:pen-line-duotone" className="pr-2" width="1rem" />
                                                    Ubah
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => deleteItem(record.jurusan_id)}
                                                >
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
                                        onClick={() => setAddModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.jurusan_id ? 'Ubah Jurusan' : 'Tambah Jurusan'}
                                    </div>
                                    <div className="p-5">
                                        <form>
                                            <div className="mb-5">
                                                <label htmlFor="ruangan">Jurusan</label>
                                                <input
                                                    id="ruangan"
                                                    name="ruangan"
                                                    type="text"
                                                    placeholder="Masukkan Jurusan"
                                                    className="form-input"
                                                    value={params.ruangan}
                                                    onChange={(e) => setParams({ ...params, ruangan: e.target.value })}
                                                />
                                            </div>

                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setAddModal(false)}>
                                                    Batal
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveItem}>
                                                    {params.jurusan_id ? 'Perbarui' : 'Tambah'}
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

export default MasterDataRuangan;
