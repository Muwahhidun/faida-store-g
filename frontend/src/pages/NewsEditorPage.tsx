import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import RichTextEditor from '../components/RichTextEditor';
import { NewsDetail, NewsFormData, NewsCategory } from '../types';
import api from '../api/client';

const NewsEditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEditMode = slug && slug !== 'new';

  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    category: null,
    short_description: '',
    content: '',
    content_delta: undefined,
    is_published: true,
    published_at: null,
  });

  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [editorKey, setEditorKey] = useState<string>('new');

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchNews();
    }
  }, [slug]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/news-categories/');
      setCategories(response.data.results || response.data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await api.get<NewsDetail>(`/news/${slug}/`);
      const newsItem = response.data;

      setFormData({
        title: newsItem.title,
        category: newsItem.category || null,
        short_description: newsItem.short_description,
        content: newsItem.content,
        content_delta: newsItem.content_delta,
        is_published: newsItem.is_published,
        published_at: newsItem.published_at || null,
      });

      if (newsItem.preview_image) {
        setPreviewImageUrl(newsItem.preview_image);
      }

      setEditorKey(slug || 'new');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки новости');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImageFile(file);
      setShouldRemoveImage(false);
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
    setShouldRemoveImage(true);
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

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('short_description', formData.short_description);
      submitData.append('content', formData.content);

      if (formData.content_delta) {
        const deltaToSave = formData.content_delta.ops
          ? { ops: formData.content_delta.ops }
          : formData.content_delta;
        submitData.append('content_delta', JSON.stringify(deltaToSave));
      }

      if (formData.category) {
        submitData.append('category', String(formData.category));
      }

      submitData.append('is_published', String(formData.is_published));

      if (formData.published_at) {
        submitData.append('published_at', formData.published_at);
      }

      if (previewImageFile) {
        submitData.append('preview_image', previewImageFile);
      } else if (shouldRemoveImage && isEditMode) {
        submitData.append('preview_image', '');
      }

      if (isEditMode) {
        const response = await api.patch(`/news/${slug}/`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        navigate(`/news/${slug}`);
      } else {
        const response = await api.post('/news/', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        navigate(`/news/${response.data.slug}`);
      }
    } catch (err: any) {
      console.error('Full error object:', err);
      console.error('Error message:', err.message);
      console.error('Original Axios error:', err.originalError);
      console.error('Error response:', err.originalError?.response);
      console.error('Error response data:', JSON.stringify(err.originalError?.response?.data, null, 2));
      console.error('Error response status:', err.originalError?.response?.status);

      const errorMessage =
        err.originalError?.response?.data?.message ||
        JSON.stringify(err.originalError?.response?.data) ||
        err.message ||
        'Ошибка сохранения новости';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/news');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
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
        <title>{isEditMode ? 'Редактирование новости' : 'Создание новости'} - Faida Group</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEditMode ? 'Редактирование новости' : 'Создание новости'}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Заголовок */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Введите заголовок новости"
              required
            />
          </div>

          {/* Категория */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Категория
            </label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Без категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Краткое описание */}
          <div>
            <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-2">
              Краткое описание <span className="text-red-500">*</span>
            </label>
            <textarea
              id="short_description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Краткое описание для списка новостей (макс. 500 символов)"
              maxLength={500}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.short_description.length}/500 символов
            </p>
          </div>

          {/* Превью изображение */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Превью изображение
            </label>

            {previewImageUrl ? (
              <div className="relative inline-block">
                <img
                  src={previewImageUrl}
                  alt="Preview"
                  className="w-64 h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-64 h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 transition-colors">
                <label
                  htmlFor="preview_image"
                  className="cursor-pointer text-center p-4"
                >
                  <div className="text-gray-500 mb-2">
                    Нажмите для загрузки изображения
                  </div>
                  <input
                    type="file"
                    id="preview_image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Полное содержание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Полное содержание <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              key={editorKey}
              value={formData.content}
              delta={formData.content_delta}
              onChange={(html, delta) =>
                setFormData({
                  ...formData,
                  content: html,
                  content_delta: delta,
                })
              }
              placeholder="Полное содержание новости..."
            />
          </div>

          {/* Статус публикации */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
              Опубликовать новость
            </label>
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="w-5 h-5 mr-2" />
              {saving ? 'Сохранение...' : isEditMode ? 'Сохранить' : 'Создать'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <FaTimes className="w-5 h-5 mr-2" />
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsEditorPage;
