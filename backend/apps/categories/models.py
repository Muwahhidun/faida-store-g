"""
Модели для управления категориями товаров.
"""

from django.db import models


class Category(models.Model):
    """Модель категории товаров."""
    
    name = models.CharField(
        max_length=255,
        verbose_name="Название категории",
        help_text="Название из 1С (автоматически обновляется при синхронизации)"
    )
    display_name = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Название для показа",
        help_text="Альтернативное название для отображения на сайте. Если не заполнено, используется название из 1С"
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        verbose_name="URL слаг"
    )
    
    # Новое поле: код категории из 1С
    code_category = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Уникальный код категории",
        help_text="Уникальный код категории (например, из 1С) для синхронизации"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="Описание категории"
    )
    
    # Иерархия категорий
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name="Родительская категория"
    )
    
    # Порядок сортировки
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Порядок сортировки"
    )
    
    # Изображение категории
    image = models.ImageField(
        upload_to='categories/',
        blank=True,
        null=True,
        verbose_name="Изображение категории"
    )
    
    # SEO поля
    seo_title = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="SEO заголовок"
    )
    seo_description = models.TextField(
        blank=True,
        verbose_name="SEO описание"
    )
    
    # Служебные поля
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активна"
    )
    is_visible_on_site = models.BooleanField(
        default=True,
        verbose_name="Показывать на сайте",
        help_text="Если флаг снят, категория и все её товары не будут показаны на публичной части сайта"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )
    
    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['parent', 'is_active']),
            models.Index(fields=['slug']),
            models.Index(fields=['code_category']),  # Новый индекс для кода 1С
        ]
    
    def __str__(self):
        return self.name

    @property
    def category_visible_name(self):
        """
        Возвращает название для отображения на сайте.
        Если display_name заполнено - возвращает его, иначе - name из 1С.
        """
        return self.display_name if self.display_name else self.name

    def get_ancestors(self):
        """Получить список всех родительских категорий."""
        ancestors = []
        parent = self.parent
        while parent is not None:
            ancestors.append(parent)
            parent = parent.parent
        return ancestors
    
    def get_descendants(self, include_self=True):
        """Получить все дочерние категории (рекурсивно)."""
        descendants = []
        
        if include_self:
            descendants.append(self.id)
        
        for child in self.children.filter(is_active=True, is_visible_on_site=True):
            descendants.extend(child.get_descendants(include_self=True))
        
        return descendants
    
    @property
    def products_count(self):
        """Количество товаров в категории (включая подкатегории)."""
        # Прямые товары категории
        count = self.products.filter(is_visible_on_site=True).count()
        
        # Добавляем товары из всех подкатегорий
        for child in self.children.filter(is_active=True):
            count += child.products_count
        
        return count
    
    def has_visible_content(self):
        """
        Проверяет, есть ли в этой категории или ее подкатегориях видимые товары.
        """
        # Проверяем наличие видимых товаров непосредственно в этой категории
        if self.products.filter(is_visible_on_site=True).exists():
            return True

        # Рекурсивно проверяем наличие видимого контента в дочерних категориях
        # Важно проверять всех детей, а не только видимых, т.к. их статус может измениться
        for child in self.children.all():
            if child.has_visible_content():
                return True
        
        return False

    def update_visibility(self):
        """
        Обновляет видимость для этой категории и рекурсивно для всех ее родителей.
        """
        should_be_visible = self.has_visible_content()
        
        if self.is_visible_on_site != should_be_visible:
            self.is_visible_on_site = should_be_visible
            self.save(update_fields=['is_visible_on_site'])

        # Всегда проверяем родителя, чтобы обеспечить каскадное обновление
        if self.parent:
            self.parent.update_visibility()

    def get_absolute_url(self):
        """Получить URL категории."""
        return f'/category/{self.slug}/'