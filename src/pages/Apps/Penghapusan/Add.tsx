import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import IconX from '../../../components/Icon/IconX';
import IconSave from '../../../components/Icon/IconSave';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Icon } from '@iconify-icon/react';

interface Inventaris {
    inventaris_id: number;
    kode_inventaris: string;
    status_barang: string;
    nama_barang?: string;
}

interface Barang {
    id: number;
    nama_barang: string;
    jumlah: number;
    inventaris: Inventaris[];
}

interface PenghapusanParams {
    keterangan: string;
    inventaris_ids: number[];
}

const AddPenghapusan = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [barangDitempatkan, setBarangDitempatkan] = useState<Barang[]>([]);
    const [selectedInventaris, setSelectedInventaris] = useState<Inventaris[]>([]);
    const [addInventarisModal, setAddInventarisModal] = useState(false);
    const [keterangan, setKeterangan] = useState('');
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(id ? 'Edit Penghapusan' : 'Tambah Penghapusan'));
        setIsEdit(!!id);
        fetchBarangDitempatkan();
        if (id) fetchPenghapusanById();
    }, [id]);

    const fetchBarangDitempatkan = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

        try {
            const response = await fetch('http://localhost:3333/api/inventaris/tersedia', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (response.ok) {
                setBarangDitempatkan(data);
            } else {
                Swal.fire('Error', data.message || 'Gagal mengambil data barang', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat mengambil data barang', 'error');
        }
    };

    const fetchPenghapusanById = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

        try {
            const response = await fetch(`http://localhost:3333/api/penghapusan/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Gagal mengambil data penghapusan');

            const data = await response.json();
            setKeterangan(data.keterangan);
            setSelectedInventaris(data.inventaris || []);
        } catch (error) {
            Swal.fire('Error', (error as Error).message, 'error');
        }
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

        if (selectedInventaris.length === 0) {
            Swal.fire('Error', 'Harap pilih inventaris untuk dihapus.', 'error');
            return;
        }

        const payload = {
            keterangan,
            inventaris_ids: selectedInventaris.map((item) => item.inventaris_id),
        };

        try {
            const url = id
                ? `http://localhost:3333/api/penghapusan/${id}`
                : 'http://localhost:3333/api/penghapusan';
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
                Swal.fire('Sukses', `Data berhasil ${id ? 'diperbarui' : 'disimpan'}`, 'success');
                navigate('/apps/transaksi/penghapusan');
            } else {
                Swal.fire('Error', data.message || 'Gagal menyimpan data penghapusan', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat menyimpan data penghapusan', 'error');
        }
    };

    const handleSelectInventaris = (inventaris: Inventaris) => {
        const alreadySelected = selectedInventaris.some((item) => item.inventaris_id === inventaris.inventaris_id);
        if (alreadySelected) {
            setSelectedInventaris(selectedInventaris.filter((item) => item.inventaris_id !== inventaris.inventaris_id));
        } else {
            setSelectedInventaris([...selectedInventaris, inventaris]);
        }
    };

    const handleOpenModal = () => setAddInventarisModal(true);
    const handleCloseModal = () => setAddInventarisModal(false);

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
                        <div className="w-full mb-6">
                            <div className="mt-4">
                                <label className="block mb-2">Keterangan Penghapusan</label>
                                <textarea
                                    className="form-textarea"
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    rows={3}
                                    placeholder="Masukkan keterangan penghapusan"
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
                                {selectedInventaris.map((inventaris, index) => (
                                    <tr key={inventaris.inventaris_id}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{inventaris.kode_inventaris}</td>
                                        <td>{inventaris.nama_barang || 'Tidak Diketahui'}</td>
                                        <td className="text-center">
                                            <Tippy content="Hapus">
                                                <button
                                                    type="button"
                                                    className="group"
                                                    onClick={() =>
                                                        setSelectedInventaris(selectedInventaris.filter(
                                                            (item) => item.inventaris_id !== inventaris.inventaris_id
                                                        ))
                                                    }
                                                >
                                                    <Icon
                                                        icon="solar:trash-bin-trash-line-duotone"
                                                        className="text-danger"
                                                        width="1.2rem"
                                                        height="1.2rem"
                                                    />
                                                </button>
                                            </Tippy>
                                        </td>
                                    </tr>
                                ))}
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
                        <IconSave className="ltr:mr-2 rtl:ml-2 shrink-0" /> {isEdit ? 'Update' : 'Simpan'}
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
                                        {barangDitempatkan.map((barang) => (
                                            <div key={barang.id} className="mb-6">
                                                <h3 className="text-lg font-semibold mb-2">{barang.nama_barang}</h3>
                                                <table className="table-striped table-hover w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="w-1/6">Kode Inventaris</th>
                                                            <th className="w-1/3">Nama Barang</th>
                                                            <th className="w-1/3 text-center">Pilih</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {barang.inventaris.map((inventaris) => (
                                                            <tr key={inventaris.inventaris_id}>
                                                                <td>{inventaris.kode_inventaris}</td>
                                                                <td>{barang.nama_barang}</td>
                                                                <td className="text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-checkbox"
                                                                        checked={selectedInventaris.some(
                                                                            (item) => item.inventaris_id === inventaris.inventaris_id
                                                                        )}
                                                                        onChange={() => handleSelectInventaris(inventaris)}
                                                                    />
                                                                </td>
                                                            </tr>
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
                                            onClick={handleCloseModal}
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

export default AddPenghapusan;
