import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Icon } from '@iconify-icon/react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { API_BASE_URL } from '../../config/api';

const ResetPasswordBoxed = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Reset Password'));
    }, [dispatch]);

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Reset error state

        // Validasi email kosong
        if (!email) {
            setError('Email tidak boleh kosong');
            return;
        }

        setIsLoading(true);

        try {
            // Cek terlebih dahulu apakah email ada di database tanpa SweetAlert
            const checkResponse = await fetch(`${API_BASE_URL}/password/check-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            // Jika email tidak ditemukan, tampilkan pesan error tanpa SweetAlert
            if (checkResponse.status === 404) {
                setError('Email tidak terdaftar');
                setIsLoading(false);
                return;
            }

            // Jika email valid, tampilkan SweetAlert loader untuk permintaan reset
            Swal.fire({
                title: 'Mengirim link reset...',
                html: '<span class="animate-spin border-4 border-[#EF6823] border-l-transparent rounded-full w-10 h-10 inline-block align-middle m-auto mb-10 mt-5"></span>',
                showConfirmButton: false,
                allowOutsideClick: false,
            });

            // Lakukan permintaan reset password
            const resetResponse = await fetch(`${API_BASE_URL}/password/resetlink`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            setIsLoading(false);

            if (!resetResponse.ok) {
                throw new Error("Gagal mengirim link reset. Silakan coba lagi.");
            }

            // Tampilkan pesan sukses jika permintaan reset berhasil
            Swal.fire({
                icon: 'success',
                title: 'Link reset telah dikirim ke email Anda.',
                confirmButtonColor: '#EF6823',
                confirmButtonText: 'OK',
            });
            navigate("/");
        } catch (error) {
            // Tampilkan SweetAlert error jika ada kesalahan selain email tidak terdaftar
            Swal.fire({
                icon: 'error',
                title: 'Gagal mengirim link reset',
                text: (error as Error).message,
                confirmButtonColor: '#EF6823',
                confirmButtonText: 'OK',
            });
            setIsLoading(false);
        }
    };

    return (
        <div>
             <div className="absolute inset-0 z-0" style={{ backgroundColor: '#f8f9fa' }}>
                <img 
                    src="/assets/images/auth/bg-gradient2.png" 
                    alt="image" 
                    className="h-full w-full object-cover" 
                    style={{ opacity: 1, filter: 'none' }}
                />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
                <div className="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[458px] lg:flex-row lg:gap-10 xl:gap-0">
                    <div className="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,#ffd307_0%,#f47200_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                        <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px] z-0" />
                        <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2 z-0" />
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg] relative z-10">
                            <div className="mt-24 hidden w-full max-w-[450px] lg:block pl-20 mb-20">
                                <img src="/assets/images/auth/reset-password.svg" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>

                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:top-6 lg:max-w-full">
                            <Link to="/" className="w-10">
                                <img src="/assets/images/auth/logo.png" alt="Gambar Reset Password" />
                            </Link>
                        </div>
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-7">
                                <h1 className="mb-3 text-2xl font-bold !leading-snug dark:text-white">Atur Ulang Kata Sandi</h1>
                                <p>Masukkan email Anda untuk memulihkan ID Anda</p>
                            </div>
                            <form className="space-y-5" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="Email">Email</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Email"
                                            type="email"
                                            placeholder="Masukkan Email"
                                            className="form-input pl-10 placeholder:text-white-dark"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                        <span className="absolute left-3 mt-2">
                                        <Icon icon="solar:letter-bold-duotone" width="1.2rem" height="1.2rem" />
                                        </span>
                                    </div>
                                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                                </div>

                                <button
                                    type="submit"
                                    className="btn !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(53,103,103,0.44)] bg-[#EF6823] text-white"
                                >
                                    Kirim
                                </button>
                            </form>
                        </div>
                        <div className="text-center dark:text-white">
                            <div className="dark:text-white-dark text-center pt-4 mt-auto">© {new Date().getFullYear()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default ResetPasswordBoxed;
