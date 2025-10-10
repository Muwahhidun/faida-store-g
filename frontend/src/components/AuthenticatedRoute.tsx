import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Компонент для защиты маршрутов, доступных только авторизованным пользователям.
 * Проверяет только наличие токена, без проверки роли.
 * Используется для личного кабинета и других страниц для всех авторизованных пользователей.
 */
const AuthenticatedRoute: React.FC = () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
        // Если нет токена, редирект на страницу входа
        return <Navigate to="/login" replace />;
    }

    // Если токен есть, разрешаем доступ
    return <Outlet />;
};

export default AuthenticatedRoute;
