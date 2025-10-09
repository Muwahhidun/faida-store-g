import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaClock,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaArrowLeft,
} from 'react-icons/fa';
import { JobDetail } from '../types';
import api from '../api/client';
import DeleteJobModal from '../components/DeleteJobModal';

const JobDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchJob();
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

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${slug}/`);
      setJob(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки вакансии');
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!job) return;

    try {
      setDeleting(true);
      await api.delete(`/jobs/${slug}/`);
      navigate('/jobs');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка удаления вакансии');
      console.error('Error deleting job:', err);
      setDeleting(false);
    }
  };

  const formatSalary = () => {
    if (!job) return '';
    if (job.salary_from && job.salary_to) {
      return `${job.salary_from.toLocaleString()} - ${job.salary_to.toLocaleString()} ₽`;
    } else if (job.salary_from) {
      return `от ${job.salary_from.toLocaleString()} ₽`;
    } else if (job.salary_to) {
      return `до ${job.salary_to.toLocaleString()} ₽`;
    }
    return 'По договоренности';
  };

  const canManageJobs = userRole === 'admin' || userRole === 'moderator';

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

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-red-600 text-lg">{error || 'Вакансия не найдена'}</div>
          <Link to="/jobs" className="text-emerald-600 hover:text-emerald-700 mt-4 inline-block">
            ← Вернуться к списку вакансий
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>{job.title} - Вакансии Faida Group</title>
        <meta name="description" content={job.short_description} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Навигация */}
        <div className="mb-6">
          <Link
            to="/jobs"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Все вакансии
          </Link>
        </div>

        {/* Карточка вакансии */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Заголовок */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <p className="text-lg text-gray-600 mb-3">{job.short_description}</p>
                <div className="flex gap-2">
                  {job.is_closed && (
                    <span className="inline-block px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full">
                      Вакансия закрыта
                    </span>
                  )}
                  {!job.is_active && (
                    <span className="inline-block px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full">
                      Неактивная вакансия
                    </span>
                  )}
                </div>
              </div>

              {canManageJobs && (
                <div className="flex gap-2 ml-4">
                  <Link
                    to={`/jobs/edit/${job.slug}`}
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
            <div className="flex flex-wrap gap-4 text-gray-600">
              <div className="flex items-center">
                <FaClock className="w-4 h-4 mr-2 text-gray-400" />
                {job.employment_type_display}
              </div>

              <div className="flex items-center">
                <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-400" />
                {job.location}
              </div>

              <div className="flex items-center">
                <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-400" />
                {job.work_schedule}
              </div>

              <div className="flex items-center">
                <FaMoneyBillWave className="w-4 h-4 mr-2 text-gray-400" />
                {formatSalary()}
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="p-6">
            <style>{`
              /* Базовые стили для контента */
              .job-content {
                color: #374151;
                font-size: 1.125rem;
                line-height: 1.4;
              }

              .job-content p {
                margin-bottom: 0;
                line-height: 1.2;
              }

              .job-content h1,
              .job-content h2,
              .job-content h3,
              .job-content h4,
              .job-content h5,
              .job-content h6 {
                color: #111827;
                font-weight: 600;
                line-height: 1.3;
                margin-top: 1.5em;
                margin-bottom: 0.75em;
              }

              .job-content h1 { font-size: 2em; }
              .job-content h2 { font-size: 1.75em; }
              .job-content h3 { font-size: 1.5em; }
              .job-content h4 { font-size: 1.25em; }

              .job-content strong {
                color: #111827;
                font-weight: 600;
              }

              .job-content ul,
              .job-content ol {
                margin-left: 1.5rem;
                margin-bottom: 1em;
                line-height: 1.2;
              }

              .job-content ul {
                list-style-type: disc;
              }

              .job-content ol {
                list-style-type: decimal;
              }

              .job-content li {
                margin-bottom: 0.25em;
                line-height: 1.2;
              }

              .job-content a {
                color: #059669;
                text-decoration: none;
              }

              .job-content a:hover {
                color: #047857;
                text-decoration: underline;
              }

              .job-content img {
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                max-width: 100%;
                height: auto;
              }

              .job-content iframe {
                max-width: 100%;
              }

              /* Поддержка классов Quill для выравнивания текста */
              .job-content .ql-align-center:not(iframe):not(img):not(video) {
                text-align: center;
              }
              .job-content .ql-align-right:not(iframe):not(img):not(video) {
                text-align: right;
              }
              .job-content .ql-align-left:not(iframe):not(img):not(video) {
                text-align: left;
              }
              .job-content .ql-align-justify {
                text-align: justify;
              }

              /* Центрирование iframe (видео) */
              .job-content iframe.ql-align-center {
                display: block;
                margin-left: auto;
                margin-right: auto;
              }

              .job-content iframe.ql-align-right {
                display: block;
                margin-left: auto;
                margin-right: 0;
              }

              .job-content iframe.ql-align-left {
                display: block;
                margin-left: 0;
                margin-right: auto;
              }

              /* Центрирование изображений */
              .job-content img.ql-align-center {
                display: block;
                margin-left: auto;
                margin-right: auto;
              }

              /* Clearfix для блока контента чтобы он не наезжал на другие элементы */
              .job-content::after {
                content: "";
                display: table;
                clear: both;
              }
            `}</style>
            <div
              className="job-content"
              dangerouslySetInnerHTML={{ __html: job.content }}
            />
          </div>

          {/* Медиа файлы */}
          {job.media && job.media.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Дополнительные материалы</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.media.map((media) => (
                  <div key={media.id} className="rounded-lg overflow-hidden">
                    {media.media_type === 'image' && media.file && (
                      <img
                        src={media.file}
                        alt={media.caption || job.title}
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

          {/* Контакты для откликов */}
          <div className="p-6 bg-emerald-50 border-t border-emerald-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Контакты</h2>
            <div className="space-y-2">
              <p className="text-gray-800">
                <strong>Email:</strong>{' '}
                <a href={`mailto:${job.hr_email}`} className="text-emerald-600 hover:text-emerald-700">
                  {job.hr_email}
                </a>
              </p>
              <p className="text-gray-800">
                <strong>Телефон:</strong>{' '}
                <a href={`tel:${job.hr_phone.replace(/[^+\d]/g, '')}`} className="text-emerald-600 hover:text-emerald-700">
                  {job.hr_phone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка подтверждения удаления */}
      {showDeleteModal && job && (
        <DeleteJobModal
          jobTitle={job.title}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default JobDetailPage;
