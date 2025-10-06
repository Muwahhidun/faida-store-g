from django import forms
from .models import IntegrationSource
from apps.products.models import Product

class IntegrationSourceAdminForm(forms.ModelForm):
    """
    Кастомная форма для админки, добавляющая динамические подсказки.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # --- Получаем доступные типы цен ---
        # values_list возвращает кортежи, flat=True делает из них плоский список
        all_prices_data = Product.objects.values_list('prices_data', flat=True)
        price_types = set()
        for price_list in all_prices_data:
            # Проверяем, что данные - это список (могут быть и null)
            if isinstance(price_list, list):
                for price_info in price_list:
                    if isinstance(price_info, dict) and 'ВидЦены' in price_info:
                        price_types.add(price_info['ВидЦены'])
        
        # --- Получаем доступные склады ---
        all_stocks_data = Product.objects.values_list('stocks_data', flat=True)
        warehouse_names = set()
        for stock_list in all_stocks_data:
            if isinstance(stock_list, list):
                for stock_info in stock_list:
                    if isinstance(stock_info, dict) and 'Склад' in stock_info:
                        warehouse_names.add(stock_info['Склад'])

        # --- Обновляем help_text для полей ---
        if price_types:
            # Добавляем HTML в help_text. Django Admin его обработает.
            price_help = f"<br><b>Доступные варианты:</b> <code>" + "</code>, <code>".join(sorted(list(price_types))) + "</code>"
            self.fields['default_price_type_name'].help_text += price_help

        if warehouse_names:
            warehouse_help = f"<br><b>Доступные варианты:</b> <code>" + "</code>, <code>".join(sorted(list(warehouse_names))) + "</code>"
            self.fields['default_warehouse_name'].help_text += warehouse_help

    class Meta:
        model = IntegrationSource
        fields = '__all__'
