import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface Asset {
    id_asset: number;
    asset: string;
}

interface PemeliharaanItem {
    pemeliharaan_id: number;
    nomor_pemeliharaan: string;
    biaya: string;
    keterangan: string;
    user: { nama: string } | null;
    inventaris: {
        kode_inventaris: string;
        barang: { nama_barang: string };
    };
}

const PemeliharaanList: React.FC = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAssetData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch('http://localhost:3333/api/assets?limit=1000', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok) {
                // Handle different response formats
                let assetData;
                if (result.data && Array.isArray(result.data)) {
                    assetData = result.data;
                } else if (Array.isArray(result)) {
                    assetData = result;
                } else {
                    throw new Error('Format data tidak sesuai');
                }

                setAssets(assetData);
            } else {
                Swal.fire('Error', result.message || 'Gagal mengambil data asset', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan saat mengambil data asset', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssetData();
    }, []);

    // Fungsi untuk melihat pemeliharaan asset
    const handleViewPemeliharaan = (asset: Asset) => {
        // Navigate ke halaman add dengan parameter asset untuk melihat data pemeliharaan
        navigate(`/pemeliharaan/add/${asset.id_asset}`, { state: { selectedAsset: asset } });
    };

    // Fungsi untuk mendapatkan icon berdasarkan nama asset
    const getAssetIcon = (assetName: string) => {
        const name = assetName.toLowerCase();
        if (name.includes('truk')) {
            return 'solar:truck-bold-duotone';
        } else if (name.includes('mesin')) {
            return 'solar:settings-bold-duotone';
        } else {
            return 'solar:widget-4-bold-duotone';
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h2 className="text-xl">Pemeliharaan Asset </h2>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <Icon icon="eos-icons:loading" width="3rem" height="3rem" className="animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600">Memuat data asset...</p>
                </div>
            ) : (
                <div className="flex flex-wrap w-full justify-center gap-6 mb-5">
                    {assets.length > 0 ? (
                        assets.map((asset) => (
                            <div
                                key={asset.id_asset}
                                className="panel border border-gray-500/20 rounded-md shadow-[rgb(31_45_61_/_10%)_0px_2px_10px_1px] dark:shadow-[0_2px_11px_0_rgb(6_8_24_/_39%)] p-6 pt-14 mt-8 relative w-96 hover:shadow-lg transition-shadow"
                            >
                                <div className="bg-primary absolute text-white-light ltr:left-6 rtl:right-6 -top-8 w-16 h-16 rounded-md flex items-center justify-center mb-5 mx-auto">
                                    <Icon icon="svg-spinners:blocks-scale" width="24" height="24" />
                                </div>
                                <h5 className="text-dark text-lg font-semibold mb-3.5 dark:text-white-light">{asset.asset}</h5>
                                <p className="text-white-dark text-[15px] mb-3.5">Klik tombol di bawah untuk melihat riwayat pemeliharaan asset {asset.asset}</p>
                                <button type="button" className="text-primary font-semibold hover:underline group flex items-center gap-2" onClick={() => handleViewPemeliharaan(asset)}>
                                    Lihat Pemeliharaan
                                    <Icon icon="solar:arrow-right-line-duotone" width="1rem" height="1rem" className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 w-full">
                            <Icon icon="solar:widget-4-line-duotone" width="4rem" height="4rem" className="mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 text-lg">Tidak ada asset yang tersedia</p>
                            <p className="text-gray-500 text-sm mt-2">Silakan tambahkan asset terlebih dahulu di menu Master Data</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PemeliharaanList;
