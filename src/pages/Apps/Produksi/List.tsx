import React, { useState, useEffect, Fragment, useRef } from 'react';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../../components/Icon/IconX';
import IconEye from '../../../components/Icon/IconEye';
import IconEdit from '../../../components/Icon/IconEdit';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';
import '../../Inventaris/datatables-custom.css';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';

interface Produksi {
    id_produksi: number;
    id_produk: number;
    mode_produksi: 'existing_product' | 'new_product';
    tgl_produksi: string | null;
    tgl_tenggat: string;
    berat_hasil: number | null;
    stok_hasil: number | null;
    status_produksi: 'belum produksi' | 'sedang produksi' | 'telat produksi' | 'selesai';
    kode_produksi: string;
    created_at: string;
    updated_at: string;
    produk?: {
        id_produk_detail: number;
        id_produk: number;
        kode: string; // Kode lengkap dengan timestamp (BJA-1234)
        berat_produk: number;
        harga_jual: number;
        stok: number;
        deskripsi: string | null;
        namaProduk?: {
            id_produk: number;
            nama_produk: string;
            kode_produk: string; // Kode dasar (BJA)
        };
    };
    namaProduk?: {
        id_nama_produk: number;
        nama_produk: string;
        kode_produk: string;
    };
    detailBahan?: Array<{
        id_dbahan: number;
        id_produksi: number;
        id_barangmentah: number;
        berat_bahan: number;
        barangMentah?: {
            id_barangmentah: number;
            kode: string;
            berat_mentah: number;
            namaBarangMentah?: {
                nama_barang_mentah: string;
            };
        };
    }>;
    detailProduksi?: Array<{
        id_dproduksi: number;
        id_produksi: number;
        berat_hasil: number;
        tanggal_hasil: string;
    }>;
}

interface ProduksiFormState {
    id: number | null;
    id_produk: number | null;
    tgl_produksi: string;
    tgl_tenggat: string;
    berat_hasil: number;
    stok_hasil: number;
    status_produksi: string;
}

