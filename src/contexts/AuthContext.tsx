import * as SecureStore from "expo-secure-store";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { setApiTokenProvider, setUnauthorizedHandler, authAPI } from "../services/api";
import type { LoginRequest, SignupRequest, User } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    signup: (data: SignupRequest) => Promise<void>;
    logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    signup: async () => { },
    logout: async () => { },
});

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_KEY = "ikkii_jwt_token";
const USER_KEY = "ikkii_user_data";

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ── Persist / clear token ────────────────────────────────────────────────

    const persistAuth = useCallback(async (jwt: string, userData: User) => {
        await SecureStore.setItemAsync(TOKEN_KEY, jwt);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
        setToken(jwt);
        setUser(userData);
    }, []);

    const clearAuth = useCallback(async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        setToken(null);
        setUser(null);
    }, []);

    // ── Load token on mount ──────────────────────────────────────────────────

    useEffect(() => {
        (async () => {
            try {
                const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
                const storedUser = await SecureStore.getItemAsync(USER_KEY);
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (err) {
                console.error("[Auth] Failed to load stored auth:", err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    // ── Register API token provider & 401 handler ────────────────────────────

    useEffect(() => {
        setApiTokenProvider(() => token);
    }, [token]);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            clearAuth();
        });
    }, [clearAuth]);

    // ── Auth actions ─────────────────────────────────────────────────────────

    const login = useCallback(
        async (data: LoginRequest) => {
            const res = await authAPI.login(data);
            await persistAuth(res.token, res.user);
        },
        [persistAuth]
    );

    const signup = useCallback(
        async (data: SignupRequest) => {
            const res = await authAPI.signup(data);
            await persistAuth(res.token, res.user);
        },
        [persistAuth]
    );

    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch {
            // ignore — clearing local state regardless
        }
        await clearAuth();
    }, [clearAuth]);

    // ── Value ────────────────────────────────────────────────────────────────

    const value = useMemo<AuthContextState>(
        () => ({
            user,
            token,
            isAuthenticated: !!token && !!user,
            isLoading,
            login,
            signup,
            logout,
        }),
        [user, token, isLoading, login, signup, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
    return useContext(AuthContext);
}
