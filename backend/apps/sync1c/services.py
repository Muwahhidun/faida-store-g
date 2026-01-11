"""
Сервисы для синхронизации с 1С.
"""

import json
import hashlib
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.core.files import File
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone as django_timezone
from PIL import Image
from decimal import Decimal

from apps.products.models import Product, ProductImage, Brand
from apps.categories.models import Category
from .models import SyncLog, SyncError, IntegrationSource

logger = logging.getLogger('sync1c')


class ProductImporter:
    """Сервис для импорта товаров из 1С."""
    
    def __init__(self):
        self.source = None
        self.sync_log = None
        self.processed_count = 0
        self.created_count = 0
        self.updated_count = 0
        self.errors = []
        self.skip_media = False
    
    def import_from_source(self, source: IntegrationSource, skip_media: bool = False) -> SyncLog:
        """Импорт товаров из указанного источника данных 1С."""
        self.source = source
        self.skip_media = skip_media
        
        # Полный путь к файлу JSON
        goods_data_dir = settings.GOODS_DATA_DIR
        file_path = goods_data_dir / self.source.json_file_path
        
        # Создаем лог синхронизации
        sync_type = 'partial' if skip_media else 'full'
        self.sync_log = SyncLog.objects.create(
            sync_type=sync_type,
            status='started',
            source=self.source,  # Привязываем лог к источнику
            source_file_path=str(file_path)
        )
        
        try:
            # Проверяем существование файла
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Файл {file_path} не найден")
            
            # Получаем информацию о файле
            file_stat = os.stat(file_path)
            self.sync_log.source_file_size = file_stat.st_size
            self.sync_log.source_file_modified = datetime.fromtimestamp(
                file_stat.st_mtime, tz=timezone.utc
            )
            self.sync_log.save()
            
            # Читаем JSON файл (с поддержкой BOM)
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                products_data = json.load(f)
            
            # Проверяем, что данные являются массивом
            if not isinstance(products_data, list):
                raise ValueError("Ожидается массив товаров в JSON файле")
            
            self.sync_log.total_products = len(products_data)
            self.sync_log.status = 'in_progress'
            self.sync_log.save()
            
            logger.info(f"Начинаем {'частичную' if skip_media else 'полную'} синхронизацию {len(products_data)} товаров")
            
            # Собираем коды товаров из 1С для определения удаленных (только при полной синхронизации)
            current_product_codes = set()
            if not self.skip_media:
                current_product_codes = {product.get('Код') for product in products_data if product.get('Код')}
            
            # Импортируем товары пакетами
            batch_size = settings.SYNC_1C_SETTINGS.get('BATCH_SIZE', 100)
            
            for i in range(0, len(products_data), batch_size):
                batch = products_data[i:i + batch_size]
                self._process_products_batch(batch)
                
                # Обновляем прогресс
                self.sync_log.processed_products = min(
                    self.processed_count, len(products_data)
                )
                self.sync_log.save()
            
            # Обрабатываем удаленные товары (только при полной синхронизации)
            if not self.skip_media and current_product_codes:
                self._handle_deleted_products(current_product_codes)
            
            # Выполняем проверки целостности данных
            self._perform_integrity_checks()
            
            # Завершаем синхронизацию
            self._finish_sync('completed')
            
        except Exception as e:
            logger.error(f"Ошибка импорта: {str(e)}")
            self._finish_sync('failed', str(e))
            raise
        
        return self.sync_log
    
    def _process_products_batch(self, products_batch: List[Dict]) -> None:
        """Обработка пакета товаров."""
        
        with transaction.atomic():
            for product_data in products_batch:
                self._process_single_product(product_data)
                self.processed_count += 1
    
    def _process_single_product(self, product_data: Dict) -> Tuple[Product, bool]:
        """Обработка одного товара."""
        
        product_id = product_data.get('Код')
        if not product_id:
            raise ValueError("Отсутствует код товара")
        
        # Создаем хэш данных для отслеживания изменений
        product_hash = self._calculate_1c_product_hash(product_data)
        
        # Ищем существующий товар по коду. Он мог остаться от удаленного источника.
        try:
            product = Product.objects.get(code=product_id)
            
            # Проверяем, изменились ли данные (сравниваем хэш ИЛИ проверяем, что товар был "бездомным")
            if product.sync_hash == product_hash and product.source == self.source:
                logger.debug(f"Товар {product_id} не изменился, но проверяем изображения")
                # Если товар был деактивирован, но данные не изменились, все равно активируем его
                if not product.is_visible_on_site:
                    product.is_visible_on_site = True
                    product.save(update_fields=['is_visible_on_site'])
                
                # Обрабатываем изображения даже для неизмененных товаров (при полной синхронизации)
                if not self.skip_media:
                    self._process_1c_product_images(product, product_data)
                
                return product, False
            
            # Обновляем товар, перепривязывая его к текущему источнику
            self._update_1c_product(product, product_data, product_hash)
            self.updated_count += 1
            created = False
            
        except Product.DoesNotExist:
            # Создаем новый товар, если по коду ничего не найдено
            product = self._create_1c_product(product_data, product_hash)
            self.created_count += 1
            created = True
        
        # Обрабатываем изображения (только при полной синхронизации)
        if not self.skip_media:
            self._process_1c_product_images(product, product_data)
        
        return product, created
    
    def _process_category_hierarchy(self, category_info: Dict, parent=None) -> Category:
        """Обработка иерархии категорий любой глубины."""
        category_name = category_info.get('Наименование', '')
        category_code = category_info.get('КодКатегории', '')
        
        if not category_name:
            return parent
        
        # Ищем существующую категорию по коду 1С или имени с родителем
        current_category = None
        
        # Ищем категорию СТРОГО по коду 1С, если он есть
        if category_code:
            try:
                current_category = Category.objects.get(code_category=category_code)
                # Обновляем данные категории, если они изменились
                if current_category.name != category_name or current_category.parent != parent:
                    current_category.name = category_name
                    current_category.parent = parent
                    # Обновляем slug если сменился родитель
                    if parent:
                        current_category.slug = f"{parent.slug}-{self._slugify(category_name)}"
                    else:
                        current_category.slug = self._slugify(category_name)
                    current_category.save()
                    logger.info(f"Обновлена категория: {category_name} ({category_code})")
            except Category.DoesNotExist:
                current_category = None
        else:
            # Если кода 1С нет, ищем по старой логике (имя + родитель)
            # Это сохранит совместимость, если в JSON не будет КодаКатегории
            try:
                current_category = Category.objects.get(name=category_name, parent=parent)
            except Category.DoesNotExist:
                current_category = None
        
        # Создаём новую категорию, только если не нашли существующую
        if not current_category:
            if parent:
                category_slug = f"{parent.slug}-{self._slugify(category_name)}"
            else:
                category_slug = self._slugify(category_name)
            
            current_category = Category.objects.create(
                name=category_name,
                parent=parent,
                slug=category_slug,
                code_category=category_code  # Новое поле
            )
            logger.info(f"Создана категория: {category_name} ({category_code})")
        
        # Проверяем, есть ли вложенные подкатегории
        subcategory_info = category_info.get('Подкатегория', {})
        if subcategory_info:
            # Рекурсивно обрабатываем вложенные категории
            return self._process_category_hierarchy(subcategory_info, current_category)
        
        return current_category
    
    def _create_1c_product(self, product_data: Dict, product_hash: str) -> Product:
        """Создание нового товара из данных 1С."""
        
        # Обрабатываем иерархию категорий
        category = None
        category_info = product_data.get('Категория', {})
        if category_info:
            category = self._process_category_hierarchy(category_info)
        
        # Определяем цену и остаток, используя новую гибкую логику
        price, stock_quantity, in_stock = self._get_price_and_stock(product_data)
        
        # Извлекаем штрихкоды
        barcodes = product_data.get('Штрихкоды', [])
        barcode_str = ', '.join(barcodes) if barcodes else ''
        
        # Получаем или создаем бренд
        brand = self._get_or_create_brand(product_data.get('Производитель', ''))

        product = Product.objects.create(
            code=product_data['Код'],
            source=self.source,  # Привязываем товар к источнику
            article=product_data.get('Артикул', ''),
            name=product_data.get('Наименование', ''),
            category=category,
            price=price,
            currency='RUB',
            unit=product_data.get('ЕдиницаИзмерения', 'шт'),
            in_stock=in_stock,
            stock_quantity=stock_quantity,
            description=product_data.get('Описание', ''),
            brand=brand,
            weight=product_data.get('ВесЕдиницыВесовогоТовара', ''),
            composition='',
            shelf_life='',
            storage_conditions='',
            seo_title=product_data.get('SeoTitle', ''),
            seo_description=product_data.get('SeoDescription', ''),
            barcodes=barcode_str,
            tags='',  # Очищаем теги - теперь штрихкоды в отдельном поле
            # Новые поля для детальной информации
            is_weighted=product_data.get('Весовой', False),
            unit_weight=product_data.get('ВесЕдиницыВесовогоТовара'),
            prices_data=product_data.get('Цены', []),
            stocks_data=product_data.get('Остатки', []),
            sync_hash=product_hash,
            last_sync_at=django_timezone.now()
        )
        
        logger.info(f"Создан товар: {product.name} ({product.code})")
        return product
    
    def _update_1c_product(self, product: Product, product_data: Dict, product_hash: str) -> None:
        """Обновление существующего товара из данных 1С."""
        
        # Обновляем иерархию категорий
        category_info = product_data.get('Категория', {})
        if category_info:
            product.category = self._process_category_hierarchy(category_info)
        
        # Определяем цену и остаток, используя новую гибкую логику
        price, stock_quantity, in_stock = self._get_price_and_stock(product_data, product)
        
        # Извлекаем штрихкоды
        barcodes = product_data.get('Штрихкоды', [])
        barcode_str = ', '.join(barcodes) if barcodes else ''
        
        # Получаем или создаем бренд
        brand_name = product_data.get('Производитель', '')
        if brand_name:
            product.brand = self._get_or_create_brand(brand_name)

        # Обновляем поля
        product.source = self.source  # Перепривязываем к источнику
        product.is_visible_on_site = True  # Активируем товар
        product.article = product_data.get('Артикул', product.article)
        product.name = product_data.get('Наименование', product.name)
        product.price = price
        product.unit = product_data.get('ЕдиницаИзмерения', product.unit)
        product.in_stock = in_stock
        product.stock_quantity = stock_quantity
        product.description = product_data.get('Описание', product.description)
        product.weight = product_data.get('ВесЕдиницыВесовогоТовара', product.weight)
        product.barcodes = barcode_str
        product.tags = ''  # Очищаем теги - теперь штрихкоды в отдельном поле
        # Обновляем новые поля
        product.is_weighted = product_data.get('Весовой', False)
        product.unit_weight = product_data.get('ВесЕдиницыВесовогоТовара')
        product.prices_data = product_data.get('Цены', [])
        product.stocks_data = product_data.get('Остатки', [])
        product.sync_hash = product_hash
        product.last_sync_at = django_timezone.now()
        
        product.save()
        
        logger.info(f"Обновлен товар: {product.name} ({product.code})")
    
    def _process_1c_product_images(self, product: Product, product_data: Dict) -> None:
        """Обработка изображений товара из данных 1С с оптимизацией."""
        
        images_list = product_data.get('Изображения', [])
        if not images_list:
            logger.debug(f"Изображения для товара {product.code} не указаны")
            # Удаляем существующие изображения если их больше нет в данных
            product.images.all().delete()
            return
        
        media_base_dir = settings.GOODS_DATA_DIR
        media_dir = media_base_dir / self.source.media_dir_path
        
        # Получаем текущие изображения товара
        # Создаем словарь по имени файла (без пути), так как original_filename содержит только имя файла
        # Если есть несколько изображений с одним именем, берем первое
        existing_images = {}
        for img in product.images.all():
            # Извлекаем имя файла из полного пути (если есть папка)
            filename_only = Path(img.original_filename).name
            if filename_only not in existing_images:
                existing_images[filename_only] = img
        current_image_hashes = {}
        
        # Нормализуем список изображений (поддерживаем старый и новый форматы)
        normalized_images = self._normalize_images_list(images_list)
        
        # Вычисляем хэши текущих файлов изображений
        for image_info in normalized_images:
            image_path = image_info['path']
            full_image_path = media_dir / image_path
            if full_image_path.exists():
                file_hash = self._calculate_file_hash(full_image_path)
                # Сохраняем хэш по имени файла (без пути)
                filename_only = Path(image_path).name
                current_image_hashes[filename_only] = file_hash
        
        # Список файлов для обработки
        images_to_process = []
        images_to_keep = set()
        
        for idx, image_info in enumerate(normalized_images):
            image_path = image_info['path']
            is_main = image_info['is_main']
            full_image_path = media_dir / image_path
            
            if not full_image_path.exists():
                logger.warning(f"Файл изображения {full_image_path} не найден")
                continue
            
            # Используем имя файла без пути для поиска
            filename_only = Path(image_path).name
            current_hash = current_image_hashes.get(filename_only)
            existing_image = existing_images.get(filename_only)
            
            if existing_image:
                # Проверяем, изменился ли файл или статус основного изображения
                existing_hash = getattr(existing_image, 'file_hash', '')
                
                # Если у существующего изображения нет хэша, вычисляем его
                if not existing_hash:
                    existing_hash = current_hash
                    existing_image.file_hash = current_hash
                    existing_image.save(update_fields=['file_hash'])
                    logger.info(f"Обновлен хэш для существующего изображения {filename_only}")
                
                if (existing_hash == current_hash and
                    existing_image.is_main == is_main):
                    # Файл и статус не изменились, оставляем как есть
                    images_to_keep.add(existing_image.id)
                    logger.info(f"Изображение {filename_only} не изменилось, пропускаем")
                    continue
                else:
                    # Файл или статус изменился, удаляем старое изображение
                    old_hash = getattr(existing_image, 'file_hash', 'отсутствует')
                    old_is_main = existing_image.is_main
                    if existing_hash != current_hash:
                        logger.info(f"Удаляем изображение {filename_only} - изменился хэш файла: {old_hash} → {current_hash}")
                    else:
                        logger.info(f"Удаляем изображение {filename_only} - изменился статус is_main: {old_is_main} → {is_main}")
                    
                    # Удаляем изображение, если оно еще не удалено
                    if existing_image.id:
                        existing_image.delete()
                        # Убираем из словаря, чтобы не пытаться удалить повторно
                        existing_images.pop(filename_only, None)
            
            # Добавляем в список для обработки
            images_to_process.append((full_image_path, is_main, current_hash, idx))
        
        # Удаляем изображения, которых больше нет в списке
        for filename, image in existing_images.items():
            if image.id not in images_to_keep:
                logger.info(f"Удаляем изображение {filename} - его нет в новом списке")
                image.delete()
        
        # Обрабатываем новые и измененные изображения
        for full_image_path, is_main, file_hash, order_idx in images_to_process:
            try:
                self._create_product_image(product, full_image_path, is_main, file_hash, order_idx)
            except Exception as e:
                logger.error(f"Ошибка создания изображения {full_image_path}: {str(e)}")
    
    def _normalize_images_list(self, images_list: List) -> List[Dict]:
        """
        Нормализация списка изображений для поддержки старого и нового форматов.
        
        Старый формат: ["path1.jpg", "path2.jpg"]
        Новый формат: [{"Путь": "path1.jpg", "Основное": true}, {"Путь": "path2.jpg", "Основное": false}]
        
        Возвращает: [{"path": "path1.jpg", "is_main": true}, {"path": "path2.jpg", "is_main": false}]
        """
        normalized = []
        
        for idx, item in enumerate(images_list):
            if isinstance(item, str):
                # Старый формат - строка с путем
                normalized.append({
                    'path': item,
                    'is_main': idx == 0  # Первое изображение считается основным
                })
            elif isinstance(item, dict):
                # Новый формат - объект с полями
                path = item.get('Путь', '')
                is_main = item.get('Основное', False)
                
                if not path:
                    logger.warning(f"Пропущено изображение без пути: {item}")
                    continue
                    
                normalized.append({
                    'path': path,
                    'is_main': is_main
                })
            else:
                logger.warning(f"Неизвестный формат изображения: {item}")
                continue
        
        # Проверяем, что есть хотя бы одно основное изображение
        main_images = [img for img in normalized if img['is_main']]
        if not main_images and normalized:
            # Если ни одно не помечено как основное, делаем первое основным
            normalized[0]['is_main'] = True
            logger.info(f"Ни одно изображение не помечено как основное, установлено первое: {normalized[0]['path']}")
        elif len(main_images) > 1:
            # Если несколько основных, оставляем только первое
            for img in normalized:
                if img['is_main'] and img != main_images[0]:
                    img['is_main'] = False
            logger.warning(f"Найдено несколько основных изображений, оставлено только: {main_images[0]['path']}")
        
        return normalized
    
    def _create_product_image(self, product: Product, image_file: Path, is_main: bool = False, file_hash: str = None, order: int = 0) -> ProductImage:
        """Создание изображения товара."""
        
        # Открываем и оптимизируем изображение
        with Image.open(image_file) as img:
            # Конвертируем в RGB если необходимо
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Изменяем размер если слишком большое
            max_size = (1200, 1200)
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Сохраняем оптимизированное изображение
            upload_path = f"products/{product.code}/"
            filename = f"{image_file.stem}_optimized.jpg"
            
            # Создаем временный файл
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                img.save(temp_file.name, 'JPEG', quality=85, optimize=True)
                temp_file.seek(0)
                
                # Создаем запись в БД
                product_image = ProductImage.objects.create(
                    product=product,
                    alt_text=f"Изображение {product.name}",
                    is_main=is_main,
                    order=order,
                    original_filename=image_file.name,
                    file_hash=file_hash or self._calculate_file_hash(image_file)
                )
                
                # Сохраняем файл
                with open(temp_file.name, 'rb') as f:
                    product_image.image.save(
                        filename,
                        File(f),
                        save=True
                    )
                
                # Удаляем временный файл
                os.unlink(temp_file.name)
        
        logger.info(f"Создано изображение для товара {product.code}: {filename}")
        return product_image
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Вычисление MD5 хэша файла."""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def _calculate_1c_product_hash(self, product_data: Dict) -> str:
        """Вычисление MD5 хэша данных товара из 1С."""
        
        # Определяем цену и остаток, используя новую гибкую логику
        # Передаем product=None, так как на этом этапе у нас еще нет объекта продукта
        price, stock_quantity, in_stock = self._get_price_and_stock(product_data)
        
        # Создаем строку из основных полей товара
        hash_data = {
            'name': product_data.get('Наименование', ''),
            'price': str(price),
            'inStock': in_stock,
            'stockQuantity': str(stock_quantity),
            'description': product_data.get('Описание', ''),
            'weight': product_data.get('ВесЕдиницыВесовогоТовара', ''),
            'category': product_data.get('Категория', {}).get('Наименование', ''),
            'barcodes': product_data.get('Штрихкоды', [])
        }
        
        hash_string = json.dumps(hash_data, sort_keys=True, ensure_ascii=False)
        return hashlib.md5(hash_string.encode('utf-8')).hexdigest()

    def _get_price_and_stock(self, product_data: Dict, product: Optional[Product] = None) -> Tuple[Decimal, Decimal, bool]:
        """
        Гибкое определение цены и остатков с учетом правил.
        Иерархия приоритетов:
        1. Ручные настройки в конкретном товаре (product.selected_price/stock_code).
        2. Правила по умолчанию из источника (self.source.default_price/warehouse_name).
        """
        prices = product_data.get('Цены', [])
        stocks = product_data.get('Остатки', [])
        
        price = Decimal('0.00')
        stock_quantity = Decimal('0.000')
        in_stock = False

        # --- Определение цены ---
        selected_price_found = False
        # Приоритет 1: Ручная настройка в товаре
        if product and product.selected_price_code:
            for price_info in prices:
                if price_info.get('КодЦены') == product.selected_price_code:
                    price = Decimal(price_info.get('Цена', 0))
                    selected_price_found = True
                    break
        
        # Приоритет 2: Правило из источника
        if not selected_price_found and self.source.default_price_type_name:
            for price_info in prices:
                if price_info.get('ВидЦены') == self.source.default_price_type_name:
                    price = Decimal(price_info.get('Цена', 0))
                    break

        # --- Определение остатка ---
        selected_stock_found = False
        # Приоритет 1: Ручная настройка в товаре
        if product and product.selected_stock_code:
            for stock_info in stocks:
                if stock_info.get('КодСклада') == product.selected_stock_code:
                    stock_quantity = Decimal(stock_info.get('СвободныйОстаток', 0))
                    selected_stock_found = True
                    break
        
        # Приоритет 2: Правило из источника
        if not selected_stock_found and self.source.default_warehouse_name:
            for stock_info in stocks:
                if stock_info.get('Склад') == self.source.default_warehouse_name:
                    stock_quantity = Decimal(stock_info.get('СвободныйОстаток', 0))
                    break
        
        if stock_quantity > 0:
            in_stock = True
            
        return price, stock_quantity, in_stock
    
    def _get_or_create_brand(self, brand_name: str) -> Optional[Brand]:
        """Получение или создание бренда по имени."""
        if not brand_name or not brand_name.strip():
            return None

        brand_name = brand_name.strip()
        brand, created = Brand.objects.get_or_create(name=brand_name)

        if created:
            logger.info(f"Создан новый бренд: {brand_name}")

        return brand

    def _slugify(self, text: str) -> str:
        """Создание slug из текста."""
        import re
        from django.utils.text import slugify
        
        # Транслитерация русских символов
        translit_dict = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ь': '', 'ы': 'y', 'ъ': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        }
        
        text = text.lower()
        for rus, lat in translit_dict.items():
            text = text.replace(rus, lat)
        
        return slugify(text)
    
    def _finish_sync(self, status: str, error_message: str = None) -> None:
        """Завершение синхронизации."""
        
        self.sync_log.status = status
        self.sync_log.finished_at = django_timezone.now()
        self.sync_log.duration = self.sync_log.finished_at - self.sync_log.started_at
        self.sync_log.processed_products = self.processed_count
        self.sync_log.created_products = self.created_count
        self.sync_log.updated_products = self.updated_count
        self.sync_log.errors_count = len(self.errors)
        
        if error_message:
            self.sync_log.error_details = error_message
        
        if self.errors:
            self.sync_log.message = f"Обработано товаров: {self.processed_count}, ошибок: {len(self.errors)}"
        else:
            self.sync_log.message = f"Успешно обработано {self.processed_count} товаров"
        
        self.sync_log.save()
        
        logger.info(f"Синхронизация завершена со статусом: {status}")
        logger.info(f"Обработано: {self.processed_count}, создано: {self.created_count}, обновлено: {self.updated_count}")
    
    def _handle_deleted_products(self, current_product_codes: set) -> None:
        """Обработка товаров, удаленных из 1С."""
        
        # Получаем все товары этого источника, которые есть в базе, но не в 1С
        existing_products = Product.objects.filter(
            source=self.source,
            is_visible_on_site=True
        ).exclude(code__in=current_product_codes)
        
        deleted_count = 0
        for product in existing_products:
            # Помечаем товар как невидимый вместо удаления
            product.is_visible_on_site = False
            product.save()
            deleted_count += 1
            
            logger.info(f"Товар {product.code} ({product.name}) помечен как невидимый - удален из 1С")
        
        if deleted_count > 0:
            logger.info(f"Помечено как невидимых {deleted_count} товаров, удаленных из 1С")
    
    def _handle_deleted_categories(self, groups_data: List[Dict]) -> None:
        """Обработка категорий, удаленных из 1С."""
        
        if not groups_data:
            return
        
        # Собираем все коды категорий из данных 1С (рекурсивно)
        current_category_codes = set()
        self._collect_category_codes(groups_data, current_category_codes)
        
        # Получаем все категории этого источника, которых нет в 1С
        existing_categories = Category.objects.filter(
            source=self.source,
            is_visible_on_site=True
        ).exclude(code_category__in=current_category_codes)
        
        deleted_count = 0
        for category in existing_categories:
            # Помечаем категорию как невидимую
            category.is_visible_on_site = False
            category.save()
            deleted_count += 1
            
            logger.info(f"Категория {category.code_category} ({category.name}) помечена как невидимая - удалена из 1С")
        
        if deleted_count > 0:
            logger.info(f"Помечено как невидимых {deleted_count} категорий, удаленных из 1С")
    
    def _collect_category_codes(self, groups_data: List[Dict], codes_set: set) -> None:
        """Рекурсивно собирает коды всех категорий из структуры данных 1С."""
        
        for group in groups_data:
            code = group.get('КодКатегории')
            if code:
                codes_set.add(code)
            
            # Рекурсивно обрабатываем подкатегории
            subgroups = group.get('Группы', [])
            if subgroups:
                self._collect_category_codes(subgroups, codes_set)
    
    def _perform_integrity_checks(self) -> None:
        """Выполнение проверок целостности данных после синхронизации."""
        
        logger.info("Начинаем проверки целостности данных...")
        
        # Проверяем товары без категорий
        self._check_products_without_categories()
        
        # Проверяем товары с некорректными ценами
        self._check_products_with_invalid_prices()
        
        # Проверяем товары с отрицательными остатками
        self._check_products_with_negative_stock()
        
        # Проверяем изображения без файлов
        self._check_images_without_files()
        
        # Проверяем дубликаты товаров
        self._check_duplicate_products()
        
        logger.info("Проверки целостности данных завершены")
    
    def _check_products_without_categories(self) -> None:
        """Проверка товаров без категорий."""
        
        products_without_category = Product.objects.filter(
            source=self.source,
            category__isnull=True,
            is_visible_on_site=True
        )
        
        count = products_without_category.count()
        if count > 0:
            logger.warning(f"Найдено {count} товаров без категории")
            
            # Логируем первые 10 товаров для примера
            for product in products_without_category[:10]:
                logger.warning(f"Товар без категории: {product.code} - {product.name}")
    
    def _check_products_with_invalid_prices(self) -> None:
        """Проверка товаров с некорректными ценами."""
        
        products_with_zero_price = Product.objects.filter(
            source=self.source,
            price__lte=0,
            is_visible_on_site=True
        )
        
        count = products_with_zero_price.count()
        if count > 0:
            logger.warning(f"Найдено {count} товаров с нулевой или отрицательной ценой")
            
            # Логируем первые 10 товаров для примера
            for product in products_with_zero_price[:10]:
                logger.warning(f"Товар с некорректной ценой: {product.code} - {product.name} (цена: {product.price})")
    
    def _check_products_with_negative_stock(self) -> None:
        """Проверка товаров с отрицательными остатками."""
        
        products_with_negative_stock = Product.objects.filter(
            source=self.source,
            stock_quantity__lt=0,
            is_visible_on_site=True
        )
        
        count = products_with_negative_stock.count()
        if count > 0:
            logger.warning(f"Найдено {count} товаров с отрицательными остатками")
            
            # Логируем первые 10 товаров для примера
            for product in products_with_negative_stock[:10]:
                logger.warning(f"Товар с отрицательным остатком: {product.code} - {product.name} (остаток: {product.stock_quantity})")
    
    def _check_images_without_files(self) -> None:
        """Проверка изображений без файлов."""
        
        from django.core.files.storage import default_storage
        
        broken_images = []
        
        # Получаем все изображения товаров этого источника
        product_images = ProductImage.objects.filter(
            product__source=self.source
        ).select_related('product')
        
        for image in product_images:
            if image.image and not default_storage.exists(image.image.name):
                broken_images.append(image)
        
        if broken_images:
            logger.warning(f"Найдено {len(broken_images)} изображений без файлов")
            
            # Логируем первые 10 изображений для примера
            for image in broken_images[:10]:
                logger.warning(f"Изображение без файла: {image.product.code} - {image.image.name}")
    
    def _check_duplicate_products(self) -> None:
        """Проверка дубликатов товаров по коду."""
        
        from django.db.models import Count
        
        # Находим дубликаты по коду в рамках одного источника
        duplicates = Product.objects.filter(
            source=self.source
        ).values('code').annotate(
            count=Count('id')
        ).filter(count__gt=1)
        
        if duplicates:
            logger.warning(f"Найдено {len(duplicates)} групп дубликатов товаров")
            
            for duplicate in duplicates:
                products = Product.objects.filter(
                    source=self.source,
                    code=duplicate['code']
                )
                logger.warning(f"Дубликаты товара с кодом {duplicate['code']}: {[p.id for p in products]}")