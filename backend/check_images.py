#!/usr/bin/env python3

import os
import django
import sys

# Добавляем путь к проекту
sys.path.append('/app')

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product, ProductImage

def check_images():
    total_products = Product.objects.count()
    total_images = ProductImage.objects.count()
    
    print(f"Всего товаров: {total_products}")
    print(f"Всего изображений: {total_images}")
    print()
    
    products_with_images = Product.objects.filter(images__isnull=False).distinct()
    print(f"Товаров с изображениями: {products_with_images.count()}")
    
    if products_with_images.exists():
        print("\nПримеры товаров с изображениями:")
        for p in products_with_images[:5]:
            main_image = p.main_image
            print(f"- {p.name}: {p.images.count()} изображений")
            if main_image:
                print(f"  Основное: {main_image.original_filename} (is_main={main_image.is_main})")
            else:
                print("  Основное изображение не найдено")
    else:
        print("\nНет товаров с изображениями")
        
    # Проверим несколько товаров без изображений
    products_without_images = Product.objects.filter(images__isnull=True)[:5]
    if products_without_images.exists():
        print(f"\nПримеры товаров БЕЗ изображений:")
        for p in products_without_images:
            print(f"- {p.name} (код: {p.code})")

if __name__ == '__main__':
    check_images()
