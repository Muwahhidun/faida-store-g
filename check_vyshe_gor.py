#!/usr/bin/env python3
import json

with open('data/goods/pp/export.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Найдем товары 'ВЫШЕ ГОР'
vyshe_gor_products = []
for product in data:
    if 'Выше гор' in product.get('Наименование', '') or product.get('Производитель') == 'Выше гор':
        vyshe_gor_products.append(product)

print(f"Найдено товаров ВЫШЕ ГОР: {len(vyshe_gor_products)}")
print()

if vyshe_gor_products:
    # Покажем первый товар для анализа структуры
    first_product = vyshe_gor_products[0]
    print("Структура первого товара ВЫШЕ ГОР:")
    print(f"Название: {first_product.get('Наименование')}")
    print(f"Код: {first_product.get('Код')}")
    print(f"Производитель: {first_product.get('Производитель')}")
    print(f"Категория: {first_product.get('Категория')}")
    print()
    
    # Список всех товаров
    print("Все товары ВЫШЕ ГОР:")
    for i, product in enumerate(vyshe_gor_products, 1):
        print(f"{i}. {product.get('Наименование')} (Код: {product.get('Код')})")