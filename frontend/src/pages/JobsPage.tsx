import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaClock, FaCalendarAlt, FaPlus, FaArrowLeft } from 'react-icons/fa';
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
    <>
      <Helmet>
        <title>Вакансии - Faida Group</title>
        <meta name="description" content="Актуальные вакансии в компании Faida Group" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Шапка */}
        <div className="bg-primary-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/" className="inline-flex items-center gap-2 text-secondary-500 hover:text-secondary-400 mb-6 transition-colors">
              <FaArrowLeft className="w-4 h-4" />
              На главную
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Вакансии</h1>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">
                  {jobs.length > 0
                    ? `Доступно вакансий: ${jobs.length}`
                    : 'Присоединяйтесь к команде Faida Group'}
                </p>
              </div>
              {canManageJobs && (
                <Link
                  to="/jobs/new"
                  className="flex items-center justify-center px-4 py-2 bg-secondary-500 text-primary-900 rounded-lg hover:bg-secondary-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg w-full sm:w-auto"
                >
                  <FaPlus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Добавить вакансию</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-secondary-500">
            <div className="text-center">
              <FaBriefcase className="w-24 h-24 text-primary-200 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-primary-900 mb-4">
                Хотите работать в Faida Group?
              </h2>
              <p className="text-gray-600 mb-6 font-light">
                Мы всегда рады талантливым и ответственным сотрудникам! Отправьте ваше резюме, и
                мы свяжемся с вами при появлении подходящих вакансий.
              </p>
              <div className="space-y-2">
                <p className="text-gray-700 font-light">
                  <strong className="font-semibold">Телефон:</strong>{' '}
                  <a href="tel:+79991234567" className="text-secondary-600 hover:text-secondary-700 font-semibold">
                    +7 (999) 123-45-67
                  </a>
                </p>
                <p className="text-gray-700 font-light">
                  <strong className="font-semibold">Email:</strong>{' '}
                  <a href="mailto:hr@faida.ru" className="text-secondary-600 hover:text-secondary-700 font-semibold">
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
                className="block bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden group border-t-4 border-secondary-500 transform hover:scale-[1.02]"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Превью изображения */}
                  <div className="w-full h-40 sm:w-48 sm:h-48 flex-shrink-0 bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center overflow-hidden">
                    {job.preview_image ? (
                      <img
                        src={job.preview_image}
                        alt={job.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <FaBriefcase className="w-12 h-12 sm:w-16 sm:h-16 text-secondary-500" />
                    )}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-primary-900 group-hover:text-secondary-600 transition-colors">
                        {job.title}
                      </h2>
                      <div className="flex gap-2 flex-shrink-0">
                        {job.is_closed && (
                          <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-100 text-red-700 rounded-full font-semibold">
                            Закрыта
                          </span>
                        )}
                        {!job.is_active && (
                          <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-full font-semibold">
                            Неактивна
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2 font-light text-sm sm:text-base">{job.short_description}</p>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 font-light">
                      <div className="flex items-center">
                        <FaClock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary-600 flex-shrink-0" />
                        <span className="truncate">{job.employment_type_display}</span>
                      </div>

                      <div className="flex items-center">
                        <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary-600 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>

                      <div className="flex items-center">
                        <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary-600 flex-shrink-0" />
                        <span className="truncate">{job.work_schedule}</span>
                      </div>

                      <div className="flex items-center">
                        <FaMoneyBillWave className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary-600 flex-shrink-0" />
                        <span className="truncate">{formatSalary(job)}</span>
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
    </>
  );
};

export default JobsPage;
