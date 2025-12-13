import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';
import IconPrinter from '../../../components/Icon/IconPrinter';
import IconEdit from '../../../components/Icon/IconEdit';

interface Barang {
    pengadaan_barang_id: number;
    barang_id: number;
    supplier_id: number;
    nama_barang: string;
    jumlah: number;
    harga_satuan: string;
    total_harga: string;
}

interface Pengadaan {
    nomor_surat: string;
    tanggal_pengadaan: string;
    dibuat_oleh: string;
    total_harga: string;
    barang: Barang[];
    keterangan: string;
}

const Preview = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const [data, setData] = useState<Pengadaan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Invoice Preview'));
    }, [dispatch]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Ambil token dari localStorage
                const token = localStorage.getItem('token');

                if (!token) {
                    throw new Error('Token not found');
                }

                const response = await fetch(buildApiUrl(`pengadaan/${id}`), {
                    method: 'GET',
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const result = await response.json();
                setData(result.data);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);


    const exportTable = () => {
        window.print();
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!data) {
        return <div>No data available</div>;
    }

    return (
        <div>
            <div className="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
                <button type="button" className="btn btn-primary gap-2" onClick={exportTable}>
                    <IconPrinter />
                    Print
                </button>
                <Link to={`/apps/invoice/add/${id}`} className="btn btn-warning gap-2">
                    <IconEdit />
                    Edit
                </Link>
            </div>
            <div className="panel">
                <div className="flex justify-between flex-wrap gap-4 px-4">
                    <div className="text-2xl font-semibold uppercase">Pengadaan</div>
                    <div className="shrink-0">
                        <img className="w-20 flex-none" src="/public/assets/images/auth/stmj.png" alt="logo" />
                    </div>
                </div>
                <div className="ltr:text-right rtl:text-left px-4">
                    <div className="space-y-1 mt-6 text-white-dark">
                        <div>Jl. Niken Gandini No.98, Plampitan, Setono, Kec. Jenangan, Kabupaten Ponorogo, Jawa Timur 63492</div>
                        <div>info@smkn1jenpo.sch.id</div>
                        <div>(0352) 481236</div>
                    </div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
                <div className="flex justify-between lg:flex-row flex-col gap-6 flex-wrap">
                    <div className="flex-1">
                        <div className="space-y-1 text-white-dark">
                            <div>Nomor Surat:</div>
                            <div className="text-black dark:text-white font-semibold">{data.nomor_surat}</div>
                        </div>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col gap-6 lg:w-2/3">
                        <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
                        </div>
                        <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
                            <div className="flex items-center w-full justify-between mb-2">
                                <div>Dibuat oleh:</div>
                                <div className="text-black dark:text-white font-semibold">{data.dibuat_oleh}</div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div>Tanggal Pengadaan:</div>
                                <div className="text-black dark:text-white font-semibold">{data.tanggal_pengadaan}</div>
                            </div>

                        </div>
                    </div>
                </div>
                <div className="flex justify-between lg:flex-row flex-col gap-6 mt-6 flex-wrap">
                    <div className="flex-1">
                        <div className="space-y-1 text-white-dark">

                        <div>Keterangan:</div>
                        <div className="text-black dark:text-white ">{data.keterangan}</div>

                        </div>
                    </div>
                </div>
                <div className="table-responsive mt-6">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>S.NO</th>
                                <th>ITEMS</th>
                                <th>QTY</th>
                                <th className="ltr:text-right rtl:text-left">PRICE</th>
                                <th className="ltr:text-right rtl:text-left">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.barang.map((barang: Barang, index: number) => (
                                <tr key={barang.pengadaan_barang_id}>
                                    <td>{index + 1}</td>
                                    <td>{barang.nama_barang}</td>
                                    <td>{barang.jumlah}</td>
                                    <td className="ltr:text-right rtl:text-left">{barang.harga_satuan}</td>
                                    <td className="ltr:text-right rtl:text-left">{barang.total_harga}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="grid sm:grid-cols-2 grid-cols-1 px-4 mt-6">
                    <div></div>
                    <div className="ltr:text-right rtl:text-left space-y-2">
                        <div className="flex items-center font-semibold text-lg">
                            <div className="flex-1">Grand Total</div>
                            <div className="w-[37%]">{data.total_harga}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preview;
