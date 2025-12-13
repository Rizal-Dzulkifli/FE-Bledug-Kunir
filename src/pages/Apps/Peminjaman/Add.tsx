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

interface ParamsState {
    peminjam: string;
    keterangan: string;
    inventaris_ids: number[];
}

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

const AddPeminjaman = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [barangTersedia, setBarangTersedia] = useState<Barang[]>([]);
    const [selectedInventaris, setSelectedInventaris] = useState<Inventaris[]>([]);
    const [addInventarisModal, setAddInventarisModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [params, setParams] = useState<ParamsState>({
        peminjam: '',
        keterangan: '',
        inventaris_ids: [],
    });

    const fetchPeminjamanById = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

        try {
            const response = await fetch(`http://localhost:3333/api/peminjaman/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Gagal mengambil data peminjaman');

            const data = await response.json();

            setParams({
                peminjam: data.peminjam || '',
                keterangan: data.keterangan || '',
                inventaris_ids: data.inventaris.map((item: Inventaris) => item.inventaris_id) || [],
            });
            setSelectedInventaris(data.inventaris || []);
        } catch (error) {
            Swal.fire('Error', (error as Error).message, 'error');
        }
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

        const payload = {
            peminjam: params.peminjam,
            keterangan: params.keterangan,
            inventaris_ids: selectedInventaris.map((item) => item.inventaris_id),
        };

        if (!payload.peminjam || payload.inventaris_ids.length === 0) {
            Swal.fire('Error', 'Harap isi data peminjam dan pilih barang.', 'error');
            return;
        }

        try {
            const url = id
                ? `http://localhost:3333/api/peminjaman/${id}`
                : 'http://localhost:3333/api/peminjaman';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Gagal menyimpan data');

            Swal.fire('Sukses', `Data berhasil ${id ? 'diperbarui' : 'disimpan'}`, 'success');
            navigate(-1);
        } catch (error) {
            Swal.fire('Error', (error as Error).message, 'error');
        }
    };

    const fetchBarangTersedia = async () => {
        const token = localStorage.getItem('token');
        if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

        try {
            const response = await fetch('http://localhost:3333/api/inventaris/tersedia', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to fetch barang tersedia');

            const data = await response.json();
            setBarangTersedia(data);
        } catch (error) {
            Swal.fire('Error', 'Gagal mengambil data barang tersedia', 'error');
        }
    };

    const handleSelectInventaris = (inventaris: Inventaris) => {
        const alreadySelected = selectedInventaris.some((item) => item.inventaris_id === inventaris.inventaris_id);
        if (alreadySelected) {
            // Hapus dari selectedInventaris jika sudah ada
            setSelectedInventaris(selectedInventaris.filter((item) => item.inventaris_id !== inventaris.inventaris_id));
        } else {
            // Temukan nama_barang dari barangTersedia
            const barang = barangTersedia.find((barang) =>
                barang.inventaris.some((item) => item.inventaris_id === inventaris.inventaris_id)
            );
    
            // Tambahkan ke selectedInventaris dengan nama_barang
            setSelectedInventaris([
                ...selectedInventaris,
                {
                    ...inventaris,
                    nama_barang: barang?.nama_barang || 'Tidak Diketahui',
                },
            ]);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle(id ? 'Edit Peminjaman' : 'Tambah Peminjaman'));
        setIsEdit(!!id);
        fetchBarangTersedia();
        if (id) fetchPeminjamanById();
    }, [id]);

    const handleOpenModal = () => setAddInventarisModal(true);
    const handleCloseModal = () => setAddInventarisModal(false);

    return (
        <div className="flex xl:flex-row flex-col gap-2.5">
            <div className="panel px-0 flex-1 py-6 ltr:xl:mr-6 rtl:xl:ml-6">
                <div className="flex justify-between flex-wrap px-4">
                    <div className="mb-6 lg:w-1/2 w-full">
                        <div className="flex items-center text-black dark:text-white shrink-0">
                            <img
                                className="w-20 flex-none"
                                src="/public/assets/images/auth/stmj.png"
                                alt="logo"
                            />
                        </div>
                        <div className="space-y-1 mt-6 text-gray-500 dark:text-gray-400">
                            <div>
                                Jl. Niken Gandini No.98, Plampitan, Setono, Kec. Jenangan, Kabupaten Ponorogo, Jawa
                                Timur 63492
                            </div>
                            <div>info@smkn1jenpo.sch.id</div>
                            <div>(0352) 481236</div>
                        </div>
                    </div>
                </div>
                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
                <div className="panel flex-1 p-6">
                    <div className="mb-6">
                        <label className="block">Nama Peminjam</label>
                        <input
                            type="text"
                            className="form-input"
                            value={params.peminjam}
                            onChange={(e) => setParams({ ...params, peminjam: e.target.value })}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block">Keterangan</label>
                        <textarea
                            className="form-textarea"
                            value={params.keterangan}
                            onChange={(e) => setParams({ ...params, keterangan: e.target.value })}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenModal}>
                        Pilih Barang
                    </button>
                    <div className="mt-8">
                        <div className="table-responsive">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Kode Inventaris</th>
                                        <th>Nama Barang</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInventaris.map((item, index) => {
                                        const namaBarang = isEdit
                                        ? item.nama_barang // Mode Edit: Gunakan nama_barang langsung dari API
                                        : barangTersedia.find((barang) =>
                                            barang.inventaris.some((item) => item.inventaris_id === item.inventaris_id)
                                        )?.nama_barang || 'Tidak Diketahui'; 
                                    return (
                                        <tr key={item.inventaris_id}>
                                            <td>{index + 1}</td>
                                            <td>{item.kode_inventaris}</td>
                                            <td>{namaBarang|| 'Tidak Diketahui'}</td>
                                            <td>
                                                <Tippy content="Hapus">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedInventaris(
                                                                selectedInventaris.filter(
                                                                    (inv) =>
                                                                        inv.inventaris_id !==
                                                                        item.inventaris_id
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-line-duotone" />
                                                    </button>
                                                </Tippy>
                                            </td>
                                        </tr>
                                    );
})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button className="btn btn-success" onClick={handleSubmit}>
                            <IconSave /> {isEdit ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Pilih Barang */}
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
                                        {barangTersedia.map((barang) => (
                                            <div key={barang.id} className="mb-6">
                                                <h3 className="text-lg font-semibold mb-2">{barang.nama_barang}</h3>
                                                <table className="table-striped table-hover w-full ">
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
                                                                            (item) =>
                                                                                item.inventaris_id ===
                                                                                inventaris.inventaris_id
                                                                        )}
                                                                        onChange={() =>
                                                                            handleSelectInventaris(
                                                                                inventaris
                                                                            )
                                                                        }
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
                                            onClick={() => {
                                                handleCloseModal();
                                                Swal.fire(
                                                    'Sukses',
                                                    'Inventaris berhasil dipilih',
                                                    'success'
                                                );
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

export default AddPeminjaman;
