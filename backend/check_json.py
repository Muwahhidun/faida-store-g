#!/usr/bin/env python3

import json
import os

def check_json_images():
    json_path = '/app/goods_data/pp/export.json'
    
    if not os.path.exists(json_path):
        print(f"JSON файл не найден: {json_path}")
        return
    
    try:
        with open(json_path, 'r', encoding='utf-8-sig') as f:
            products_data = json.load(f)
        
        print(f"Всего товаров в JSON: {len(products_data)}")
        
        # Проверяем первые несколько товаров на наличие изображений
        products_with_images = 0
        total_images = 0
        
        for i, product in enumerate(products_data[:10]):  # Проверяем первые 10
            images = product.get('Изображения', [])
            if images:
                products_with_images += 1
                total_images += len(images)
                print(f"\nТовар {i+1}: {product.get('Наименование', 'Без названия')}")
                print(f"  Код: {product.get('Код', 'Без кода')}")
                print(f"  Изображения ({len(images)}):")
                
                for j, img in enumerate(images):
                    if isinstance(img, str):
                        print(f"    {j+1}. {img} (старый формат)")
                    elif isinstance(img, dict):
                        path = img.get('Путь', 'Нет пути')
                        is_main = img.get('Основное', False)
                        print(f"    {j+1}. {path} (основное: {is_main}) (новый формат)")
                    else:
                        print(f"    {j+1}. Неизвестный формат: {img}")
        
        print(f"\nИтого в первых 10 товарах:")
        print(f"  Товаров с изображениями: {products_with_images}")
        print(f"  Всего изображений: {total_images}")
        
        # Проверяем весь JSON
        all_products_with_images = 0
        all_total_images = 0
        
        for product in products_data:
            images = product.get('Изображения', [])
            if images:
                all_products_with_images += 1
                all_total_images += len(images)
        
        print(f"\nВо всём JSON файле:")
        print(f"  Товаров с изображениями: {all_products_with_images}")
        print(f"  Всего изображений: {all_total_images}")
        
    except Exception as e:
        print(f"Ошибка при чтении JSON: {e}")

if __name__ == '__main__':
    check_json_images()
