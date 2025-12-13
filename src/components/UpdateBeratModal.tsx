import React, { useState } from 'react';
import { Icon } from '@iconify-icon/react';

interface UpdateBeratModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (berat: number) => Promise<void>;
    currentBerat: number | null;
    produksiKode: string;
    loading?: boolean;
}

const UpdateBeratModal: React.FC<UpdateBeratModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    currentBerat,
    produksiKode,
    loading = false
}) => {
    const [berat, setBerat] = useState<string>(currentBerat?.toString() || '');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const beratNum = parseFloat(berat);
        
        if (isNaN(beratNum) || beratNum <= 0) {
            setError('Berat harus berupa angka yang valid dan lebih dari 0');
            return;
        }

        if (beratNum > 9999) {
            setError('Berat tidak boleh lebih dari 9999kg');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(beratNum);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Gagal mengupdate berat hasil');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setBerat(currentBerat?.toString() || '');
            setError(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Update Berat Hasil
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={submitting}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                    >
                        <Icon icon="solar:close-circle-bold-duotone" width="24" height="24" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Produksi: <span className="font-medium text-gray-900 dark:text-white">{produksiKode}</span>
                        </p>
                        
                        <label htmlFor="berat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Berat Hasil (kg)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                id="berat"
                                value={berat}
                                onChange={(e) => setBerat(e.target.value)}
                                step="0.1"
                                min="0.1"
                                max="9999"
                                placeholder="Masukkan berat hasil dalam kg"
                                className="form-input pr-10"
                                disabled={submitting}
                                required
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-500 text-sm">kg</span>
                            </div>
                        </div>
                        
                        {currentBerat !== null && (
                            <p className="text-xs text-gray-500 mt-1">
                                Berat sebelumnya: {currentBerat}kg
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Icon icon="solar:danger-circle-bold-duotone" width="16" height="16" className="text-red-500" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="flex-1 btn btn-outline-dark disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !berat}
                            className="flex-1 btn btn-primary disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Icon icon="eos-icons:loading" width="16" height="16" className="animate-spin mr-2" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateBeratModal;