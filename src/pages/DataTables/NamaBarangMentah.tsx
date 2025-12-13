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

// Definisikan tipe data untuk NamaBarangMentah
type NamaBarangMentah = {
    id_bm: number;
    nama_barang_mentah: string;
    kode_barang: string;
};

const MasterDataNamaBarangMentah = () => {
    const dispatch = useDispatch();
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

    useEffect(() => {
        dispatch(setPageTitle('Master Data Nama Barang Mentah'));
        ambilDaftarNamaBarangMentah();
    }, []);

    const [addModal, setAddModal] = useState(false);
    const [search, setSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [params, setParams] = useState<NamaBarangMentah>({
        id_bm: 0,
        nama_barang_mentah: '',
        kode_barang: '',
    });

    const [daftarNamaBarangMentah, setDaftarNamaBarangMentah] = useState<NamaBarangMentah[]>([]);
    const [dataAwal, setDataAwal] = useState<NamaBarangMentah[]>([]);

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

    // Ambil daftar nama barang mentah dari API
    const ambilDaftarNamaBarangMentah = async () => {
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
            const response = await fetch(buildApiUrl('nama-barang-mentah?limit=1000'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil data');
            }

            const data = await response.json();
            console.log('API Response:', data); // Debug log
            
            // Handle pagination response - ambil dari data.data jika ada pagination
            let namaBarangMentahData;
            if (data.data && Array.isArray(data.data)) {
                // Response dengan pagination
                namaBarangMentahData = data.data;
            } else if (Array.isArray(data)) {
                // Response langsung array
                namaBarangMentahData = data;
            } else {
                throw new Error('Format data tidak sesuai');
            }
            
            console.log('Processed Data:', namaBarangMentahData); // Debug log
            setDaftarNamaBarangMentah(namaBarangMentahData);
            setDataAwal(namaBarangMentahData);
        } catch (error) {
            console.error('Error mengambil nama barang mentah:', error);
            Swal.fire('Error', 'Tidak dapat mengambil data nama barang mentah', 'error');
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
                const searchWrapper = document.getElementById('barang-mentah-search-wrapper');
                const lengthWrapper = document.querySelector('.dataTables_length')?.parentElement;
                if (searchWrapper && lengthWrapper) {
                    lengthWrapper.appendChild(searchWrapper);
                }
            }, 0);
        }

        return () => destroyDataTable();
    }, [daftarNamaBarangMentah, loading]);

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

    // Function untuk generate kode barang otomatis
    const generateKodeBarang = async (namaBarang: string) => {
        if (!namaBarang.trim()) return '';

        const token = localStorage.getItem('token');
        if (!token) return '';

        try {
            console.log('Generating kode for:', namaBarang); // Debug log
            
            const response = await fetch(buildApiUrl('nama-barang-mentah/generate-kode'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    nama_barang_mentah: namaBarang
                }),
            });

            const data = await response.json();
            console.log('Generate kode API response:', data); // Debug log
            
            if (response.ok) {
                const generatedKode = data.kode_barang || '';
                console.log('Generated kode from API:', generatedKode); // Debug log
                return generatedKode;
            } else {
                // Jika ada error, coba fallback generate di frontend
                console.warn('API generate kode failed:', data.message);
                const fallbackKode = generateKodeFallback(namaBarang);
                console.log('Using fallback kode:', fallbackKode); // Debug log
                return fallbackKode;
            }
        } catch (error) {
            console.error('Error generating kode:', error);
            // Fallback ke generate manual di frontend
            const fallbackKode = generateKodeFallback(namaBarang);
            console.log('Using fallback kode due to error:', fallbackKode); // Debug log
            return fallbackKode;
        }
    };

    // Fallback function untuk generate kode di frontend
    const generateKodeFallback = (namaBarang: string): string => {
        const words = namaBarang.toUpperCase().trim().split(' ').filter(word => word.length > 0);
        let kode = '';
        
        console.log('Fallback - Words from input:', words); // Debug log
        
        if (words.length === 1) {
            // Jika satu kata, ambil 3 huruf pertama
            kode = words[0].substring(0, 3);
        } else if (words.length >= 2) {
            // Jika dua kata atau lebih, ambil 1 huruf dari kata pertama + 2 huruf dari kata kedua
            const firstLetter = words[0].charAt(0);
            const secondPart = words[1].substring(0, 2);
            kode = firstLetter + secondPart;
            console.log(`Fallback - First letter: ${firstLetter}, Second part: ${secondPart}`); // Debug log
        }
        
        // Pastikan minimal 2 karakter dan maksimal 5 karakter
        if (kode.length < 2 && words[0]) {
            kode = words[0].substring(0, 2);
        }
        
        const finalKode = kode.substring(0, 5);
        console.log('Fallback - Final kode:', finalKode); // Debug log
        return finalKode;
    };

    // Simpan atau perbarui data nama barang mentah
    const simpanData = async () => {
        if (!params.nama_barang_mentah.trim()) {
            tampilkanPesan('Nama barang mentah wajib diisi.', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Token autentikasi tidak ditemukan', 'error');
            return;
        }

        try {
            // Auto generate kode jika kosong pada tambah data baru
            let kodeBarang = params.kode_barang?.trim();
            if (!params.id_bm && !kodeBarang) {
                kodeBarang = await generateKodeBarang(params.nama_barang_mentah);
                console.log('Generated kode:', kodeBarang); // Debug log
            }

            const method = params.id_bm ? 'PUT' : 'POST';
            const url = params.id_bm
                ? buildApiUrl(`nama-barang-mentah/${params.id_bm}`)
                : buildApiUrl('nama-barang-mentah');

            const requestBody: any = {
                nama_barang_mentah: params.nama_barang_mentah.trim(),
            };

            // Include kode_barang only if it's provided
            if (kodeBarang) {
                requestBody.kode_barang = kodeBarang;
            }

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
                // Jika ada suggested kode, gunakan itu
                if (responseData.suggested_kode) {
                    console.log('Using suggested kode:', responseData.suggested_kode);
                    setParams(prev => ({ ...prev, kode_barang: responseData.suggested_kode }));
                    tampilkanPesan(`Kode disesuaikan menjadi: ${responseData.suggested_kode}`, 'warning');
                    return; // Don't close modal, let user review the suggested kode
                }
                throw new Error(responseData.message || `Gagal ${params.id_bm ? 'memperbarui' : 'menambah'} data`);
            }

            // Tampilkan pesan sukses dengan informasi tambahan
            let successMessage = `Data berhasil ${params.id_bm ? 'diperbarui' : 'ditambahkan'}.`;
            if (responseData.updated_related_codes) {
                successMessage += ' Kode pada barang mentah terkait juga telah diperbarui.';
            }
            tampilkanPesan(successMessage);
            setAddModal(false);
            setParams({ id_bm: 0, nama_barang_mentah: '', kode_barang: '' });

            // Refresh data
            await ambilDaftarNamaBarangMentah();
        } catch (error: any) {
            console.error('Error saving data:', error);
            tampilkanPesan(error.message || `Gagal ${params.id_bm ? 'memperbarui' : 'menambah'} data`, 'error');
        }
    };

    // Edit data nama barang mentah
    const editData = (item: NamaBarangMentah) => {
        setParams(item);
        setAddModal(true);
    };

    // Hapus data nama barang mentah
    const hapusData = (id_bm: number) => {
        // Destroy DataTable before deleting
        destroyDataTable();
        
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Token autentikasi tidak ditemukan', 'error');
            return;
        }

        Swal.fire({
            title: 'Anda yakin?',
            text: 'Data yang dihapus tidak dapat dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Tidak, batalkan',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(buildApiUrl(`nama-barang-mentah/${id_bm}`), {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                    });

                    if (response.ok) {
                        tampilkanPesan('Data berhasil dihapus.', 'success');
                        await ambilDaftarNamaBarangMentah();
                    } else {
                        throw new Error('Gagal menghapus data');
                    }
                } catch (error) {
                    console.error('Error menghapus data:', error);
                    Swal.fire('Error', 'Tidak dapat menghapus data', 'error');
                }
            }
        });
    };

    // Handle auto-generate kode saat mengetik nama
    const handleNamaChange = async (value: string) => {
        setParams({ ...params, nama_barang_mentah: value });
        
        // Auto generate kode hanya untuk data baru atau jika kode belum diisi manual
        if (!params.id_bm && value.trim()) {
            const kodeGenerated = await generateKodeBarang(value);
            if (kodeGenerated) {
                setParams(prev => ({ ...prev, nama_barang_mentah: value, kode_barang: kodeGenerated }));
            }
        } else if (params.id_bm && value.trim()) {
            // Untuk edit mode, regenerate kode jika diperlukan
            const kodeGenerated = await generateKodeBarang(value);
            if (kodeGenerated) {
                setParams(prev => ({ ...prev, nama_barang_mentah: value, kode_barang: kodeGenerated }));
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="panel flex items-center overflow-x-auto whitespace-nowrap p-3 text-primary">
                <div className="rounded-full bg-primary p-1.5 text-white ring-2 ring-primary/30 ltr:mr-3 rtl:ml-3">
                    <IconBell />
                </div>
                <span className="ltr:mr-3 rtl:ml-3">Dokumentasi: Master Data Nama Barang Mentah untuk mengelola kategori bahan baku dengan auto-generate kode barang dan sinkronisasi data inventaris</span>
            </div>
            <div className="flex justify-between items-center mb-5">
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setParams({ id_bm: 0, nama_barang_mentah: '', kode_barang: '' });
                        setAddModal(true);
                    }}
                >
                    <Icon icon="solar:widget-add-line-duotone" className="ltr:mr-2 " width="1.2rem" />
                    Tambah Nama Barang Mentah
                </button>
                <div id="barang-mentah-search-wrapper" className="relative">
                    <input
                        type="text"
                        className="form-input w-64 pl-10"
                        placeholder="Cari nama atau kode barang..."
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
                            <table ref={tableRef} id="namaBarangMentahTable" className="table-striped w-full">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 border-b-2 font-semibold text-black dark:text-white whitespace-nowrap">Kode Barang</th>
                                        <th className="px-6 py-3 border-b-2 font-semibold text-black dark:text-white whitespace-nowrap">Nama Barang Mentah</th>
                                        <th className="px-4 py-3 border-b-2 font-semibold text-black dark:text-white text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daftarNamaBarangMentah.map((record, index) => (
                                    <tr key={`${record.id_bm}-${index}`} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 font-mono text-sm">{record.kode_barang}</td>
                                        <td className="px-6 py-4">{record.nama_barang_mentah}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => editData(record)}>
                                                    <Icon icon="solar:pen-line-duotone" className="pr-2" width="1rem" />
                                                    Edit
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => hapusData(record.id_bm)}>
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
                                        {params.id_bm ? 'Edit Nama Barang Mentah' : 'Tambah Nama Barang Mentah'}
                                    </div>
                                    <div className="p-5">
                                        <form>
                                            <div className="mb-5">
                                                <label htmlFor="nama_barang_mentah">Nama Barang Mentah *</label>
                                                <input 
                                                    id="nama_barang_mentah" 
                                                    type="text" 
                                                    placeholder="Masukkan Nama Barang Mentah" 
                                                    className="form-input" 
                                                    value={params.nama_barang_mentah} 
                                                    onChange={(e) => handleNamaChange(e.target.value)} 
                                                />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="kode_barang">Kode Barang</label>
                                                <input 
                                                    id="kode_barang" 
                                                    type="text" 
                                                    placeholder="Kode akan dibuat otomatis atau masukkan manual" 
                                                    className="form-input" 
                                                    value={params.kode_barang} 
                                                    onChange={(e) => setParams({ ...params, kode_barang: e.target.value.toUpperCase() })} 
                                                />
                                                <small className="text-gray-500">Kosongkan untuk generate otomatis dari nama barang</small>
                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setAddModal(false)}>
                                                    Batal
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={simpanData}>
                                                    {params.id_bm ? 'Perbarui' : 'Tambah'}
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

export default MasterDataNamaBarangMentah;
