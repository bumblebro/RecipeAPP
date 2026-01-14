import auth from '@react-native-firebase/auth';

// Base URL for the backend API
// For iOS Simulator: http://localhost:4000/api
// For Android Emulator: http://10.0.2.2:4000/api
// For Physical Device: Use your computer's local IP address (e.g., http://192.168.1.5:4000/api)
// For Physical Device: Use your computer's local IP address (e.g., http://192.168.1.5:4000/api)
// Configure this in .env file as EXPO_PUBLIC_API_URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL + '/api' || 'http://localhost:4000/api';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    status: number;
    data: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Generic API client wrapper
 */
async function client<T>(
    endpoint: string,
    { body, ...customConfig }: RequestInit = {}
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    // Get current Firebase user token
    const currentUser = auth().currentUser;
    if (currentUser) {
        try {
            const token = await currentUser.getIdToken();
            headers.Authorization = `Bearer ${token}`;
        } catch (error) {
            console.error('Error getting ID token:', error);
        }
    }

    const config: RequestInit = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers: {
            ...headers,
            ...customConfig.headers,
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    try {
        const response = await fetch(`${BASE_URL}/${cleanEndpoint}`, config);
        const data = await response.json();

        if (response.ok) {
            return data;
        }

        throw new ApiError(response.status, data.error || response.statusText, data);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        // Network errors or JSON parsing errors
        throw new ApiError(
            500,
            error instanceof Error ? error.message : 'Network error occurred'
        );
    }
}

export const api = {
    get: <T>(endpoint: string, config?: RequestInit) =>
        client<T>(endpoint, { ...config, method: 'GET' }),

    post: <T>(endpoint: string, body: any, config?: RequestInit) =>
        client<T>(endpoint, { ...config, method: 'POST', body }),

    put: <T>(endpoint: string, body: any, config?: RequestInit) =>
        client<T>(endpoint, { ...config, method: 'PUT', body }),

    delete: <T>(endpoint: string, config?: RequestInit) =>
        client<T>(endpoint, { ...config, method: 'DELETE' }),
};
