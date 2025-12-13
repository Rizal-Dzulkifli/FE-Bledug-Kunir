import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { Icon } from '@iconify-icon/react';
import { IRootState } from '../../store';
import { useAuth } from '../../contexts/AuthContext';
import { LoginResponse } from '../../types/auth';
import { API_BASE_URL } from '../../config/api';

const LoginBoxed = () => {
    const dispatch = useDispatch();
    const { login } = useAuth();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const isDarkMode = themeConfig.theme === 'dark';
    
    useEffect(() => {
        dispatch(setPageTitle('Login '));
    }, [dispatch]);

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const result: LoginResponse = await response.json();

            if (!response.ok || !result.data?.token?.token) {
                throw new Error(result.message || 'Login failed');
            }

            // Use AuthContext login method
            login(result.data.user, result.data.token.token);
            
            console.log('Login successful, user role:', result.data.user.role);
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || 'Email atau password salah');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#f8f9fa' }}> {/* Force light background */}
            {/* Background Layer - SELALU LIGHT MODE dengan force styling */}
            <div className="absolute inset-0 z-0" style={{ backgroundColor: '#f8f9fa' }}>
                <img 
                    src="/assets/images/auth/bg-gradient2.png" 
                    alt="image" 
                    className="h-full w-full object-cover" 
                    style={{ opacity: 1, filter: 'none' }}
                />
            </div>

            {/* Content Layer - Background paksa light */}
            <div 
                className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 sm:px-16"
                style={{ 
                    backgroundImage: 'url(/assets/images/auth/map.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'transparent'
                }}
            >
                
                {/* Form Container - Mengikuti mode dark/light */}
                <div className={`relative w-full max-w-[700px] rounded-md p-2 ${
                    isDarkMode 
                        ? 'bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]'
                        : 'bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)]'
                }`}>
                    <div className={`relative flex flex-col justify-center rounded-md backdrop-blur-lg px-6 lg:min-h-[400px] py-20 ${
                        isDarkMode ? 'bg-black/90' : 'bg-white/90'
                    }`}>
                        {error && <div className="text-red-500 text-center">{error}</div>}

                        <div className="mx-auto w-full max-w-[500px] flex pb-10 ">
                                                    <div className="pl-6 flex justify-center">
                            <img src="/assets/images/auth/logo.png" alt="Gambar Sign In" className="w-[100px] h-auto max-h-[100px] object-contain" />
                        </div>
                            <div className="pl-5 flex flex-col justify-center">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug md:text-4xl" style={{ color: '#356767' }}>
                                    Masuk
                                </h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Masukkan email dan kata sandi Anda untuk login</p>
                            </div>
                        </div>

                        <div className="mx-auto w-full max-w-[440px]">
                            <form className={`space-y-5 ${isDarkMode ? 'text-white' : 'text-black'}`} onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="Email">Email</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Email"
                                            type="email"
                                            placeholder="Masukkan Email"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                        <span className="absolute start-3 mt-2">
                                            <Icon icon="solar:letter-bold-duotone" width="1.2rem" height="1.2rem" />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="Password">Kata Sandi</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Password"
                                            type="password"
                                            placeholder="Masukkan Kata Sandi"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <span className="absolute start-3 mt-2 ">
                                            <Icon icon="solar:lock-password-bold-duotone" width="1.2rem" height="1.2rem" />
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn  !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(53,103,103,0.44)] disabled:opacity-50"
                                    style={{ backgroundColor: '#EF6823', color: '#FFFFFF' }}
                                >
                                    {loading ? (
                                        <>
                                            <Icon icon="eos-icons:loading" width="1.2rem" height="1.2rem" className="animate-spin mr-2" />
                                            Memproses...
                                        </>
                                    ) : (
                                        'Masuk'
                                    )}
                                </button>
                            </form>
                            <div className={`text-center pt-5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Lupa Kata Sandi ?&nbsp;
                                <Link to="/auth/cover-password-reset" className={`text-primary underline transition ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>
                                    Atur Ulang Kata Sandi
                                </Link>
                            </div>
                            <div className="relative my-5 text-center md:mb-9">
                                <span className={`absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 ${isDarkMode ? 'bg-white-dark' : 'bg-white-light'}`}></span>
                            </div>

                            <div className={`text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                <div className={`text-center pt-4 mt-auto ${isDarkMode ? 'text-white-dark' : 'text-gray-600'}`}>© {new Date().getFullYear()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginBoxed;