const ProduksiList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

    useEffect(() => {
        dispatch(setPageTitle('Daftar Produksi'));
    });

    const [produksis, setProduksis] = useState<Produksi[]>([]);
    const [produks, setProduks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [addProduksiModal, setAddProduksiModal] = useState(false);
    const [editProduksiModal, setEditProduksiModal] = useState(false);
    const [completeProduksiModal, setCompleteProduksiModal] = useState(false);
    const [editCompletedModal, setEditCompletedModal] = useState(false);
    const [isSubmittingEditCompleted, setIsSubmittingEditCompleted] = useState(false);
    const [selectedProduksi, setSelectedProduksi] = useState<any>(null);
    const [completionData, setCompletionData] = useState({
        detail_produksi: [] as Array<{id_dproduksi: number, berat_hasil: number}>,
        stok_manual: 0,
        selesaikan_produksi: true
    });
    const [editCompletedData, setEditCompletedData] = useState({
        detail_produksi: [] as Array<{id_dproduksi: number, berat_hasil: number, user?: any}>,
        stok_manual: 0
    });
    
    const [produksiParams, setProduksiParams] = useState<ProduksiFormState>({
        id: null,
        id_produk: null,
        tgl_produksi: '',
        tgl_tenggat: '',
        berat_hasil: 0,
        stok_hasil: 0,
        status_produksi: 'belum produksi',
    });

    // Helper function untuk mendapatkan nama produk berdasarkan mode
    const getProductName = (item: Produksi): string => {
        // Untuk new_product, gunakan namaProduk
        if (item.mode_produksi === 'new_product' && item.namaProduk) {
            return item.namaProduk.nama_produk;
        }
        
        // Untuk existing_product, gunakan produk.namaProduk
        if (item.mode_produksi === 'existing_product' && item.produk) {
            return item.produk.namaProduk?.nama_produk || '-';
        }
        
        // Fallback - coba ambil dari produk atau namaProduk yang tersedia
        if (item.produk?.namaProduk?.nama_produk) {
            return item.produk.namaProduk.nama_produk;
        }
        if (item.namaProduk?.nama_produk) {
            return item.namaProduk.nama_produk;
        }
        
        return '-';
    };

    // Helper function untuk mendapatkan kode produk berdasarkan mode
    const getProductCode = (item: Produksi): string => {
        // Prioritaskan produk.kode jika ada (format lengkap dengan timestamp)
        if (item.produk?.kode) {
            return item.produk.kode;
        }
        
        // Kemudian coba produk.namaProduk.kode_produk
        if (item.produk?.namaProduk?.kode_produk) {
            return item.produk.namaProduk.kode_produk;
        }
        
        // Terakhir coba namaProduk.kode_produk
        if (item.namaProduk?.kode_produk) {
            return item.namaProduk.kode_produk;
        }
        
        return '-';
    };

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

    const fetchProduksis = async (isSearching = false) => {
        try {
            if (isSearching) {
                setSearchLoading(true);
            } else {
                setLoading(true);
            }
            
            // Destroy DataTable before updating state
            destroyDataTable();
            
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            // Fetch all data without pagination for DataTables
            const url = buildApiUrl('produksi?limit=1000');
            
            const response = await fetch(url, {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch produksi');
            }

            const result = await response.json();
            setProduksis(result.data.data || []);
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat mengambil data produksi', 'error');
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        fetchProduksis();
        fetchProduks();
    }, []);

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
                        lengthMenu: [10, 25],
                        deferRender: true,
                        stateSave: false,
                        searching: true,
                        ordering: true,
                        paging: true,
                        info: true,
                        autoWidth: false,
                        retrieve: true,
                        destroy: true,
                        order: [[1, 'desc']], // Sort by Kode Produksi descending
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
                            emptyTable: 'Tidak ada data tersedia'
                        },
                        dom: '<"flex justify-between items-center mb-4"l>rt<"flex justify-between items-center mt-4"ip>',
                        columnDefs: [
                            {
                                targets: -1, // Last column (Aksi)
                                orderable: false,
                            },
                        ],
                    });

                    // Move custom search input into DataTables wrapper for proper alignment
                    setTimeout(() => {
                        const searchWrapper = document.getElementById('produksi-search-wrapper');
                        const lengthWrapper = document.querySelector('.dataTables_length')?.parentElement;
                        if (searchWrapper && lengthWrapper) {
                            lengthWrapper.appendChild(searchWrapper);
                        }
                    }, 0);
                } catch (error) {
                    console.error('Error initializing DataTable:', error);
                }
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [produksis, loading]);

    // Custom search handler
    useEffect(() => {
        if (dataTableRef.current) {
            setSearchLoading(true);
            const timeoutId = setTimeout(() => {
                dataTableRef.current?.search(search).draw();
                setSearchLoading(false);
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [search]);

    const fetchProduks = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            const response = await fetch(buildApiUrl('produk'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch produk');
            }

            const result = await response.json();
            setProduks(result.data || []);
        } catch (error) {
            console.error('Error fetching produk:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'belum produksi':
                return 'badge-outline-secondary';
            case 'sedang produksi':
                return 'badge-outline-primary';
            case 'telat produksi':
                return 'badge-outline-danger';
            case 'selesai':
                return 'badge-outline-success';
            default:
                return 'badge-outline-secondary';
        }
    };

    const handleStartProduction = async (item: Produksi) => {
        const result = await Swal.fire({
            title: 'Mulai Produksi',
            text: `Apakah Anda yakin ingin memulai produksi "${item.kode_produksi}"?`,
            html: `
                <div style="text-align: left; margin-top: 15px;">
                    <p><strong>Kode Produksi:</strong> ${item.kode_produksi}</p>
                    <p><strong>Produk:</strong> ${getProductName(item)}</p>
                    <p><strong>Status Saat Ini:</strong> ${item.status_produksi}</p>
                    <hr>
                    <p><small><strong>Catatan:</strong> Tanggal produksi akan diisi otomatis dengan tanggal hari ini jika masih kosong.</small></p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Mulai Produksi!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            // Prepare data untuk update status
            const updateData = {
                status_produksi: 'sedang produksi'
            };

            // Gunakan endpoint khusus untuk update status
            const response = await fetch(buildApiUrl(`produksi/${item.id_produksi}/status`), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updateData),
            });

            const result = await response.json();
            
            if (response.ok) {
                Swal.fire({
                    title: 'Sukses!',
                    text: 'Produksi berhasil dimulai.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchProduksis(); // Refresh data
            } else {
                Swal.fire('Error', result.message || 'Gagal memulai produksi.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat memulai produksi.', 'error');
        }
    };

    const handleCompleteProduksi = async (item: Produksi) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            // Fetch detail produksi untuk mendapatkan data karyawan
            const response = await fetch(buildApiUrl(`produksi/${item.id_produksi}`), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch produksi detail');
            }

            const result = await response.json();
            const produksiDetail = result.data;

            // Set selected produksi dan init completion data
            setSelectedProduksi(produksiDetail);
            
            // Initialize detail_produksi dengan data karyawan
            const detailProduksiInit = produksiDetail.detailProduksi?.map((detail: any) => ({
                id_dproduksi: detail.id_dproduksi,
                berat_hasil: detail.berat_hasil || 0,
                user: detail.user // Untuk display nama karyawan
            })) || [];

            setCompletionData({
                detail_produksi: detailProduksiInit,
                stok_manual: 0,
                selesaikan_produksi: true
            });

            setCompleteProduksiModal(true);
        } catch (error) {
            Swal.fire('Error', 'Gagal mengambil detail produksi', 'error');
        }
    };

    // Function untuk handle input berat hasil (text dengan validasi desimal)
    const handleBeratHasilInput = (id_dproduksi: number, value: string) => {
        // Jika value kosong, set ke 0
        if (value === '') {
            updateBeratHasil(id_dproduksi, 0);
            return;
        }

        // Hapus semua karakter non-digit dan titik
        let cleanValue = value.replace(/[^\d.]/g, '');

        // Pastikan hanya ada satu titik decimal
        const parts = cleanValue.split('.');
        if (parts.length > 2) {
            cleanValue = parts[0] + '.' + parts.slice(1).join('');
        }

        // Jangan biarkan titik di awal
        if (cleanValue.startsWith('.')) {
            cleanValue = '0' + cleanValue;
        }

        // Batasi 3 angka desimal
        if (parts.length === 2 && parts[1].length > 3) {
            cleanValue = parts[0] + '.' + parts[1].substring(0, 3);
        }

        // Convert ke number
        const numValue = cleanValue === '' || cleanValue === '.' ? 0 : parseFloat(cleanValue);

        // Pastikan hasilnya valid number
        if (!isNaN(numValue)) {
            updateBeratHasil(id_dproduksi, numValue);
        }
    };

    // Function untuk format display berat hasil
    const formatBeratHasilDisplay = (value: number): string => {
        if (value === 0) return '';
        // Tampilkan angka dengan maksimal 3 desimal, hilangkan trailing zeros
        return value.toFixed(3).replace(/\.?0+$/, '');
    };

    // Function untuk handle input stok manual (integer saja)
    const handleStokManualInput = (value: string) => {
        // Jika value kosong, set ke 0
        if (value === '') {
            setCompletionData(prev => ({ ...prev, stok_manual: 0 }));
            return;
        }

        // Hapus semua karakter non-digit
        const cleanValue = value.replace(/[^\d]/g, '');

        // Convert ke number
        const numValue = cleanValue === '' ? 0 : parseInt(cleanValue);

        // Pastikan hasilnya valid number
        if (!isNaN(numValue)) {
            setCompletionData(prev => ({ ...prev, stok_manual: numValue }));
        }
    };

    // Function untuk handle input berat hasil di Edit Completed
    const handleEditBeratHasilInput = (id_dproduksi: number, value: string) => {
        // Jika value kosong, set ke 0
        if (value === '') {
            updateBeratHasilEdit(id_dproduksi, 0);
            return;
        }

        // Hapus semua karakter non-digit dan titik
        let cleanValue = value.replace(/[^\d.]/g, '');

        // Pastikan hanya ada satu titik decimal
        const parts = cleanValue.split('.');
        if (parts.length > 2) {
            cleanValue = parts[0] + '.' + parts.slice(1).join('');
        }

        // Jangan biarkan titik di awal
        if (cleanValue.startsWith('.')) {
            cleanValue = '0' + cleanValue;
        }

        // Batasi 3 angka desimal
        if (parts.length === 2 && parts[1].length > 3) {
            cleanValue = parts[0] + '.' + parts[1].substring(0, 3);
        }

        // Convert ke number
        const numValue = cleanValue === '' || cleanValue === '.' ? 0 : parseFloat(cleanValue);

        // Pastikan hasilnya valid number
        if (!isNaN(numValue)) {
            updateBeratHasilEdit(id_dproduksi, numValue);
        }
    };

    // Function untuk handle input stok manual di Edit Completed
    const handleEditStokManualInput = (value: string) => {
        // Jika value kosong, set ke 0
        if (value === '') {
            setEditCompletedData(prev => ({ ...prev, stok_manual: 0 }));
            return;
        }

        // Hapus semua karakter non-digit
        const cleanValue = value.replace(/[^\d]/g, '');

        // Convert ke number
        const numValue = cleanValue === '' ? 0 : parseInt(cleanValue);

        // Pastikan hasilnya valid number
        if (!isNaN(numValue)) {
            setEditCompletedData(prev => ({ ...prev, stok_manual: numValue }));
        }
    };

    const handleSubmitComplete = async () => {
        if (!selectedProduksi) return;

        // Validasi input
        const hasEmptyBerat = completionData.detail_produksi.some(item => !item.berat_hasil || item.berat_hasil <= 0);
        if (hasEmptyBerat) {
            Swal.fire('Error', 'Semua karyawan harus mengisi berat hasil', 'error');
            return;
        }

        // Validasi total berat hasil tidak melebihi total berat barang mentah
        const totalBeratHasil = completionData.detail_produksi.reduce((sum, item) => sum + (item.berat_hasil || 0), 0);
        const totalBeratMentah = selectedProduksi.detailBahan?.reduce((sum: number, item: any) => sum + (item.berat || 0), 0) || 0;
        
        if (totalBeratHasil > totalBeratMentah) {
            Swal.fire({
                icon: 'error',
                title: 'Validasi Gagal',
                html: `Total berat hasil produksi (<strong>${totalBeratHasil.toFixed(2)} kg</strong>) tidak boleh melebihi total berat barang mentah (<strong>${totalBeratMentah.toFixed(2)} kg</strong>).<br><br>Silakan kurangi berat hasil produksi.`,
            });
            return;
        }

        if (!completionData.stok_manual || completionData.stok_manual <= 0) {
            Swal.fire('Error', 'Stok manual harus diisi dan lebih dari 0', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            // Prepare payload untuk API
            const payload = {
                detail_produksi: completionData.detail_produksi.map(item => ({
                    id_dproduksi: item.id_dproduksi,
                    berat_hasil: item.berat_hasil
                })),
                stok_manual: completionData.stok_manual,
                selesaikan_produksi: completionData.selesaikan_produksi
            };

            const response = await fetch(buildApiUrl(`produksi/${selectedProduksi.id_produksi}/berat-hasil`), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            
            if (response.ok) {
                Swal.fire({
                    title: 'Sukses!',
                    text: 'Produksi berhasil diselesaikan.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                setCompleteProduksiModal(false);
                fetchProduksis(); // Refresh data
            } else {
                Swal.fire('Error', result.message || 'Gagal menyelesaikan produksi.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat menyelesaikan produksi.', 'error');
        }
    };

    const updateBeratHasil = (id_dproduksi: number, berat_hasil: number) => {
        setCompletionData(prev => ({
            ...prev,
            detail_produksi: prev.detail_produksi.map(item => 
                item.id_dproduksi === id_dproduksi 
                    ? { ...item, berat_hasil } 
                    : item
            )
        }));
    };

    const handleEditCompleted = async (item: Produksi) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            // Fetch detail produksi untuk mendapatkan data karyawan
            const response = await fetch(buildApiUrl(`produksi/${item.id_produksi}`), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch produksi detail');
            }

            const result = await response.json();
            const produksiDetail = result.data;

            // Set selected produksi dan init edit data
            setSelectedProduksi(produksiDetail);
            
            console.log('📊 [Edit Modal] Data Produksi Detail:', produksiDetail);
            console.log('📊 [Edit Modal] detailBahan:', produksiDetail.detailBahan);
            console.log('📊 [Edit Modal] detail_produksi_bahan:', produksiDetail.detail_produksi_bahan);
            
            // Initialize detail_produksi dengan data karyawan yang ada
            const detailProduksiInit = produksiDetail.detailProduksi?.map((detail: any) => ({
                id_dproduksi: detail.id_dproduksi,
                berat_hasil: detail.berat_hasil || 0,
                user: detail.user // Untuk display nama karyawan
            })) || [];

            setEditCompletedData({
                detail_produksi: detailProduksiInit,
                stok_manual: produksiDetail.stok_hasil || 0
            });

            setEditCompletedModal(true);
        } catch (error) {
            Swal.fire('Error', 'Gagal mengambil detail produksi', 'error');
        }
    };

    const updateBeratHasilEdit = (id_dproduksi: number, berat_hasil: number) => {
        setEditCompletedData(prev => ({
            ...prev,
            detail_produksi: prev.detail_produksi.map(item => 
                item.id_dproduksi === id_dproduksi 
                    ? { ...item, berat_hasil } 
                    : item
            )
        }));
    };

    const handleSubmitEditCompleted = async () => {
        console.log('🚀 [FE] Starting handleSubmitEditCompleted');
        console.log('🔍 [FE] Initial checks:', {
            selectedProduksi: selectedProduksi ? selectedProduksi.id_produksi : null,
            isSubmittingEditCompleted,
            editCompletedData
        });

        if (!selectedProduksi || isSubmittingEditCompleted) {
            console.log('❌ [FE] Early return - missing data or already submitting');
            return; // Prevent multiple concurrent requests
        }

        // Validasi input
        const hasEmptyBerat = editCompletedData.detail_produksi.some(item => !item.berat_hasil || item.berat_hasil <= 0);
        if (hasEmptyBerat) {
            console.log('❌ [FE] Validation failed - empty berat hasil');
            Swal.fire('Error', 'Semua karyawan harus mengisi berat hasil', 'error');
            return;
        }

        if (!editCompletedData.stok_manual || editCompletedData.stok_manual <= 0) {
            console.log('❌ [FE] Validation failed - empty stok manual');
            Swal.fire('Error', 'Stok manual harus diisi dan lebih dari 0', 'error');
            return;
        }

        // Validasi total berat hasil tidak melebihi total berat mentah
        const totalBeratHasilEdit = editCompletedData.detail_produksi.reduce((sum: number, detail: any) => sum + (detail.berat_hasil || 0), 0);
        const totalBeratMentahEdit = selectedProduksi?.detailBahan?.reduce((sum: number, item: any) => sum + (item.berat || 0), 0) || 0;
        
        if (totalBeratHasilEdit > totalBeratMentahEdit) {
            console.log('❌ [FE] Validation failed - total berat hasil exceeded');
            console.log('📊 [FE] Comparison:', {
                totalBeratHasilEdit,
                totalBeratMentahEdit,
                difference: totalBeratHasilEdit - totalBeratMentahEdit
            });
            Swal.fire({
                icon: 'error',
                title: 'Total Berat Melebihi Batas!',
                html: `
                    <div class="text-left">
                        <p class="mb-2">Total berat hasil produksi <strong class="text-red-600">${totalBeratHasilEdit.toFixed(3)} kg</strong></p>
                        <p class="mb-2">melebihi total berat bahan mentah <strong class="text-green-600">${totalBeratMentahEdit.toFixed(3)} kg</strong></p>
                        <p class="text-red-600 font-bold">Kelebihan: ${(totalBeratHasilEdit - totalBeratMentahEdit).toFixed(3)} kg</p>
                    </div>
                `
            });
            return;
        }

        console.log('✅ [FE] Validation passed, setting loading state');
        setIsSubmittingEditCompleted(true); // Set loading state

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('❌ [FE] No auth token found');
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            // Prepare payload untuk API
            const payload = {
                detail_produksi: editCompletedData.detail_produksi.map(item => ({
                    id_dproduksi: item.id_dproduksi,
                    berat_hasil: item.berat_hasil
                })),
                stok_manual: editCompletedData.stok_manual
            };

            console.log('� [FE] Preparing API request:', {
                url: buildApiUrl(`produksi/${selectedProduksi.id_produksi}/edit-completed`),
                payload,
                headers: {
                    Authorization: `Bearer ${token.substring(0, 20)}...`,
                    'Content-Type': 'application/json',
                }
            });

            const startTime = Date.now();
            const response = await fetch(buildApiUrl(`produksi/${selectedProduksi.id_produksi}/edit-completed`), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            const endTime = Date.now();
            console.log(`⏱️ [FE] API request completed in ${endTime - startTime}ms`);
            console.log('📥 [FE] Response status:', response.status);

            const result = await response.json();
            console.log('📥 [FE] Response data:', result);
            
            if (response.ok) {
                console.log('✅ [FE] Success response received');
                Swal.fire({
                    title: 'Sukses!',
                    text: 'Data produksi selesai berhasil diperbarui.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                setEditCompletedModal(false);
                console.log('🔄 [FE] Refreshing produksi data...');
                fetchProduksis(); // Refresh data
            } else {
                console.log('❌ [FE] Error response received:', {
                    status: response.status,
                    message: result.message,
                    error: result.error
                });

                // Handle specific error cases
                if (result.message?.includes('Lock wait timeout')) {
                    console.log('🔒 [FE] Lock timeout error detected');
                    Swal.fire({
                        title: 'Sistem Sedang Sibuk',
                        text: 'Silakan tunggu sebentar dan coba lagi. Ada proses lain yang sedang berjalan.',
                        icon: 'warning',
                        confirmButtonText: 'OK'
                    });
                } else if (result.message?.includes('Deadlock')) {
                    console.log('💀 [FE] Deadlock error detected');
                    Swal.fire({
                        title: 'Konflik Data',
                        text: 'Terjadi konflik data, silakan refresh halaman dan coba lagi.',
                        icon: 'warning',
                        confirmButtonText: 'OK'
                    });
                } else {
                    console.log('⚠️ [FE] Generic error');
                    Swal.fire('Error', result.message || 'Gagal memperbarui data produksi.', 'error');
                }
            }
        } catch (error) {
            const errorDetails = {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : 'No stack trace'
            };
            console.error('💥 [FE] Exception caught:', errorDetails);
            
            Swal.fire({
                title: 'Error',
                text: 'Terjadi kesalahan saat memperbarui data produksi. Silakan coba lagi.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            console.log('🔄 [FE] Resetting loading state');
            setIsSubmittingEditCompleted(false); // Reset loading state
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('id-ID');
        } catch (error) {
            return '-';
        }
    };

    const handleDelete = async (id: number, kode: string) => {
        Swal.fire({
            title: 'Konfirmasi',
            text: `Apakah Anda yakin ingin menghapus produksi "${kode}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Destroy DataTable before deleting to prevent DOM conflicts
                    destroyDataTable();
                    
                    const token = localStorage.getItem('token');
                    if (!token) {
                        Swal.fire('Error', 'Authentication token is missing', 'error');
                        return;
                    }

                    const response = await fetch(buildApiUrl(`produksi/${id}`), {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                    });

                    const result = await response.json();

                    if (response.ok) {
                        Swal.fire('Sukses', result.message || 'Produksi berhasil dihapus.', 'success');
                        fetchProduksis();
                    } else {
                        Swal.fire('Error', result.message || 'Gagal menghapus produksi.', 'error');
                    }
                } catch (error) {
                    Swal.fire('Error', 'Terjadi kesalahan saat menghapus produksi.', 'error');
                }
            }
        });
    };

    const saveProduksi = async () => {
        try {
            if (!produksiParams.id_produk || !produksiParams.tgl_produksi || !produksiParams.tgl_tenggat) {
                Swal.fire('Error', 'Semua field wajib harus diisi', 'error');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('produksi'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id_produk: produksiParams.id_produk,
                    tgl_produksi: produksiParams.tgl_produksi,
                    tgl_tenggat: produksiParams.tgl_tenggat,
                    berat_hasil: produksiParams.berat_hasil,
                    stok_hasil: produksiParams.stok_hasil,
                    status_produksi: produksiParams.status_produksi,
                }),
            });

            const result = await response.json();
            
            if (response.ok) {
                Swal.fire('Sukses', result.message || 'Produksi berhasil ditambahkan.', 'success');
                setAddProduksiModal(false);
                setProduksiParams({
                    id: null,
                    id_produk: null,
                    tgl_produksi: '',
                    tgl_tenggat: '',
                    berat_hasil: 0,
                    stok_hasil: 0,
                    status_produksi: 'belum produksi',
                });
                fetchProduksis();
            } else {
                Swal.fire('Error', result.message || 'Gagal menambahkan produksi.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat menyimpan produksi.', 'error');
        }
    };

    const handleEditProduksi = (item: any) => {
        setSelectedProduksi(item);
        setProduksiParams({
            id: item.id_produksi,
            id_produk: item.id_produk,
            tgl_produksi: item.tgl_produksi.split('T')[0],
            tgl_tenggat: item.tgl_tenggat.split('T')[0],
            berat_hasil: item.berat_hasil || 0,
            stok_hasil: item.stok_hasil || 0,
            status_produksi: item.status_produksi,
        });
        setEditProduksiModal(true);
    };

    const handleUpdateProduksi = async () => {
        const result = await Swal.fire({
            title: 'Konfirmasi Perubahan',
            text: `Apakah Anda yakin ingin mengubah data produksi "${selectedProduksi?.kode_produksi}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Ubah!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl(`produksi/${produksiParams.id}`), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id_produk: produksiParams.id_produk,
                    tgl_produksi: produksiParams.tgl_produksi,
                    tgl_tenggat: produksiParams.tgl_tenggat,
                    berat_hasil: produksiParams.berat_hasil,
                    stok_hasil: produksiParams.stok_hasil,
                    status_produksi: produksiParams.status_produksi,
                }),
            });

            const result = await response.json();
            
            if (response.ok) {
                Swal.fire('Sukses', result.message || 'Produksi berhasil diperbarui.', 'success');
                setEditProduksiModal(false);
                setProduksiParams({
                    id: null,
                    id_produk: null,
                    tgl_produksi: '',
                    tgl_tenggat: '',
                    berat_hasil: 0,
                    stok_hasil: 0,
                    status_produksi: 'belum produksi',
                });
                fetchProduksis();
            } else {
                Swal.fire('Error', result.message || 'Gagal memperbarui produksi.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat memperbarui produksi.', 'error');
        }
    };

    const isNewItem = (created_at: string): boolean => {
        const now = new Date();
        const itemTime = new Date(created_at);
        const diffInHours = Math.abs(now.getTime() - itemTime.getTime()) / (1000 * 60 * 60);
        return diffInHours <= 12;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl">Data Produksi</h2>
                <div className="flex items-center gap-3">
                    <Link
                        to="/apps/produksi/add"
                        className="btn btn-primary"
                    >
                        <Icon icon="solar:add-circle-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
                        Tambah Produksi
                    </Link>
                    <div id="produksi-search-wrapper" className="relative">
                        <input
                            type="text"
                            className="form-input w-64 pl-10"
                            placeholder="Cari produksi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Icon
                            icon="ic:outline-search"
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            width="1.25rem"
                        />
                        {searchLoading && (
                            <Icon
                                icon="eos-icons:loading"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                                width="1.25rem"
                            />
                        )}
                    </div>
                </div>
            </div>
            
            <div className="panel p-5 border-0">
                {loading ? (
                    <div className="text-center py-4">
                        <Icon icon="eos-icons:loading" className="text-primary mx-auto" width="2rem" />
                        <p className="mt-2 text-gray-500">Memuat data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="datatables">
                            <table ref={tableRef} id="produksiTable" className="table-striped table-hover" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode Produksi</th>
                                <th>Produk</th>
                                <th>Tanggal Produksi</th>
                                <th>Tanggal Tenggat</th>
                                <th>Berat Hasil</th>
                                <th>Status</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produksis.map((item, index) => {
                                    return (
                                        <tr
                                            key={item.id_produksi}
                                        >
                                            <td className="relative">
                                                {index + 1}
                                            </td>
                                            <td>{item.kode_produksi}</td>
                                            <td>
                                                <div>
                                                    <div className="font-medium">{getProductName(item)}</div>
                                                    <div className="text-xs text-gray-500">{getProductCode(item)}</div>
                                                   
                                                    {item.mode_produksi && (
                                                        <div className="text-xs text-blue-600 capitalize">
                                                            {item.mode_produksi === 'new_product' ? 'Produk Baru' : 'Produk Existing'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{formatDate(item.tgl_produksi)}</td>
                                            <td>{formatDate(item.tgl_tenggat)}</td>
                                            <td>{item.berat_hasil ? `${item.berat_hasil} kg` : '-'}</td>
                                          
                                            <td>
                                                <span className={`badge ${getStatusBadge(item.status_produksi)} capitalize`}>
                                                    {item.status_produksi}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex gap-2 justify-center flex-wrap">
                                                    <Link
                                                        to={`/apps/produksi/preview/${item.id_produksi}`}
                                                        className="btn btn-sm btn-outline-primary"
                                                    >
                                                        Lihat
                                                    </Link>
                                                    <Link
                                                        to={`/apps/produksi/edit/${item.id_produksi}`}
                                                        className="btn btn-sm btn-outline-warning"
                                                    >
                                                        Edit
                                                    </Link>
                                                    {item.status_produksi === 'belum produksi' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartProduction(item)}
                                                            className="btn btn-sm btn-outline-success"
                                                            title="Mulai Produksi"
                                                        >
                                                            <Icon icon="material-symbols:play-arrow" className="w-4 h-4" />
                                                            Mulai
                                                        </button>
                                                    )}
                                                    {(item.status_produksi === 'sedang produksi' || item.status_produksi === 'telat produksi') && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCompleteProduksi(item)}
                                                            className="btn btn-sm btn-outline-info"
                                                            title="Selesaikan Produksi"
                                                        >
                                                            <Icon icon="material-symbols:check-circle" className="w-4 h-4" />
                                                            Selesaikan
                                                        </button>
                                                    )}
                                                    {item.status_produksi === 'selesai' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditCompleted(item)}
                                                            className="btn btn-sm btn-outline-secondary"
                                                            title="Edit Data Hasil"
                                                        >
                                                            <IconEdit className="w-4 h-4" />
                                                            Edit Hasil
                                                        </button>
                                                    )}
                                                    {item.status_produksi === 'belum produksi' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(item.id_produksi, item.kode_produksi)}
                                                            className="btn btn-sm btn-outline-danger"
                                                            title="Hapus Produksi"
                                                        >
                                                            <Icon icon="material-symbols:delete" className="w-4 h-4" />
                                                            Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Selesaikan Produksi */}
            <Transition appear show={completeProduksiModal} as={Fragment}>
                <Dialog as="div" className="relative z-[51]" onClose={() => setCompleteProduksiModal(false)}>
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
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-[#0e1726]">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                        Selesaikan Produksi
                                    </Dialog.Title>

                                    {selectedProduksi && (
                                        <div className="mt-4">
                                            {/* Info Produksi */}
                                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <h4 className="font-semibold mb-2">Informasi Produksi</h4>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Kode Produksi:</span>
                                                        <span className="ml-2 font-medium">{selectedProduksi.kode_produksi}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Produk:</span>
                                                        <span className="ml-2 font-medium">{getProductName(selectedProduksi)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                                        <span className="ml-2 font-medium">{selectedProduksi.status_produksi}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Tenggat:</span>
                                                        <span className="ml-2 font-medium">{formatDate(selectedProduksi.tgl_tenggat)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Form Input Berat Hasil Karyawan */}
                                            <div className="mb-6">
                                                <h4 className="font-semibold mb-3">Berat Hasil per Karyawan</h4>
                                                <div className="space-y-3">
                                                    {completionData.detail_produksi.map((detail: any, index: number) => (
                                                        <div key={detail.id_dproduksi} className="flex items-center gap-4 p-3 border rounded-lg dark:border-gray-600">
                                                            <div className="flex-1">
                                                                <label className="block text-sm font-medium mb-1">
                                                                    {detail.user?.nama || `Karyawan ${index + 1}`}
                                                                </label>
                                                                <div className="text-xs text-gray-500">
                                                                    ID: {detail.id_dproduksi}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="relative">
                                                                    <input
                                                                        type="text"
                                                                        inputMode="decimal"
                                                                        value={formatBeratHasilDisplay(detail.berat_hasil)}
                                                                        onChange={(e) => handleBeratHasilInput(detail.id_dproduksi, e.target.value)}
                                                                        className="form-input pr-8"
                                                                        placeholder="0"
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                                        kg
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Total Berat Info */}
                                                {(() => {
                                                    const totalBeratHasil = completionData.detail_produksi.reduce((sum, item) => sum + (item.berat_hasil || 0), 0);
                                                    const totalBeratMentah = selectedProduksi?.detailBahan?.reduce((sum: number, item: any) => sum + (item.berat || 0), 0) || 0;
                                                    const isExceeded = totalBeratHasil > totalBeratMentah;
                                                    
                                                    return (
                                                        <div className={`mt-4 p-3 rounded-lg ${isExceeded ? 'bg-danger/10 border border-danger' : 'bg-primary/10 border border-primary'}`}>
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium">Total Berat Hasil:</span>
                                                                <span className={`font-bold ${isExceeded ? 'text-danger' : 'text-primary'}`}>
                                                                    {totalBeratHasil.toFixed(2)} kg
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <span className="text-sm">Total Berat Barang Mentah:</span>
                                                                <span className="font-semibold text-sm">{totalBeratMentah.toFixed(2)} kg</span>
                                                            </div>
                                                            {isExceeded && (
                                                                <div className="mt-2 text-xs text-danger flex items-center gap-1">
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span>Total berat hasil melebihi berat barang mentah! Silakan kurangi.</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Input Stok Manual */}
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium mb-2">
                                                    Stok Manual (Unit)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={completionData.stok_manual === 0 ? '' : completionData.stok_manual}
                                                        onChange={(e) => handleStokManualInput(e.target.value)}
                                                        className="form-input pr-12"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                        unit
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Jumlah unit produk yang akan ditambahkan ke stok
                                                </p>
                                            </div>

                                            {/* Summary */}
                                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <h5 className="font-medium mb-2">Ringkasan</h5>
                                                <div className="text-sm space-y-1">
                                                    <div>
                                                        <span>Total Berat Hasil: </span>
                                                        <span className="font-semibold">
                                                            {completionData.detail_produksi.reduce((total, item) => total + (item.berat_hasil || 0), 0)} kg
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span>Stok yang Ditambahkan: </span>
                                                        <span className="font-semibold">{completionData.stok_manual} unit</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setCompleteProduksiModal(false)}
                                                    className="btn btn-outline-secondary"
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSubmitComplete}
                                                    className="btn btn-primary"
                                                >
                                                    <Icon icon="material-symbols:check-circle" className="w-4 h-4 mr-2" />
                                                    Selesaikan Produksi
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Modal Edit Produksi Selesai */}
            <Transition appear show={editCompletedModal} as={Fragment}>
                <Dialog as="div" className="relative z-[51]" onClose={() => setEditCompletedModal(false)}>
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
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-[#0e1726]">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                        Edit Produksi Selesai
                                    </Dialog.Title>

                                    {selectedProduksi && (
                                        <div className="mt-4">
                                            {/* Info Produksi */}
                                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <h4 className="font-semibold mb-2">Informasi Produksi</h4>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Kode Produksi:</span>
                                                        <span className="ml-2 font-medium">{selectedProduksi.kode_produksi}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Produk:</span>
                                                        <span className="ml-2 font-medium">{getProductName(selectedProduksi)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                                        <span className="ml-2 font-medium">
                                                            <span className="badge badge-success">Selesai</span>
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Tenggat:</span>
                                                        <span className="ml-2 font-medium">{formatDate(selectedProduksi.tgl_tenggat)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Alert Info */}
                                            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
                                                <div className="flex items-start">
                                                    <Icon icon="material-symbols:warning" className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
                                                    <div>
                                                        <h5 className="font-medium text-amber-800 dark:text-amber-200">Perhatian!</h5>
                                                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                                            Mengubah data ini akan mempengaruhi stok produk. Stok lama akan dikembalikan dan stok baru akan diterapkan.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Form Edit Berat Hasil Karyawan */}
                                            <div className="mb-6">
                                                <h4 className="font-semibold mb-3">Edit Berat Hasil per Karyawan</h4>
                                                <div className="space-y-3">
                                                    {editCompletedData.detail_produksi.map((detail: any, index: number) => (
                                                        <div key={detail.id_dproduksi} className="flex items-center gap-4 p-3 border rounded-lg dark:border-gray-600">
                                                            <div className="flex-1">
                                                                <label className="block text-sm font-medium mb-1">
                                                                    {detail.user?.nama || `Karyawan ${index + 1}`}
                                                                </label>
                                                                <div className="text-xs text-gray-500">
                                                                    ID: {detail.id_dproduksi}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="relative">
                                                                    <input
                                                                        type="text"
                                                                        inputMode="decimal"
                                                                        value={formatBeratHasilDisplay(detail.berat_hasil)}
                                                                        onChange={(e) => handleEditBeratHasilInput(detail.id_dproduksi, e.target.value)}
                                                                        className="form-input pr-8"
                                                                        placeholder="0"
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                                        kg
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Validasi Total Berat - Edit Modal */}
                                            {(() => {
                                                const totalBeratHasilEdit = editCompletedData.detail_produksi.reduce((sum: number, detail: any) => sum + (detail.berat_hasil || 0), 0);
                                                const totalBeratMentahEdit = selectedProduksi?.detailBahan?.reduce((sum: number, item: any) => sum + (item.berat || 0), 0) || 0;
                                                const isExceeded = totalBeratHasilEdit > totalBeratMentahEdit;
                                                
                                                console.log('📊 [Edit Modal] Validation Check:', {
                                                    totalBeratHasilEdit,
                                                    totalBeratMentahEdit,
                                                    isExceeded,
                                                    detailBahan: selectedProduksi?.detailBahan
                                                });
                                                
                                                return (
                                                    <div className={`mb-6 p-4 rounded-lg border ${
                                                        isExceeded 
                                                            ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' 
                                                            : 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
                                                    }`}>
                                                        <div className="flex items-start">
                                                            <Icon 
                                                                icon={isExceeded ? "material-symbols:error" : "material-symbols:check-circle"} 
                                                                className={`w-5 h-5 mt-0.5 mr-3 ${
                                                                    isExceeded ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                                                }`} 
                                                            />
                                                            <div className="flex-1">
                                                                <h5 className={`font-medium ${
                                                                    isExceeded ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'
                                                                }`}>
                                                                    {isExceeded ? '⚠️ Total Berat Melebihi Batas!' : '✓ Total Berat Valid'}
                                                                </h5>
                                                                <div className="mt-2 space-y-1 text-sm">
                                                                    <div className={isExceeded ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}>
                                                                        <span className="font-medium">Total Berat Hasil:</span> {formatBeratHasilDisplay(totalBeratHasilEdit)} kg
                                                                    </div>
                                                                    <div className={isExceeded ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}>
                                                                        <span className="font-medium">Total Berat Mentah:</span> {formatBeratHasilDisplay(totalBeratMentahEdit)} kg
                                                                    </div>
                                                                    {isExceeded && (
                                                                        <div className="text-red-700 dark:text-red-300 font-medium mt-2">
                                                                            Kelebihan: {formatBeratHasilDisplay(totalBeratHasilEdit - totalBeratMentahEdit)} kg
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Edit Stok Manual */}
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium mb-2">
                                                    Edit Stok Manual (Unit)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={editCompletedData.stok_manual || ''}
                                                        onChange={(e) => handleEditStokManualInput(e.target.value)}
                                                        className="form-input pr-12"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                        unit
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Jumlah unit produk yang akan diupdate ke stok
                                                </p>
                                            </div>

                                            {/* Summary */}
                                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <h5 className="font-medium mb-2">Ringkasan Perubahan</h5>
                                                <div className="text-sm space-y-1">
                                                    <div>
                                                        <span>Total Berat Hasil Baru: </span>
                                                        <span className="font-semibold">
                                                            {editCompletedData.detail_produksi.reduce((total, item) => total + (item.berat_hasil || 0), 0)} kg
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span>Stok Baru: </span>
                                                        <span className="font-semibold">{editCompletedData.stok_manual} unit</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditCompletedModal(false)}
                                                    className="btn btn-outline-secondary"
                                                    disabled={isSubmittingEditCompleted}
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSubmitEditCompleted}
                                                    className="btn btn-primary"
                                                    disabled={isSubmittingEditCompleted}
                                                >
                                                    {isSubmittingEditCompleted ? (
                                                        <>
                                                            <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconEdit className="w-4 h-4 mr-2" />
                                                            Update Data
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ProduksiList;