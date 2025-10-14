/**
 * Основное приложение React.
 */

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

// Layout компоненты
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { CartProvider } from './contexts/CartContext';

// Ленивая загрузка страниц
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import NewsEditorPage from './pages/NewsEditorPage';
import ContactsPage from './pages/ContactsPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import JobEditorPage from './pages/JobEditorPage';
import ImageTest from './pages/ImageTest';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ActivateAccountPage from "./pages/ActivateAccountPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthenticatedRoute from "./components/AuthenticatedRoute";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <CartProvider>
        <Toaster position="top-right" />
        <Helmet
        defaultTitle="Faida Group Store - Качественные халяль продукты"
        titleTemplate="%s | Faida Group Store"
      >
        <meta name="description" content="Интернет-магазин качественных халяль продуктов Faida Group. Натуральные колбасные изделия, мясные деликатесы с доставкой по России." />
        <meta name="keywords" content="халяль, колбаса, мясные продукты, натуральные, качественные, доставка" />
        <meta name="author" content="Faida Group" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Faida Group Store - Качественные халяль продукты" />
        <meta property="og:description" content="Интернет-магазин качественных халяль продуктов с доставкой по России" />
        <meta property="og:image" content="/og-image.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Faida Group Store" />
        <meta name="twitter:description" content="Качественные халяль продукты с доставкой" />
      </Helmet>

      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Главная страница */}
            <Route path="/" element={<HomePage />} />
            
            {/* Каталог товаров */}
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            
            {/* Корзина */}
            <Route path="/cart" element={<CartPage />} />

            {/* Оформление заказа (защищенный маршрут) */}
            <Route element={<AuthenticatedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
            </Route>

            {/* Категории */}
            <Route path="/category/:slug" element={<CategoryPage />} />

            {/* Новости */}
            <Route path="/news" element={<NewsPage />} />

            {/* Создание и редактирование новостей (защищенные маршруты, должны быть ДО :slug) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/news/new" element={<NewsEditorPage />} />
              <Route path="/news/edit/:slug" element={<NewsEditorPage />} />
            </Route>

            {/* Детальная страница новости (последняя, чтобы не конфликтовать) */}
            <Route path="/news/:slug" element={<NewsDetailPage />} />

            {/* Контакты и доставка */}
            <Route path="/contacts" element={<ContactsPage />} />

            {/* Вакансии */}
            <Route path="/jobs" element={<JobsPage />} />

            {/* Создание и редактирование вакансий (защищенные маршруты, должны быть ДО :slug) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/jobs/new" element={<JobEditorPage />} />
              <Route path="/jobs/edit/:slug" element={<JobEditorPage />} />
            </Route>

            {/* Детальная страница вакансии (последняя, чтобы не конфликтовать) */}
            <Route path="/jobs/:slug" element={<JobDetailPage />} />

            {/* Тест изображений */}
            <Route path="/test-images" element={<ImageTest />} />

            {/* Аутентификация */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/password/reset/confirm/:uid/:token" element={<ResetPasswordPage />} />
            <Route path="/activate/:uid/:token" element={<ActivateAccountPage />} />

            {/* Админ-панель (только для админов и модераторов) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/panel" element={<AdminPanelPage />} />
            </Route>

            {/* Личный кабинет (для всех авторизованных пользователей) */}
            <Route element={<AuthenticatedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* 404 страница */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
      </CartProvider>
    </ErrorBoundary>
  );
};

export default App;