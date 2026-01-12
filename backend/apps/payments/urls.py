"""
URL patterns для системы платежей.
"""

from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Публичные
    path('available/', views.payment_availability, name='payment_availability'),
    path('create/', views.create_payment, name='create_payment'),
    path('webhook/', views.webhook, name='webhook'),
    path('status/<int:order_id>/', views.payment_status, name='payment_status'),

    # Админские
    path('refund/', views.create_refund, name='create_refund'),
    path('settings/', views.get_payment_settings, name='get_settings'),
    path('settings/update/', views.update_payment_settings, name='update_settings'),
]
