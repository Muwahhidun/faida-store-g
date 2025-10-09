from django.db import models
from django.utils.text import slugify
from django.conf import settings
import uuid


class NewsCategory(models.Model):
    """Категория новости."""

    name = models.CharField('Название', max_length=100, unique=True)
    slug = models.SlugField('URL слаг', max_length=100, unique=True, blank=True)
    display_order = models.IntegerField('Порядок отображения', default=0)

    class Meta:
        verbose_name = 'Категория новости'
        verbose_name_plural = 'Категории новостей'
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class News(models.Model):
    """Модель новости."""

    title = models.CharField('Заголовок', max_length=255)
    slug = models.SlugField('URL слаг', max_length=255, unique=True, blank=True)
    category = models.ForeignKey(
        NewsCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='news',
        verbose_name='Категория'
    )
    preview_image = models.ImageField(
        'Превью изображение',
        upload_to='news/previews/',
        null=True,
        blank=True,
        help_text='Изображение для списка новостей'
    )
    short_description = models.TextField(
        'Краткое описание',
        max_length=500,
        help_text='Краткое описание для списка новостей'
    )
    content = models.TextField(
        'Полное содержание',
        help_text='HTML контент новости'
    )
    content_delta = models.JSONField(
        'Quill Delta формат',
        null=True,
        blank=True,
        help_text='Quill Delta для сохранения форматирования'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='news',
        verbose_name='Автор'
    )
    is_published = models.BooleanField(
        'Опубликовано',
        default=True,
        help_text='Опубликована ли новость на сайте'
    )
    published_at = models.DateTimeField(
        'Дата публикации',
        null=True,
        blank=True,
        help_text='Дата и время публикации новости'
    )
    views_count = models.PositiveIntegerField(
        'Количество просмотров',
        default=0,
        help_text='Счетчик просмотров новости'
    )
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Новость'
        verbose_name_plural = 'Новости'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['-published_at']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_published']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            # Генерируем slug из заголовка
            base_slug = slugify(self.title)
            if not base_slug:
                base_slug = f'news-{uuid.uuid4().hex[:8]}'

            slug = base_slug
            counter = 1
            while News.objects.filter(slug=slug).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug

        # Автоматически устанавливаем дату публикации при первой публикации
        if self.is_published and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    def get_preview_image_url(self):
        """Получить URL превью изображения."""
        if self.preview_image:
            return self.preview_image.url
        return None


class NewsMedia(models.Model):
    """Дополнительные медиа-файлы для новости."""

    MEDIA_TYPE_CHOICES = [
        ('image', 'Изображение'),
        ('video', 'Видео'),
    ]

    news = models.ForeignKey(
        News,
        on_delete=models.CASCADE,
        related_name='media',
        verbose_name='Новость'
    )
    media_type = models.CharField(
        'Тип медиа',
        max_length=10,
        choices=MEDIA_TYPE_CHOICES,
        default='image'
    )
    file = models.FileField(
        'Файл',
        upload_to='news/media/',
        null=True,
        blank=True,
        help_text='Файл изображения или видео'
    )
    video_url = models.URLField(
        'URL видео',
        max_length=500,
        null=True,
        blank=True,
        help_text='Ссылка на видео (YouTube, Vimeo и т.д.)'
    )
    caption = models.CharField(
        'Подпись',
        max_length=255,
        blank=True,
        help_text='Описание медиа-файла'
    )
    display_order = models.PositiveIntegerField('Порядок отображения', default=0)
    created_at = models.DateTimeField('Дата добавления', auto_now_add=True)

    class Meta:
        verbose_name = 'Медиа-файл новости'
        verbose_name_plural = 'Медиа-файлы новостей'
        ordering = ['display_order', 'created_at']

    def __str__(self):
        return f'{self.get_media_type_display()} для {self.news.title}'
