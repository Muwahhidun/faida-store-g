import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaTag,
  FaUser,
} from 'react-icons/fa';
import { NewsDetail } from '../types';
import api from '../api/client';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const NewsDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchNews();
    }
    checkUserRole();
  }, [slug]);

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
      const response = await api.get(`/news/${slug}/`);
      setNews(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки новости');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!news) return;

    try {
      setDeleting(true);
      await api.delete(`/news/${slug}/`);
      navigate('/news');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка удаления новости');
      console.error('Error deleting news:', err);
      setDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не опубликовано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canManageNews = userRole === 'admin' || userRole === 'moderator';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-red-600 text-lg">{error || 'Новость не найдена'}</div>
          <Link to="/news" className="text-emerald-600 hover:text-emerald-700 mt-4 inline-block">
            ← Вернуться к новостям
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>{news.title} - Новости Faida Group</title>
        <meta name="description" content={news.short_description} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Навигация */}
        <div className="mb-6">
          <Link
            to="/news"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Все новости
          </Link>
        </div>

        {/* Карточка новости */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Превью изображение */}
          {news.preview_image && (
            <div className="w-full h-96 overflow-hidden">
              <img
                src={news.preview_image}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Заголовок и мета */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {/* Категория и статус */}
                <div className="flex items-center gap-2 mb-3">
                  {news.category_name && (
                    <span className="inline-flex items-center px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-full">
                      <FaTag className="w-3 h-3 mr-2" />
                      {news.category_name}
                    </span>
                  )}
                  {!news.is_published && canManageNews && (
                    <span className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full">
                      Черновик
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3">{news.title}</h1>
                <p className="text-lg text-gray-600 mb-4">{news.short_description}</p>
              </div>

              {canManageNews && (
                <div className="flex gap-2 ml-4">
                  <Link
                    to={`/news/edit/${news.slug}`}
                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <FaEdit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleDeleteClick}
                    disabled={deleting}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Удалить"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Мета информация */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-400" />
                {formatDate(news.published_at)}
              </div>

              <div className="flex items-center">
                <FaEye className="w-4 h-4 mr-2 text-gray-400" />
                {news.views_count} просмотров
              </div>

              {news.author_name && (
                <div className="flex items-center">
                  <FaUser className="w-4 h-4 mr-2 text-gray-400" />
                  {news.author_name}
                </div>
              )}
            </div>
          </div>

          {/* Основной контент */}
          <div className="p-6">
            <style>{`
              /* Базовые стили для контента */
              .news-content {
                color: #374151;
                font-size: 1.125rem;
                line-height: 1.4;
              }

              .news-content p {
                margin-bottom: 0;
                line-height: 1.2;
              }

              .news-content h1,
              .news-content h2,
              .news-content h3,
              .news-content h4,
              .news-content h5,
              .news-content h6 {
                color: #111827;
                font-weight: 600;
                line-height: 1.3;
                margin-top: 1.5em;
                margin-bottom: 0.75em;
              }

              .news-content h1 { font-size: 2em; }
              .news-content h2 { font-size: 1.75em; }
              .news-content h3 { font-size: 1.5em; }
              .news-content h4 { font-size: 1.25em; }

              .news-content strong {
                color: #111827;
                font-weight: 600;
              }

              .news-content ul,
              .news-content ol {
                margin-left: 1.5rem;
                margin-bottom: 1em;
                line-height: 1.2;
              }

              .news-content ul {
                list-style-type: disc;
              }

              .news-content ol {
                list-style-type: decimal;
              }

              .news-content li {
                margin-bottom: 0.25em;
                line-height: 1.2;
              }

              .news-content a {
                color: #059669;
                text-decoration: none;
              }

              .news-content a:hover {
                color: #047857;
                text-decoration: underline;
              }

              .news-content img {
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                max-width: 100%;
                height: auto;
              }

              .news-content iframe {
                max-width: 100%;
              }

              /* Поддержка классов Quill для выравнивания текста */
              .news-content .ql-align-center:not(iframe):not(img):not(video) {
                text-align: center;
              }
              .news-content .ql-align-right:not(iframe):not(img):not(video) {
                text-align: right;
              }
              .news-content .ql-align-left:not(iframe):not(img):not(video) {
                text-align: left;
              }
              .news-content .ql-align-justify {
                text-align: justify;
              }

              /* Центрирование iframe (видео) */
              .news-content iframe.ql-align-center {
                display: block;
                margin-left: auto;
                margin-right: auto;
              }

              .news-content iframe.ql-align-right {
                display: block;
                margin-left: auto;
                margin-right: 0;
              }

              .news-content iframe.ql-align-left {
                display: block;
                margin-left: 0;
                margin-right: auto;
              }

              /* Центрирование изображений */
              .news-content img.ql-align-center {
                display: block;
                margin-left: auto;
                margin-right: auto;
              }

              /* Clearfix для блока контента */
              .news-content::after {
                content: "";
                display: table;
                clear: both;
              }
            `}</style>
            <div
              className="news-content"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </div>

          {/* Медиа файлы */}
          {news.media && news.media.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Дополнительные материалы</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {news.media.map((media) => (
                  <div key={media.id} className="rounded-lg overflow-hidden">
                    {media.media_type === 'image' && media.file && (
                      <img
                        src={media.file}
                        alt={media.caption || news.title}
                        className="w-full h-auto"
                      />
                    )}
                    {media.media_type === 'video' && media.video_url && (
                      <div className="aspect-video">
                        <iframe
                          src={media.video_url}
                          className="w-full h-full"
                          allowFullScreen
                          title={media.caption || 'Видео'}
                        ></iframe>
                      </div>
                    )}
                    {media.caption && (
                      <p className="text-sm text-gray-600 mt-2">{media.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модалка подтверждения удаления */}
      {showDeleteModal && news && (
        <DeleteConfirmModal
          title={news.title}
          itemType="новость"
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default NewsDetailPage;
