import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconX from '../../../components/Icon/IconX';
import IconSave from '../../../components/Icon/IconSave';
import ImageUploading, { ImageListType } from 'react-images-uploading';

const Add = () => {
    const { id } = useParams(); // Tangkap ID dari URL
    const navigate = useNavigate();
    const [isEdit, setIsEdit] = useState(false);
    const [images2, setImages2] = useState<ImageListType>([]);
    const [keterangan, setKeterangan] = useState('');
    const [dataBarang, setDataBarang] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [removedItems, setRemovedItems] = useState<number[]>([]);
    const [tanggalPengadaan, setTanggalPengadaan] = useState('');
    const [items, setItems] = useState<any[]>([
        {
            id: 1,
            pengadaan_barang_id: null,
            barang_id: null,
            supplier_id: null,
            jumlah: 0,
            harga_satuan: 0,
        },
    ]);

    const maxNumber = 69;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(id ? 'Edit Barang' : 'Tambah Barang')); // Update judul halaman
        setIsEdit(!!id); // Tentukan mode (edit jika ada ID)
        // Ambil detail jika dalam mode edit
    }, [id]);

    const addItem = () => {
        const maxId = items.length ? Math.max(...items.map((item: any) => item.id)) : 0;
        setItems([...items, { id: maxId + 1, pengadaan_barang_id: null, barang_id: null, supplier_id: null, jumlah: 0, harga_satuan: 0 }]);
    };

    const onChange2 = (imageList: ImageListType) => {
        setImages2(imageList);
    };

    const removeItem = (id: number) => {
        const itemToRemove = items.find((item) => item.id === id);
        if (itemToRemove && itemToRemove.pengadaan_barang_id) {
            setRemovedItems([...removedItems, itemToRemove.pengadaan_barang_id]);
        }
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: number, key: string, value: any) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    };

    return (
        <div className="flex xl:flex-row flex-col gap-2.5">
            <div className="panel px-0 flex-1 py-6 ltr:xl:mr-6 rtl:xl:ml-6">
                <div className="flex justify-between flex-wrap px-4">
                    <div className="mb-6 lg:w-1/2 w-full">
                        <div className="flex items-center text-black dark:text-white shrink-0"></div>
                        <div className="space-y-1 mt-6 text-gray-500 dark:text-gray-400"></div>
                    </div>
                    <div className="lg:w-1/2 w-full lg:max-w-fit">
                        <div className="flex items-center mt-4">
                            <label htmlFor="startDate" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                                Tanggal Pengadaan
                            </label>
                            <input
                                id="startDate"
                                type="date"
                                name="inv-date"
                                className="form-input lg:w-[250px] w-2/3"
                                value={tanggalPengadaan}
                                onChange={(e) => setTanggalPengadaan(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
                <div className="mt-8 px-4">
                    <div className="flex">
                        <div className="w-full ltr:lg:mr-6 rtl:lg:ml-6 mb-6">
                            <div className="mt-4 flex items-center">
                                <label htmlFor="reciever-name" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Keterangan
                                </label>
                                <textarea className="form-textarea mt-4" placeholder="Masukkan Keterangan" value={keterangan} onChange={(e) => setKeterangan(e.target.value)}></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8">
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Barang</th>
                                    <th className="w-1">Banyak</th>
                                    <th className="w-1">Harga</th>
                                    <th>Total</th>
                                    <th className="w-1"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: any) => (
                                    <tr className="align-top" key={item.id}>
                                        <td>
                                            <select className="form-select" value={item.barang_id || ''} onChange={(e) => updateItem(item.id, 'barang_id', Number(e.target.value))}>
                                                <option value="" disabled>
                                                    Barang Mentah
                                                </option>
                                                {dataBarang.map((barang: any) => (
                                                    <option key={barang.id} value={barang.id}>
                                                        {barang.kode_barang} - {barang.nama_barang}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-input w-32"
                                                placeholder="Quantity"
                                                min={0}
                                                value={item.jumlah}
                                                onChange={(e) => updateItem(item.id, 'jumlah', Number(e.target.value))}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-input w-32"
                                                placeholder="Price"
                                                min={0}
                                                value={item.harga_satuan}
                                                onChange={(e) => updateItem(item.id, 'harga_satuan', Number(e.target.value))}
                                            />
                                        </td>
                                        <td>Rp {item.jumlah * item.harga_satuan}</td>
                                        <td>
                                            <button type="button" onClick={() => removeItem(item.id)}>
                                                <IconX className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between sm:flex-row flex-col mt-6 px-4">
                        <button type="button" className="btn btn-primary" onClick={addItem}>
                            Add Item
                        </button>
                    </div>
                </div>
                <div className="mt-8">
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Karyawan</th>
                                    <th className="w-1">Mesin</th>
                                    <th className="w-1"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: any) => (
                                    <tr className="align-top" key={item.id}>
                                        <td>
                                            <select className="form-select" value={item.barang_id || ''} onChange={(e) => updateItem(item.id, 'barang_id', Number(e.target.value))}>
                                                <option value="" disabled>
                                                    Karyawan
                                                </option>
                                                {dataBarang.map((barang: any) => (
                                                    <option key={barang.id} value={barang.id}>
                                                        {barang.kode_barang} - {barang.nama_barang}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select className="form-select" value={item.barang_id || ''} onChange={(e) => updateItem(item.id, 'barang_id', Number(e.target.value))}>
                                                <option value="" disabled>
                                                    Mesin   
                                                </option>
                                                {dataBarang.map((barang: any) => (
                                                    <option key={barang.id} value={barang.id}>
                                                        {barang.kode_barang} - {barang.nama_barang}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            <button type="button" onClick={() => removeItem(item.id)}>
                                                <IconX className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between sm:flex-row flex-col mt-6 px-4">
                        <button type="button" className="btn btn-primary" onClick={addItem}>
                            Add Item
                        </button>
                    </div>
                </div>
                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                <div className="flex justify-between flex-wrap px-4">
                    <button type="button" className="btn btn-success w-full gap-2">
                        <IconSave className="ltr:mr-2 rtl:ml-2 shrink-0" /> {isEdit ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Add;
