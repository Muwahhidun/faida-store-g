import json
import os
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.categories.models import Category

with open('/app/goods_data/pp/export.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

subcategories = set()
products_with_subcats = 0

for product in data:
    category = product.get('Категория', {})
    if category:
        main_cat = category.get('Наименование', '')
        sub_cat_info = category.get('Подкатегория', {})
        if sub_cat_info:
            sub_cat = sub_cat_info.get('Наименование', '')
            if sub_cat:
                subcategories.add(f'{main_cat} -> {sub_cat}')
                products_with_subcats += 1

print(f'Товаров с подкатегориями: {products_with_subcats}')
print(f'Уникальных подкатегорий: {len(subcategories)}')
print('\nВсе подкатегории из JSON:')
for subcat in sorted(subcategories):
    print(f'- {subcat}')

print('\nТекущие категории в БД:')
for cat in Category.objects.all().order_by('parent__id', 'name'):
    parent_name = cat.parent.name if cat.parent else 'None'
    print(f'- {cat.name} (parent: {parent_name})')