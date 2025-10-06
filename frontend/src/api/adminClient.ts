/**
 * API клиент для админ-панели
 */
import axios from 'axios';

// Создаем экземпляр axios для API
export const adminClient = axios.create({
    baseURL: 'http://localhost:8000/api',
});

// Добавляем перехватчик для автоматического добавления токена в заголовки
adminClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Добавляем перехватчик ошибок для отладки
adminClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
        });
        return Promise.reject(error);
    }
);
