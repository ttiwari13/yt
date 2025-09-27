import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api';

interface User {
    id: string;
    email: string;
    username: string; 
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: User, token: string) => void;
    logout: () => void;
    refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            console.log("Fetching user profile...");
            const response = await API.get('/api/user/profile');
            
            console.log("User profile response:", response.data);
            const userData: User = {
                id: response.data.id || response.data.user_id || 'unknown',
                email: response.data.email,
                username: response.data.username,
            };
            
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
        } catch (error: any) {
            console.error("Failed to fetch user details:", error);
            if (error.response?.status === 401) {
                console.log("Token expired or invalid, clearing auth data");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback((userData: User, token: string) => {
        console.log("🔑 Logging in user:", userData); 
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        console.log("🚪 Logging out user"); 
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    const refetchUser = useCallback(async () => {
        setIsLoading(true);
        await fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log("Loaded user from localStorage:", parsedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error("Error parsing stored user data:", error);
                localStorage.removeItem('user');
            }
        }
        fetchUser();
    }, [fetchUser]);

    const isAuthenticated = user !== null;

    const contextValue: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refetchUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};