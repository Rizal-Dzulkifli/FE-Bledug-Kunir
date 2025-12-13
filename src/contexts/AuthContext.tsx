import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState, ROLE_PERMISSIONS, RolePermissions } from '../types/auth';

// Action types
type AuthAction =
    | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
    | { type: 'LOGOUT' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'RESTORE_SESSION'; payload: { user: User; token: string } };

// Initial state
const initialState: AuthState & { loading: boolean } = {
    user: null,
    token: null,
    isAuthenticated: false,
    role: null,
    loading: true,
};

// Reducer
const authReducer = (state: typeof initialState, action: AuthAction): typeof initialState => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
        case 'RESTORE_SESSION':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                role: action.payload.user.role,
                loading: false,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                role: null,
                loading: false,
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload,
            };
        default:
            return state;
    }
};

// Context type
interface AuthContextType {
    state: typeof initialState;
    login: (user: User, token: string) => void;
    logout: () => void;
    hasPermission: (permission: keyof RolePermissions) => boolean;
    hasRole: (role: UserRole) => boolean;
    canAccessMenu: (menuName: string) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Restore session on app start
    useEffect(() => {
        const restoreSession = () => {
            try {
                const token = localStorage.getItem('token');
                const userString = localStorage.getItem('user');
                
                if (token && userString) {
                    const user = JSON.parse(userString);
                    dispatch({ type: 'RESTORE_SESSION', payload: { user, token } });
                } else {
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            } catch (error) {
                console.error('Error restoring session:', error);
                // Clear corrupted data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('user_id');
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        restoreSession();
    }, []);

    const login = (user: User, token: string) => {
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_id', user.user_id.toString());
        
        // Update state
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    };

    const logout = () => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        
        // Update state
        dispatch({ type: 'LOGOUT' });
    };

    const hasPermission = (permission: keyof RolePermissions): boolean => {
        if (!state.role) return false;
        return ROLE_PERMISSIONS[state.role][permission];
    };

    const hasRole = (role: UserRole): boolean => {
        return state.role === role;
    };

    const canAccessMenu = (menuName: string): boolean => {
        if (!state.role) return false;
        
        // Define menu permissions
        const menuPermissions: Record<string, keyof RolePermissions> = {
            'dashboard': 'canAccessDashboard',
            'inventaris': 'canAccessInventaris',
            'masterdata': 'canAccessMasterData',
            'produksi': 'canAccessProduksi',
            'pemeliharaan': 'canAccessPemeliharaan',
            'pengadaan': 'canAccessPengadaan',
            'pesanan': 'canAccessPesanan',
            'users': 'canAccessUsers',
            'gaji': 'canAccessGaji',
            'pengiriman': 'canAccessPengiriman',
            'laporan': 'canAccessLaporan',
            'keuangan': 'canAccessKeuangan',
        };

        const permission = menuPermissions[menuName];
        return permission ? hasPermission(permission) : false;
    };

    const value: AuthContextType = {
        state,
        login,
        logout,
        hasPermission,
        hasRole,
        canAccessMenu,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};