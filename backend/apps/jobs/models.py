"""
Модели для управления вакансиями.
"""

from django.db import models
from django.utils.text import slugify
from django.conf import settings


class Job(models.Model):
    """Модель вакансии."""

    EMPLOYMENT_TYPES = [
        ('full_time', 'Полная занятость'),
        ('part_time', 'Частичная занятость'),
        ('remote', 'Удаленная работа'),
        ('internship', 'Стажировка'),
    ]

    title = models.CharField('Название должности', max_length=255)
    slug = models.SlugField('URL slug', max_length=255, unique=True, blank=True)
    short_description = models.TextField('Краткое описание', max_length=500)
    content = models.TextField('Полное описание (HTML)')
    content_delta = models.JSONField('Quill Delta формат', null=True, blank=True, help_text='Quill Delta для сохранения форматирования')
    preview_image = models.ImageField(
        'Превью изображение для ленты',
        upload_to='jobs/previews/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text='Изображение для отображения в списке вакансий'
    )

    # Дополнительные поля
    employment_type = models.CharField(
        'Тип занятости',
        max_length=20,
        choices=EMPLOYMENT_TYPES,
        default='full_time'
    )
    location = models.CharField('Город', max_length=100, default='Махачкала')
    work_schedule = models.CharField('График работы', max_length=255, default='5/2 сб, вс выходной')
    salary_from = models.IntegerField(
        'Зарплата от',
        null=True,
        blank=True
    )
    salary_to = models.IntegerField(
        'Зарплата до',
        null=True,
        blank=True
    )

    # Контакты для откликов
    hr_email = models.TextField(
        'Email для откликов',
        default='hr@faida.ru',
        help_text='Можно указать несколько email через запятую или с новой строки'
    )
    hr_phone = models.TextField(
        'Телефон для откликов',
        default='+7 (999) 123-45-67',
        help_text='Можно указать несколько телефонов через запятую или с новой строки'
    )

    # Статус и мета
    is_active = models.BooleanField('Активна на сайте', default=True)
    is_closed = models.BooleanField('Закрыта для откликов', default=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='jobs',
        verbose_name='Автор'
    )

    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Вакансия'
        verbose_name_plural = 'Вакансии'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def get_preview_image_url(self):
        """Получить URL превью изображения."""
        if self.preview_image:
            return self.preview_image.url
        return None

    def save(self, *args, **kwargs):
        """Автоматически генерирует slug из названия."""
        if not self.slug:
            # Транслитерация кириллицы для slug
            base_slug = slugify(self.title, allow_unicode=False)
            if not base_slug:  # Если название полностью на кириллице
                import uuid
                base_slug = f"job-{uuid.uuid4().hex[:8]}"

            slug = base_slug
            counter = 1
            while Job.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class JobMedia(models.Model):
    """Модель для медиа-файлов вакансии (изображения, видео)."""

    MEDIA_TYPES = [
        ('image', 'Изображение'),
        ('video', 'Видео'),
    ]

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='media',
        verbose_name='Вакансия'
    )
    media_type = models.CharField(
        'Тип медиа',
        max_length=10,
        choices=MEDIA_TYPES,
        default='image'
    )
    file = models.FileField(
        'Файл',
        upload_to='jobs/%Y/%m/%d/',
        null=True,
        blank=True
    )
    video_url = models.URLField(
        'URL видео (YouTube/Vimeo)',
        max_length=500,
        null=True,
        blank=True
    )
    caption = models.CharField('Подпись', max_length=255, blank=True)
    display_order = models.IntegerField('Порядок отображения', default=0)

    created_at = models.DateTimeField('Дата добавления', auto_now_add=True)

    class Meta:
        verbose_name = 'Медиа файл вакансии'
        verbose_name_plural = 'Медиа файлы вакансий'
        ordering = ['display_order', 'created_at']

    def __str__(self):
        return f"{self.job.title} - {self.get_media_type_display()}"
