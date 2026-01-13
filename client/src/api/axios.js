import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle rate limiting
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 429) {
            const message = error.response?.data?.message || 'Too many requests. Please slow down.';
            toast.error(message, {
                id: 'rate-limit-toast',
                duration: 5000,
            });
            // Mark error as handled to prevent duplicate toasts in components
            error.handled = true;
        }
        return Promise.reject(error);
    }
);

export default api;