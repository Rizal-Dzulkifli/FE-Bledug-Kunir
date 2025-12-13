import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

const ResetPasswordCover = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Reset Password'));
    }, [dispatch]);

    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Ambil email dan token dari URL
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');
    
        if (password !== confirmPassword) {
            setError('Password dan Konfirmasi Password harus sama.');
            return;
        }
    
        try {
            const response = await fetch(`${API_BASE_URL}/password/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, email, password }),
            });
    
            const result = await response.json();
            if (response.ok) {
                setMessage('Password berhasil direset. Anda sekarang dapat login dengan password baru.');
                setTimeout(() => navigate('/login'), 2000); // Redirect setelah 2 detik
            } else {
                throw new Error(result.message || 'Gagal mereset password.');
            }
        } catch (error) {
            setError('Terjadi kesalahan saat mereset password.');
            console.error(error);
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
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg] relative z-10">
                            <div className="mt-24 hidden w-full max-w-[450px] lg:block pl-20 mb-20">
                                <img src="/assets/images/auth/aktivasi.svg" alt="Cover Image" className="w-full" />
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
                                <p>Masukkan kata sandi baru untuk mengatur ulang akun Anda.</p>
                            </div>
                            <form className="space-y-5" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="Password">Kata Sandi Baru</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Password"
                                            type="password"
                                            placeholder="Masukkan Kata Sandi Baru"
                                            className="form-input pl-10 placeholder:text-white-dark"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <i className="fa-solid fa-lock"></i>
                                        </span>
                                    </div>
                        
                                </div>
                                <div>
                                    <label htmlFor="ConfirmPassword">Konfirmasi Kata Sandi</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="ConfirmPassword"
                                            type="password"
                                            placeholder="Konfirmasi Kata Sandi Baru"
                                            className="form-input pl-10 placeholder:text-white-dark"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <i className="fa-solid fa-lock"></i>
                                        </span>
                                    </div>
                                </div>
                                {error && <div className="text-red-500 text-center">{error}</div>}
                                {message && <div className="text-green-500 text-center">{message}</div>}
                                <button
                                    type="submit"
                                    className="btn !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(53,103,103,0.44)] bg-[#EF6823] text-white"
                                >
                                    Atur Ulang Kata Sandi
                                </button>
                            </form>
                        </div>
                        <div className="text-center dark:text-white">
                            <div className="dark:text-white-dark text-center pt-4 mt-auto">© {new Date().getFullYear()}. SMK Negeri 1 Jenangan.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    
};

export default ResetPasswordCover;
