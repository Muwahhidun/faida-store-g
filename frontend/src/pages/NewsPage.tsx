import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FaNewspaper, FaCalendarAlt, FaEye, FaPlus, FaTag } from 'react-icons/fa';
import { NewsListItem } from '../types';
import api from '../api/client';

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
    checkUserRole();
  }, []);

  const checkUserRole = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        setUserRole(decoded.role);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/news/');
      setNews(response.data.results || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки новостей');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не опубликовано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canManageNews = userRole === 'admin' || userRole === 'moderator';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Новости - Faida Group</title>
        <meta name="description" content="Последние новости компании Faida Group" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Новости</h1>
            <p className="text-gray-600">
              {news.length > 0
                ? `Всего новостей: ${news.length}`
                : 'Пока нет опубликованных новостей'}
            </p>
          </div>

          {canManageNews && (
            <Link
              to="/news/new"
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Добавить новость
            </Link>
          )}
        </div>

        {news.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <FaNewspaper className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Пока нет новостей</h2>
              <p className="text-gray-600">
                Следите за обновлениями! Здесь будут публиковаться новости компании, акции и
                специальные предложения.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.slug}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                {/* Превью изображение */}
                <div className="w-full h-48 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center overflow-hidden">
                  {item.preview_image ? (
                    <img
                      src={item.preview_image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaNewspaper className="w-16 h-16 text-emerald-300" />
                  )}
                </div>

                {/* Контент */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Категория и статус */}
                  <div className="flex items-center gap-2 mb-3">
                    {item.category_name && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                        <FaTag className="w-3 h-3 mr-1" />
                        {item.category_name}
                      </span>
                    )}
                    {!item.is_published && canManageNews && (
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                        Черновик
                      </span>
                    )}
                  </div>

                  {/* Заголовок */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-emerald-600 line-clamp-2">
                    {item.title}
                  </h2>

                  {/* Описание */}
                  <p className="text-gray-600 mb-4 line-clamp-3 flex-1">{item.short_description}</p>

                  {/* Метаинформация */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <FaCalendarAlt className="w-4 h-4 mr-1" />
                      {formatDate(item.published_at)}
                    </div>
                    <div className="flex items-center">
                      <FaEye className="w-4 h-4 mr-1" />
                      {item.views_count}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
