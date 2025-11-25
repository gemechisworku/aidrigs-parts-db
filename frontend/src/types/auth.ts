// TypeScript types for authentication
export interface User {
    id: string;
    email: string;
    username: string;
    first_name?: string;
    last_name?: string;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}
