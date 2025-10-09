import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import RichTextEditor from '../components/RichTextEditor';
import { JobDetail, JobFormData } from '../types';
import api from '../api/client';

const JobEditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEditMode = slug && slug !== 'new';

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    short_description: '',
    content: '',
    content_delta: undefined,
    employment_type: 'full_time',
    location: 'Махачкала',
    work_schedule: '5/2 сб, вс выходной',
    salary_from: undefined,
    salary_to: undefined,
    hr_email: 'hr@faida.ru',
    hr_phone: '+7 (999) 123-45-67',
    is_active: true,
    is_closed: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [editorKey, setEditorKey] = useState<string>('new'); // Ключ для пересоздания редактора

  useEffect(() => {
    if (isEditMode) {
      fetchJob();
    }
  }, [slug]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await api.get<JobDetail>(`/jobs/${slug}/`);
      const job = response.data;

      setFormData({
        title: job.title,
        short_description: job.short_description,
        content: job.content,
        content_delta: job.content_delta,
        employment_type: job.employment_type,
        location: job.location,
        work_schedule: job.work_schedule,
        salary_from: job.salary_from,
        salary_to: job.salary_to,
        hr_email: job.hr_email,
        hr_phone: job.hr_phone,
        is_active: job.is_active,
        is_closed: job.is_closed,
      });
      if (job.preview_image) {
        setPreviewImageUrl(job.preview_image);
      }
      // Обновляем ключ редактора, чтобы он пересоздался с новыми данными
      setEditorKey(slug || 'new');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки вакансии');
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImageFile(file);
      setShouldRemoveImage(false);  // Отменяем флаг удаления, если загружается новое изображение
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImageFile(null);
    setPreviewImageUrl(null);
    setShouldRemoveImage(true);  // Помечаем, что изображение нужно удалить
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.short_description || !formData.content) {
      setError('Заполните все обязательные поля');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Создаем FormData для отправки файла
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('short_description', formData.short_description);
      submitData.append('content', formData.content);
      if (formData.content_delta) {
        // Если это объект Delta от Quill, извлекаем ops
        const deltaToSave = formData.content_delta.ops ?
          { ops: formData.content_delta.ops } :
          formData.content_delta;

        submitData.append('content_delta', JSON.stringify(deltaToSave));
      }
      submitData.append('employment_type', formData.employment_type);
      submitData.append('location', formData.location);
      submitData.append('work_schedule', formData.work_schedule);
      submitData.append('hr_email', formData.hr_email);
      submitData.append('hr_phone', formData.hr_phone);
      submitData.append('is_active', String(formData.is_active));
      submitData.append('is_closed', String(formData.is_closed));

      if (formData.salary_from !== undefined && formData.salary_from !== null && formData.salary_from !== '') {
        submitData.append('salary_from', String(formData.salary_from));
      }
      if (formData.salary_to !== undefined && formData.salary_to !== null && formData.salary_to !== '') {
        submitData.append('salary_to', String(formData.salary_to));
      }

      // Обработка превью изображения
      if (previewImageFile) {
        // Загружено новое изображение
        submitData.append('preview_image', previewImageFile);
      } else if (shouldRemoveImage && isEditMode) {
        // Нужно удалить существующее изображение
        submitData.append('preview_image', '');  // Пустая строка для удаления
      }
      // Если изображение не изменялось (нет нового файла и не помечено на удаление),
      // то не добавляем поле preview_image в FormData вообще - Django сохранит существующее

      if (isEditMode) {
        // Обновление существующей вакансии (используем PATCH для частичного обновления)
        const response = await api.patch(`/jobs/${slug}/`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // После сохранения остаемся на странице вакансии
        navigate(`/jobs/${slug}`);
      } else {
        // Создание новой вакансии
        const response = await api.post('/jobs/', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // После создания переходим к новой вакансии
        navigate(`/jobs/${response.data.slug}`);
      }
    } catch (err: any) {
      console.error('Full error object:', err);
      console.error('Error message:', err.message);
      console.error('Original Axios error:', err.originalError);
      console.error('Error response:', err.originalError?.response);
      console.error('Error response data:', JSON.stringify(err.originalError?.response?.data, null, 2));
      console.error('Error response status:', err.originalError?.response?.status);

      const errorMessage = err.originalError?.response?.data?.message ||
                          JSON.stringify(err.originalError?.response?.data) ||
                          err.message ||
                          'Ошибка сохранения вакансии';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/jobs');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>{isEditMode ? 'Редактировать вакансию' : 'Новая вакансия'} - Faida Group</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Редактировать вакансию' : 'Новая вакансия'}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Название должности */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название должности <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Например: Менеджер по продажам"
              required
            />
          </div>

          {/* Краткое описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Краткое описание <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Краткое описание вакансии для карточки (до 500 символов)"
              maxLength={500}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.short_description.length} / 500 символов
            </p>
          </div>

          {/* Превью изображение для ленты */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Превью изображение для ленты
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Это изображение будет отображаться в списке вакансий. Независимо от изображений в описании.
            </p>

            {previewImageUrl ? (
              <div className="relative inline-block">
                <img
                  src={previewImageUrl}
                  alt="Превью"
                  className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-10 h-10 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Нажмите для загрузки</span> или перетащите изображение
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG (макс. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Полное описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Полное описание <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              key={editorKey}
              value={formData.content}
              delta={formData.content_delta}
              onChange={(html, delta) => setFormData({ ...formData, content: html, content_delta: delta })}
              placeholder="Подробное описание вакансии, требования, условия работы..."
            />
          </div>

          {/* Тип занятости и локация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип занятости
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employment_type: e.target.value as JobFormData['employment_type'],
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="full_time">Полная занятость</option>
                <option value="part_time">Частичная занятость</option>
                <option value="remote">Удаленная работа</option>
                <option value="internship">Стажировка</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Махачкала"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">График работы</label>
              <input
                type="text"
                value={formData.work_schedule}
                onChange={(e) => setFormData({ ...formData, work_schedule: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="5/2 сб, вс выходной"
              />
            </div>
          </div>

          {/* Зарплата */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Зарплата от (₽)
              </label>
              <input
                type="number"
                value={formData.salary_from || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salary_from: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="30000"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Зарплата до (₽)
              </label>
              <input
                type="number"
                value={formData.salary_to || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salary_to: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="50000"
                min="0"
              />
            </div>
          </div>

          {/* Контакты для откликов */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email для откликов
              </label>
              <textarea
                value={formData.hr_email}
                onChange={(e) => setFormData({ ...formData, hr_email: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="hr@faida.ru&#10;jobs@faida.ru"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Можно указать несколько email через запятую или с новой строки
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон для откликов
              </label>
              <textarea
                value={formData.hr_phone}
                onChange={(e) => setFormData({ ...formData, hr_phone: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="+7 (999) 123-45-67&#10;+7 (999) 765-43-21"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Можно указать несколько телефонов через запятую или с новой строки
              </p>
            </div>
          </div>

          {/* Активность */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Вакансия активна (отображается на сайте)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_closed"
              checked={formData.is_closed}
              onChange={(e) => setFormData({ ...formData, is_closed: e.target.checked })}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="is_closed" className="ml-2 text-sm text-gray-700">
              Вакансия закрыта (не принимаются отклики)
            </label>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="w-4 h-4 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaTimes className="w-4 h-4 mr-2" />
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobEditorPage;
