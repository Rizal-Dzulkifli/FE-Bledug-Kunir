import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import IconX from '../../../components/Icon/IconX';
import IconSave from '../../../components/Icon/IconSave';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Icon } from '@iconify-icon/react';

interface MutasiParams {
    lokasi_tujuan: number | null;
    status_tujuan: string;
    keterangan: string;
    inventaris_ids: number[];
}

interface InventarisItem {
    inventaris_id: number;
    kode_inventaris: string;
    barang: { id: number; nama_barang: string };
}

const AddMutasi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [addInventarisModal, setAddInventarisModal] = useState(false);
    const [inventarisList, setInventarisList] = useState<any[]>([]);
    const [selectedInventaris, setSelectedInventaris] = useState<number[]>([]);
    const [jurusanList, setJurusanList] = useState<any[]>([]);
    const [isEdit, setIsEdit] = useState(false);
    const [params, setParams] = useState<MutasiParams>({
        lokasi_tujuan: null,
        status_tujuan: 'Tersedia',
        keterangan: '',
        inventaris_ids: [],
    });

    const fetchMutasiById = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');
    
        try {
            const response = await fetch(`http://localhost:3333/api/mutasi/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (!response.ok) throw new Error('Gagal mengambil data mutasi');
    
            const data = await response.json();
    
            // Isi params dan selectedInventaris dengan data dari API
            setParams({
                lokasi_tujuan: data.lokasi_tujuan,
                status_tujuan: data.status_tujuan,
                keterangan: data.keterangan,
                inventaris_ids: data.inventaris.map((item: InventarisItem) => item.inventaris_id),
            });
    
            // Simpan data inventaris untuk ditampilkan di tabel
            setSelectedInventaris(data.inventaris);
        } catch (error) {
            Swal.fire('Error', (error as Error).message, 'error');
        }
    };
    

    const fetchInventaris = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

        try {
            const response = await fetch('http://localhost:3333/api/inventaris/ditempatkan', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (response.ok) {
                setInventarisList(data);
            } else {
                Swal.fire('Error', data.message || 'Gagal mengambil data inventaris', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat mengambil data inventaris', 'error');
        }
    };

    const fetchJurusanList = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

        try {
            const response = await fetch(buildApiUrl('jurusans'), {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (response.ok) {
                setJurusanList(data.data || data);
            } else {
                Swal.fire('Error', data.message || 'Gagal mengambil data jurusan', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat mengambil data jurusan', 'error');
        }
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

        if (selectedInventaris.length === 0) {
            Swal.fire('Error', 'Harap pilih inventaris.', 'error');
            return;
        }

        const payload = {
            ...params,
            inventaris_ids: selectedInventaris,
        };

        try {
            const url = id
                ? `http://localhost:3333/api/mutasi/${id}`
                : 'http://localhost:3333/api/mutasi';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire('Sukses', `Mutasi barang berhasil ${id ? 'diperbarui' : 'ditambahkan'}`, 'success');
                navigate('/apps/transaksi/mutasi');
            } else {
                Swal.fire('Error', data.message || 'Gagal menyimpan data mutasi', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat menyimpan data mutasi', 'error');
        }
    };

    const handleOpenModal = () => setAddInventarisModal(true);
    const handleCloseModal = () => setAddInventarisModal(false);

    const handleSelectInventaris = (id: number) => {
        if (selectedInventaris.includes(id)) {
            setSelectedInventaris(selectedInventaris.filter((item) => item !== id));
        } else {
            setSelectedInventaris([...selectedInventaris, id]);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle(id ? 'Edit Mutasi Barang' : 'Tambah Mutasi Barang'));
        setIsEdit(!!id);
        fetchInventaris();
        fetchJurusanList();
        if (id) fetchMutasiById();
    }, [id]);

    return (
        <div className="flex xl:flex-row flex-col gap-2.5">
            <div className="panel px-0 flex-1 py-6 ltr:xl:mr-6 rtl:xl:ml-6">
                <div className="flex justify-between flex-wrap px-4">
                    <div className="mb-6 lg:w-1/2 w-full">
                        <div className="flex items-center text-black dark:text-white shrink-0">
                            <img className="w-20 flex-none" src="/public/assets/images/auth/stmj.png" alt="logo" />
                        </div>
                        <div className="space-y-1 mt-6 text-gray-500 dark:text-gray-400">
                            <div>Jl. Niken Gandini No.98, Plampitan, Setono, Kec. Jenangan, Kabupaten Ponorogo, Jawa Timur 63492</div>
                            <div>info@smkn1jenpo.sch.id</div>
                            <div>(0352) 481236</div>
                        </div>
                    </div>
                </div>
                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
                <div className="mt-8 px-4">
                    <div className="flex">
                        <div className="w-full ltr:lg:mr-6 rtl:lg:ml-6 mb-6">
                            <div className="mt-4 flex items-center">
                                <label htmlFor="jurusan_id" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">Lokasi Penempatan</label>
                                <select
                                    id="jurusan_id"
                                    name="jurusan_id"
                                    className="form-select"
                                    value={params.lokasi_tujuan ?? ''}
                                    onChange={(e) =>
                                        setParams({
                                            ...params,
                                            lokasi_tujuan: e.target.value ? Number(e.target.value) : null,
                                            status_tujuan: e.target.value ? 'Ditempatkan' : 'Tersedia',
                                        })
                                    }
                                >
                                    <option value="">Tersedia (Lokasi Tidak Ditentukan)</option>
                                    {jurusanList.map((jurusan) => (
                                        <option key={jurusan.jurusan_id} value={jurusan.jurusan_id}>
                                            {jurusan.ruangan}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-4">
                                <label className="block mb-2">Keterangan</label>
                                <textarea
                                    className="form-textarea"
                                    value={params.keterangan}
                                    onChange={(e) => setParams({ ...params, keterangan: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col mt-6">
                        <button type="button" className="btn btn-primary" onClick={handleOpenModal}>
                            Pilih Barang
                        </button>
                    </div>
                </div>
                <div className="mt-8">
                    <div className="table-responsive">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="w-1">No</th>
                                    <th>Kode Inventaris</th>
                                    <th>Nama Barang</th>
                                    <th className="w-1">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedInventaris.map((id, index) => {
                                    const { item, barang } = inventarisList
                                        .flatMap((lokasi: { barang: { inventaris: InventarisItem[]; nama_barang: string }[] }) =>
                                            lokasi.barang.flatMap((barang) =>
                                                barang.inventaris.map((inventaris) => ({
                                                    item: inventaris,
                                                    barang: barang,
                                                }))
                                            )
                                        )
                                        .find(({ item }) => item.inventaris_id === id) || {};

                                    return item && barang ? (
                                        <tr key={id}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>{item.kode_inventaris}</td>
                                            <td>{barang.nama_barang}</td>
                                            <td className="text-center">
                                                <Tippy content="Hapus">
                                                    <button
                                                        type="button"
                                                        className="group"
                                                        onClick={() =>
                                                            setSelectedInventaris(selectedInventaris.filter(
                                                                (item) => item !== id
                                                            ))
                                                        }
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-line-duotone" className="text-danger" width="1.2rem" height="1.2rem" />
                                                    </button>
                                                </Tippy>
                                            </td>
                                        </tr>
                                    ) : null;
                                })}
                                {selectedInventaris.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center text-gray-500">
                                            Tidak ada barang yang dipilih.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
                <div className="flex justify-between flex-wrap px-4">
                    <button type="button" className="btn btn-success w-full gap-2" onClick={handleSubmit}>
                        <IconSave className="ltr:mr-2 rtl:ml-2 shrink-0" /> {isEdit ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
            <Transition appear show={addInventarisModal} as={Fragment}>
                <Dialog as="div" open={addInventarisModal} onClose={handleCloseModal} className="relative z-[51]">
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
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-4xl text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        Pilih Barang
                                    </div>
                                    <div className="p-5 overflow-auto">
                                        {inventarisList.map((lokasi) => (
                                            <div key={lokasi.lokasi} className="mb-6">
                                                <h3 className="text-lg font-semibold mb-2">{lokasi.lokasi}</h3>
                                                <table className="table-striped table-hover w-full">
                                                    <thead>
                                                        <tr>
                                                            <th>Nama Barang</th>
                                                            <th>Kode Inventaris</th>
                                                            <th>Pilih</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {lokasi.barang.map((barang: { nama_barang: string; inventaris: InventarisItem[] }) => (
                                                            barang.inventaris.map((item: InventarisItem) => (
                                                                <tr key={item.inventaris_id}>
                                                                    <td>{barang.nama_barang}</td>
                                                                    <td>{item.kode_inventaris}</td>
                                                                    <td>
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-checkbox"
                                                                            checked={selectedInventaris.includes(item.inventaris_id)}
                                                                            onChange={() => handleSelectInventaris(item.inventaris_id)}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}

                                    </div>
                                    <div className="flex justify-end px-5 py-3 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => {
                                                handleCloseModal();
                                                Swal.fire('Sukses', 'Inventaris berhasil dipilih', 'success');
                                            }}
                                        >
                                            Pilih
                                        </button>
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

export default AddMutasi;
