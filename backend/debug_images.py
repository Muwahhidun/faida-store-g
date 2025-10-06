#!/usr/bin/env python3

import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append('/app')
django.setup()

from apps.products.models import Product, ProductImage

# Найдем товар с изображениями
product = Product.objects.filter(images__isnull=False).first()
if product:
    print(f'=== Товар: {product.code} - {product.name} ===')
    for img in product.images.all()[:3]:
        print(f'ID: {img.id}')
        print(f'  original_filename: "{img.original_filename}"')
        print(f'  image.name: "{img.image.name}"')
        print(f'  is_main: {img.is_main}')
        print(f'  file_hash: {getattr(img, "file_hash", "НЕТ ПОЛЯ")}')
        print(f'  order: {img.order}')
        print('---')
else:
    print('❌ Нет товаров с изображениями')

# Проверим, есть ли поле file_hash в модели
from apps.products.models import ProductImage
fields = [f.name for f in ProductImage._meta.fields]
print(f'\nПоля модели ProductImage: {fields}')

if 'file_hash' in fields:
    print('✅ Поле file_hash есть в модели')
else:
    print('❌ Поле file_hash отсутствует в модели!')
