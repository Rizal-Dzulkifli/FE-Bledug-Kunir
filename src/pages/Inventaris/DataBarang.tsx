import { Fragment, useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify-icon/react';
import { setPageTitle } from '../../store/themeConfigSlice';
import Swal from 'sweetalert2';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import IconBell from '../../components/Icon/IconBell';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

const DataBarang = () => {
    
    interface Barang {
        id: number;
        kode_barang: string;
        nama_barang: string;
        jumlah: number;
        kategori?: {
            kategori_id: number;
            kategori: string;
        };
    }

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Data Barang'));
        fetchBarangs();
        fetchKategoriList(); // Memuat data kategori dari API saat komponen dimuat
    }, []);

    const [addBarangModal, setAddBarangModal] = useState<any>(false);
    const [selectedKategori, setSelectedKategori] = useState<number | null>(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const handleFilterChange = () => {
        let filtered = barangList;

        // Filter berdasarkan kategori jika kategori dipilih
        if (selectedKategori) {
            filtered = filtered.filter((barang: Barang) => barang.kategori?.kategori_id === selectedKategori);
        }

        setFilteredItems(filtered); // Perbarui daftar yang difilter
    };

    // Reset filter saat semua pilihan dikosongkan
    useEffect(() => {
        handleFilterChange();
    }, [selectedKategori]);

    const [viewType, setViewType] = useState<any>('grid');
    const [defaultParams] = useState({
        id: null,
        kode_barang: '',
        nama_barang: '',
        jumlah: 0,
        kategori_id: null,
    });
    const [params, setParams] = useState<any>(JSON.parse(JSON.stringify(defaultParams)));
    const [barangList, setBarangList] = useState<any>([]);
    const [filteredItems, setFilteredItems] = useState<any>([]);
    const [kategoriList, setKategoriList] = useState<any[]>([]); // State untuk menyimpan daftar kategori
    const [search, setSearch] = useState<any>('');

    // Fungsi untuk mengambil data barang dari API
    const fetchBarangs = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        try {
            const response = await fetch(buildApiUrl('barang'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch barangs');
            }

            const data = await response.json();
            setBarangList(data.data || []);
            setFilteredItems(data.data || []);
        } catch (error) {
            console.error('Error fetching barangs:', error);
            Swal.fire('Error', 'Unable to fetch barangs', 'error');
        }
    };

    const fetchKategoriList = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        try {
            const response = await fetch(buildApiUrl('kategori-barang'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch kategori list');
            }

            const data = await response.json();
            const dataBarang = data.data || data;
            setKategoriList(dataBarang);
        } catch (error) {
            console.error('Error fetching kategori list:', error);
            Swal.fire('Error', 'Unable to fetch kategori list', 'error');
        }
    };

    const fetchBarangById = async (barangId: number, callback: Function) => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        try {
            const response = await fetch(buildApiUrl(`barang/${barangId}`), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch barang details');
            }

            const data = await response.json();
            setParams(data.data);
            callback();
        } catch (error) {
            console.error('Error fetching barang details:', error);
            Swal.fire('Error', 'Unable to fetch barang details', 'error');
        }
    };

    const editBarang = (barang: any = null) => {
        if (barang && barang.id) {
            fetchBarangById(barang.id, () => {
                setAddBarangModal(true);
            });
        } else {
            setParams({ ...defaultParams });
            setAddBarangModal(true);
        }
    };

    const validateForm = () => {
        let formErrors: any = {};

        if (!params.nama_barang) {
            formErrors.nama_barang = 'Nama barang tidak boleh kosong.';
        }


        if (!params.kategori_id) {
            formErrors.kategori_id = 'Kategori barang harus dipilih.';
        }

        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };
    const showMessage = (msg = '', type = 'success', isRtl = false) => {
        const toast: any = Swal.mixin({
            toast: true,
            position: isRtl ? 'bottom-start' : 'bottom-end', // posisi toast dinamis
            showConfirmButton: false,
            timer: 3000,
            customClass: { container: 'toast' },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };
    const saveBarang = async () => {
        if (!validateForm()) return;

        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        const isAddingBarang = !params.id;
        const barangData = { ...params, kategori_id: params.kategori_id || null };
        const url = isAddingBarang ? buildApiUrl('barang') : buildApiUrl(`barang/${params.id}`);
        const method = isAddingBarang ? 'POST' : 'PUT';

        try {
            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(barangData),
            });

            if (!response.ok) {
                throw new Error('Failed to save barang');
            }

            showMessage(params.user_id ? 'Data Barang berhasil diperbarui!' : 'Data Barang berhasil ditambahkan!', 'success', false);
            setAddBarangModal(false);
            fetchBarangs();
        } catch (error) {
            console.error('Error saving barang:', error);
            Swal.fire('Error', 'Unable to save barang', 'error');
        }
    };
    const [errors, setErrors] = useState<Record<string, string>>({});
    const handleSearch = (query: string) => {
        setSearch(query);
        const searchQuery = query.toLowerCase();
        const filtered = barangList.filter((barang: Barang) =>
            barang.nama_barang.toLowerCase().includes(searchQuery) ||
            barang.kode_barang.toLowerCase().includes(searchQuery)
        );
        setFilteredItems(filtered);
    };
    const showAlert = async (type: number, onConfirm: () => void) => {
        if (type === 11) {
            const swalWithBootstrapButtons = Swal.mixin({
                customClass: {
                    confirmButton: 'btn btn-danger',
                    cancelButton: 'btn btn-dark ltr:mr-3 rtl:ml-3',
                    popup: 'sweet-alerts',
                },
                buttonsStyling: false,
            });
            swalWithBootstrapButtons
                .fire({
                    title: 'Apakah Anda yakin?',
                    text: "Data ini akan dihapus dan tidak bisa dikembalikan!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, hapus!',
                    cancelButtonText: 'Tidak, batalkan!',
                    reverseButtons: true,
                    padding: '2em',
                })
                .then((result) => {
                    if (result.isConfirmed) {
                        onConfirm();
                        swalWithBootstrapButtons.fire('Terhapus!', 'Data pengguna berhasil dihapus.', 'success');
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        swalWithBootstrapButtons.fire('Dibatalkan', 'Data pengguna aman :)', 'error');
                    }
                });
        }
    };
    const handleDelete = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        try {
            // Gunakan showAlert untuk konfirmasi sebelum penghapusan
            await showAlert(11, async () => {
                const response = await fetch(buildApiUrl(`barang/${id}`), {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error('Gagal menghapus pengguna');
                }

                fetchBarangs(); // Refresh daftar pengguna setelah penghapusan
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            Swal.fire('Error', 'Tidak dapat menghapus pengguna', 'error');
        }
    };


    return (
        <div className="space-y-6">
            <div className="panel flex items-center overflow-x-auto whitespace-nowrap p-3 text-primary">
                <div className="rounded-full bg-primary p-1.5 text-white ring-2 ring-primary/30 ltr:mr-3 rtl:ml-3">
                    <IconBell />
                </div>
                <span className="ltr:mr-3 rtl:ml-3">Documentation:</span>
            </div>
            <div className="panel">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
                    <button className="btn btn-primary" onClick={() => editBarang()}>
                        <Icon icon="solar:add-square-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
                        Add Barang
                    </button>
                    <input
                        type="text"
                        className="form-input w-full sm:w-auto"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <div className="table-responsive mb-5">
                    <table className="table-striped w-full border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left">Kode Barang</th>
                                <th className="p-2 text-left">Nama Barang</th>
                                <th className="p-2 text-left">Kategori</th>
                                <th className="p-2 text-center">Jumlah</th>
                                <th className="p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((record: Barang) => (
                                <tr key={record.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <td className="p-2">{record.kode_barang}</td>
                                    <td className="p-2">{record.nama_barang}</td>
                                    <td className="p-2">{record.kategori?.kategori || '-'}</td>
                                    <td className="p-2 text-center">{record.jumlah}</td>
                                    <td className="p-2 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => editBarang(record)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(record.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                        </tbody>
                    </table>
                </div>
            </div>
            <Transition appear show={addBarangModal} as={Fragment}>
                <Dialog as="div" open={addBarangModal} onClose={() => setAddBarangModal(false)} className="relative z-[51]">
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
                                        onClick={() => setAddBarangModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.id ? 'Edit Barang' : 'Add Barang'}
                                    </div>
                                    <div className="p-5">
                                        <form>
                                            <div className="mb-5">
                                                <label htmlFor="nama_barang">Nama Barang</label>
                                                <input
                                                    id="nama_barang"
                                                    name="nama_barang"
                                                    type="text"
                                                    placeholder="Enter Nama Barang"
                                                    className="form-input"
                                                    value={params.nama_barang}
                                                    onChange={(e) => setParams({ ...params, nama_barang: e.target.value })}
                                                />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="kategori_id">Kategori</label>
                                                <select
                                                    id="kategori_id"
                                                    name="kategori_id"
                                                    className="form-select"
                                                    value={params.kategori_id ?? ''}
                                                    onChange={(e) => setParams({ ...params, kategori_id: Number(e.target.value) || null })}
                                                >
                                                    <option value="" disabled>
                                                        Pilih Kategori
                                                    </option>
                                                    {kategoriList.map((kategori) => (
                                                        <option key={kategori.kategori_id} value={kategori.kategori_id}>
                                                            {kategori.kategori} {/* Nama Kategori */}
                                                            {kategori.deskripsi && (
                                                                <span style={{ fontSize: '0.8rem', color: 'gray' }}> {/* Deskripsi */}
                                                                    {" - " + kategori.deskripsi}
                                                                </span>
                                                            )}
                                                        </option>
                                                    ))}
                                                </select>


                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => setAddBarangModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary ltr:ml-4 rtl:mr-4"
                                                    onClick={() => saveBarang()}
                                                >
                                                    {params.id ? 'Update' : 'Add'}
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

export default DataBarang;

