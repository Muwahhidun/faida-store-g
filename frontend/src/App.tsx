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
import ImageTest from './pages/ImageTest';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from "./pages/LoginPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import ProtectedRoute from "./components/ProtectedRoute";

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
            
            {/* Категории */}
            <Route path="/category/:slug" element={<CategoryPage />} />
            
            {/* Тест изображений */}
            <Route path="/test-images" element={<ImageTest />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/panel" element={<AdminPanelPage />} />
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