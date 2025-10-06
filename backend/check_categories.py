#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.categories.models import Category

print("=== СТРУКТУРА КАТЕГОРИЙ ===")
for cat in Category.objects.filter(parent=None).order_by('name'):
    print(f"📁 {cat.name}")
    for subcat in cat.children.all().order_by('name'):
        print(f"  📂 {subcat.name}")
        for subsubcat in subcat.children.all().order_by('name'):
            print(f"    📄 {subsubcat.name}")

print("\n=== ВСЕ КАТЕГОРИИ ===")
for cat in Category.objects.all().order_by('parent_id', 'name'):
    parent_name = cat.parent.name if cat.parent else "ROOT"
    print(f"{cat.name} -> parent: {parent_name}")