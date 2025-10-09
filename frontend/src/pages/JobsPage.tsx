import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaClock, FaCalendarAlt, FaPlus } from 'react-icons/fa';
import { JobListItem } from '../types';
import api from '../api/client';

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
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

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jobs/');
      // API возвращает paginated response с полем results
      setJobs(response.data.results || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки вакансий');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (job: JobListItem) => {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Вакансии - Faida Group</title>
        <meta name="description" content="Актуальные вакансии в компании Faida Group" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Вакансии</h1>
            <p className="text-gray-600">
              {jobs.length > 0
                ? `Доступно вакансий: ${jobs.length}`
                : 'В данный момент открытых вакансий нет'}
            </p>
          </div>

          {canManageJobs && (
            <Link
              to="/jobs/new"
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Добавить вакансию
            </Link>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <FaBriefcase className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Хотите работать в Faida Group?
              </h2>
              <p className="text-gray-600 mb-6">
                Мы всегда рады талантливым и ответственным сотрудникам! Отправьте ваше резюме, и
                мы свяжемся с вами при появлении подходящих вакансий.
              </p>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>Телефон:</strong>{' '}
                  <a href="tel:+79991234567" className="text-emerald-600 hover:text-emerald-700">
                    +7 (999) 123-45-67
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:hr@faida.ru" className="text-emerald-600 hover:text-emerald-700">
                    hr@faida.ru
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.slug}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex">
                  {/* Превью изображения слева */}
                  <div className="w-48 h-48 flex-shrink-0 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center overflow-hidden">
                    {job.preview_image ? (
                      <img
                        src={job.preview_image}
                        alt={job.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaBriefcase className="w-16 h-16 text-emerald-300" />
                    )}
                  </div>

                  {/* Контент справа */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-2xl font-semibold text-gray-900 hover:text-emerald-600">
                        {job.title}
                      </h2>
                      <div className="flex gap-2">
                        {job.is_closed && (
                          <span className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full">
                            Закрыта
                          </span>
                        )}
                        {!job.is_active && (
                          <span className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full">
                            Неактивна
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">{job.short_description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
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
                        {formatSalary(job)}
                      </div>
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

export default JobsPage;
