"""
Фильтры для API.
"""

import django_filters
from django.db import models
from apps.products.models import Product
from apps.categories.models import Category


class ProductFilter(django_filters.FilterSet):
    """Фильтр для товаров."""
    
    # Фильтр по цене
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    price_range = django_filters.RangeFilter(field_name='price')
    
    # Фильтр по категориям (включая подкатегории)
    category = django_filters.ModelChoiceFilter(
        queryset=Category.objects.filter(is_active=True),
        method='filter_by_category'
    )
    category_slug = django_filters.CharFilter(
        field_name='category__slug', 
        lookup_expr='exact'
    )
    
    # Фильтр по наличию
    in_stock = django_filters.BooleanFilter()
    available = django_filters.BooleanFilter(method='filter_available')
    
    # Фильтр по бренду
    brand = django_filters.CharFilter(lookup_expr='icontains')
    brands = django_filters.ModelMultipleChoiceFilter(
        field_name='brand',
        to_field_name='brand',
        queryset=Product.objects.values_list('brand', flat=True).distinct()
    )
    
    # Фильтр по тегам
    tags = django_filters.CharFilter(method='filter_by_tags')
    
    # Фильтр по списку ID (для избранных товаров)
    ids = django_filters.CharFilter(method='filter_by_ids')
    
    # Поиск по названию и описанию
    search = django_filters.CharFilter(method='filter_search')
    
    # Сортировка
    ordering = django_filters.OrderingFilter(
        fields=(
            ('price', 'price'),
            ('name', 'name'), 
            ('created_at', 'created'),
            ('updated_at', 'updated'),
        ),
        field_labels={
            'price': 'Цена',
            'name': 'Название',
            'created': 'Дата создания',
            'updated': 'Дата обновления',
        }
    )
    
    class Meta:
        model = Product
        fields = {
            'name': ['icontains'],
            'code': ['exact', 'icontains'],
            'is_visible_on_site': ['exact'],
            'unit': ['exact'],
        }
    
    def filter_available(self, queryset, name, value):
        """Фильтр только доступных товаров."""
        if value:
            return queryset.filter(
                is_visible_on_site=True, 
                in_stock=True, 
                stock_quantity__gt=0
            )
        return queryset
    
    def filter_by_tags(self, queryset, name, value):
        """Фильтр по тегам."""
        if value:
            tags = [tag.strip() for tag in value.split(',')]
            query = models.Q()
            for tag in tags:
                query |= models.Q(tags__icontains=tag)
            return queryset.filter(query)
        return queryset
    
    def filter_by_category(self, queryset, name, value):
        """Фильтр по категории с включением всех подкатегорий."""
        if value:
            # Получаем ID выбранной категории и всех её подкатегорий
            category_ids = value.get_descendants(include_self=True)
            return queryset.filter(category_id__in=category_ids)
        return queryset
    
    def filter_by_ids(self, queryset, name, value):
        """Фильтр по списку ID товаров."""
        if value:
            try:
                # Парсим строку с ID, разделенными запятыми
                ids = [int(id_str.strip()) for id_str in value.split(',') if id_str.strip().isdigit()]
                if ids:
                    return queryset.filter(id__in=ids)
            except (ValueError, TypeError):
                pass
        return queryset
    
    def filter_search(self, queryset, name, value):
        """Поиск по названию, описанию, тегам, бренду и штрихкодам."""
        if value:
            return queryset.filter(
                models.Q(name__icontains=value) |
                models.Q(description__icontains=value) |
                models.Q(tags__icontains=value) |
                models.Q(brand__icontains=value) |
                models.Q(barcodes__icontains=value)
            )
        return queryset


class CategoryFilter(django_filters.FilterSet):
    """Фильтр для категорий."""
    
    parent = django_filters.ModelChoiceFilter(
        queryset=Category.objects.filter(is_active=True)
    )
    
    # Только родительские категории
    parent_only = django_filters.BooleanFilter(method='filter_parent_only')
    
    # Только дочерние категории
    children_only = django_filters.BooleanFilter(method='filter_children_only')
    
    class Meta:
        model = Category
        fields = {
            'name': ['icontains'],
            'slug': ['exact'],
            'is_active': ['exact'],
        }
    
    def filter_parent_only(self, queryset, name, value):
        """Фильтр только родительских категорий."""
        if value:
            return queryset.filter(parent__isnull=True)
        return queryset
    
    def filter_children_only(self, queryset, name, value):
        """Фильтр только дочерних категорий."""
        if value:
            return queryset.filter(parent__isnull=False)
        return queryset