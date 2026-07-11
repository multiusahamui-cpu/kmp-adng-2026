
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Member App
import AppInternal from './AppInternal'; // Internal App
import { Login } from './pages/Login';
import { LoginInternal } from './pages/LoginInternal';
import { Register } from './pages/Register';
import { ToastProvider } from './components/Toast';
import { User, SystemConfig } from './types';
import { DEFAULT_SYSTEM_CONFIG } from './constants';
import { loadData, saveData, STORAGE_KEYS } from './utils/storage';
import { systemService } from './services/system.service';
import { authService } from './services/auth.service';
import './index.css';

// --- SESSION CONSTANTS ---
const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 Menit

const RootApp: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [isInternalMode, setIsInternalMode] = useState(false); 
    
    // Config State
    const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => loadData(STORAGE_KEYS.SYSTEM_CONFIG, DEFAULT_SYSTEM_CONFIG));
    
    // UI State
    const [publicRoute, setPublicRoute] = useState<'login' | 'register'>('login');
    const [isInitializing, setIsInitializing] = useState(true);
    const [initError, setInitError] = useState<string | null>(null);
    
    // LOGOUT REASON STATE
    const [logoutReason, setLogoutReason] = useState<'idle' | 'offline' | null>(null);

    // --- SESSION MONITORING REF ---
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- 1. INITIAL CHECK (ON MOUNT) ---
    useEffect(() => {
        const initSession = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsInitializing(false);
                return;
            }

            try {
                const userData = await authService.getProfile();
                if (!userData || typeof userData !== 'object') {
                    throw new Error("Data user korup dari server.");
                }
                setUser(userData);

                try {
                    const remoteConfig = await systemService.getConfig();
                    if(remoteConfig) {
                        setSystemConfig(remoteConfig);
                        saveData(STORAGE_KEYS.SYSTEM_CONFIG, remoteConfig);
                    }
                } catch (confErr) {
                    console.warn("Gagal load config, pakai default", confErr);
                }

            } catch (error: any) {
                console.error("Session initialization failed:", error);
                authService.logout();
                setUser(null);
            } finally {
                setIsInitializing(false);
            }
        };

        initSession();
    }, []);

    // --- 2. GLOBAL SESSION MONITOR (IDLE & OFFLINE) ---
    useEffect(() => {
        if (!user) return;

        const handleOffline = () => {
            console.warn("OFFLINE DETECTED: Killing Session immediately.");
            handleLogout('offline');
        };

        const resetIdleTimer = () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                console.warn("IDLE TIMEOUT: User inactive for 3 mins.");
                handleLogout('idle');
            }, IDLE_TIMEOUT_MS);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('click', resetIdleTimer);
        window.addEventListener('keydown', resetIdleTimer);
        window.addEventListener('scroll', resetIdleTimer);
        window.addEventListener('touchstart', resetIdleTimer);

        resetIdleTimer();

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('mousemove', resetIdleTimer);
            window.removeEventListener('click', resetIdleTimer);
            window.removeEventListener('keydown', resetIdleTimer);
            window.removeEventListener('scroll', resetIdleTimer);
            window.removeEventListener('touchstart', resetIdleTimer);
        };
    }, [user]);

    // --- HANDLERS ---
    const handleLoginSuccess = async (userData: User) => {
        setIsInitializing(true);
        setLogoutReason(null);
        setUser(userData);

        try {
            const remoteConfig = await systemService.getConfig();
            if (remoteConfig) {
                setSystemConfig(remoteConfig);
                saveData(STORAGE_KEYS.SYSTEM_CONFIG, remoteConfig);
            }
        } catch (error) {
            console.warn("Config fetch failed post-login");
        } finally {
            setIsInitializing(false);
        }
    };

    const handleLogout = (reason?: 'idle' | 'offline') => {
        authService.logout();
        setUser(null);
        setIsInternalMode(false); 
        setPublicRoute('login');
        setInitError(null);
        
        if (reason) {
            setLogoutReason(reason);
        }
    };

    // --- RENDER LOGIC ---
    const renderContent = () => {
        if (isInitializing) {
            return (
                <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-emerald-500 font-bold tracking-widest animate-pulse">MEMUAT SISTEM KMP-ADNG...</p>
                </div>
            );
        }

        if (initError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Gagal Memuat Aplikasi</h2>
                    <p className="text-gray-600 mb-4">{initError}</p>
                    <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded">Muat Ulang</button>
                </div>
            );
        }

        // --- AUTHENTICATED STATE ---
        if (user) {
            const safeRoles = Array.isArray(user.roles) ? user.roles : [];
            const safeUser = { ...user, roles: safeRoles };

            const internalRoles = ['super_admin', 'admin', 'management', 'cashier', 'accountant', 'general_manager', 'pengurus', 'account_officer'];
            const hasInternalRole = safeRoles.some(r => internalRoles.includes(r));

            if (hasInternalRole) {
                return <AppInternal user={safeUser} systemConfig={systemConfig} onLogout={() => handleLogout()} onUpdateConfig={setSystemConfig} onUpdateUser={(updatedData) => setUser({ ...safeUser, ...updatedData })} />;
            } else {
                return <App user={safeUser} systemConfig={systemConfig} onLogout={() => handleLogout()} onUpdateUser={(updatedData) => setUser({ ...safeUser, ...updatedData })} />;
            }
        }

        // --- PUBLIC STATE ---
        if (publicRoute === 'register') {
            return <Register onNavigate={() => setPublicRoute('login')} onRegister={() => {}} />;
        }

        if (isInternalMode) {
            return (
                <LoginInternal 
                    onLogin={handleLoginSuccess}
                    onBackToMember={() => setIsInternalMode(false)}
                />
            );
        }

        return (
            <Login 
                onLogin={handleLoginSuccess}
                onRegisterClick={() => setPublicRoute('register')}
                onSwitchToInternal={() => setIsInternalMode(true)}
                logoutReason={logoutReason} 
            />
        );
    };

    return (
        <ToastProvider>
            {renderContent()}
        </ToastProvider>
    );
};

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <RootApp />
    );
} else {
    console.error("Failed to find root element");
}

export default RootApp;
