import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

interface Barang {
    id: number;
    kode_barang: string;
    nama_barang: string;
    jumlah: number;
    kategori?: {
        kategori: string;
    };
}

interface Inventaris {
    id: number;
    kode_inventaris: string;
    lokasi: string;
    nama_barang?: string;
}

const Preview = () => {
    const { barang_id } = useParams<{ barang_id: string }>();
    const [barangDetail, setBarangDetail] = useState<Barang | null>(null);
    const [inventarisList, setInventarisList] = useState<Inventaris[]>([]);
    const [selectedItems, setSelectedItems] = useState<Inventaris[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBarangDetail();
        fetchInventarisByBarangId();
    }, [barang_id]);

    const fetchBarangDetail = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl(`barang/${barang_id}`), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to fetch barang detail');
            }

            const data = await response.json();
            setBarangDetail(data.data);
        } catch (error) {
            console.error('Error fetching barang detail:', error);
            Swal.fire('Error', 'Unable to fetch barang detail', 'error');
        }
    };

    const fetchInventarisByBarangId = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(
                buildApiUrl(`inventaris/barang/${barang_id}`),
                {
                    headers: getAuthHeaders(),
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to fetch inventaris');
            }

            const data = await response.json();
            setInventarisList(data.data || []);
        } catch (error) {
            console.error('Error fetching inventaris:', error);
            Swal.fire('Error', 'Unable to fetch inventaris', 'error');
        }
    };

    const handleCheckboxChange = (item: Inventaris) => {
        setSelectedItems((prev) => {
            if (prev.find((i) => i.id === item.id)) {
                return prev.filter((i) => i.id !== item.id);
            }
            return [...prev, { ...item, nama_barang: barangDetail?.nama_barang || 'Nama barang tidak ditemukan' }];
        });
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedItems([]);
        } else {
            const updatedItems = inventarisList.map((item) => ({
                ...item,
                nama_barang: barangDetail?.nama_barang || 'Nama barang tidak ditemukan',
            }));
            setSelectedItems(updatedItems);
        }
        setIsAllSelected(!isAllSelected);
    };

    const handlePreviewPage = () => {
        if (selectedItems.length === 0) {
            Swal.fire('Error', 'Tidak ada data yang dipilih untuk pratinjau', 'error');
            return;
        }

        navigate('/apps/cetak-label/list-data-barang/preview', { state: { selectedItems } });
    };

    return (
        <div className="space-y-6">
            <div className="panel">
                <h2 className="text-xl font-semibold">Data Barang</h2>
                {barangDetail && (
                    <div className="mt-4">
                        <p>Kode Barang: {barangDetail.kode_barang}</p>
                        <p>Nama Barang: {barangDetail.nama_barang}</p>
                        <p>Kategori: {barangDetail.kategori?.kategori || '-'}</p>
                        <p>Jumlah: {barangDetail.jumlah}</p>
                    </div>
                )}
            </div>

            <div className="panel">
                <h2 className="text-xl font-semibold">Inventaris Terkait</h2>
                <div className="table-responsive mt-4">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode Inventaris</th>
                                <th>Lokasi</th>
                                <th className="text-center">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox text-warning peer"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventarisList.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>{item.kode_inventaris}</td>
                                    <td>{item.lokasi || 'Tidak Ditempatkan'}</td>
                                    <td className="text-center">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox text-warning peer"
                                            checked={!!selectedItems.find((i) => i.id === item.id)}
                                            onChange={() => handleCheckboxChange(item)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button className="btn btn-primary mt-4" onClick={handlePreviewPage}>
                    Pratinjau Label
                </button>
            </div>
        </div>
    );
};

export default Preview;
