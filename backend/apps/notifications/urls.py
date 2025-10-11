"""
URL конфигурация для API уведомлений.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationCategoryViewSet,
    NotificationChannelViewSet,
    NotificationTypeViewSet,
    NotificationTemplateViewSet,
    NotificationContactViewSet,
    NotificationRuleViewSet,
    NotificationLogViewSet
)

router = DefaultRouter()
router.register(r'categories', NotificationCategoryViewSet, basename='notification-categories')
router.register(r'channels', NotificationChannelViewSet, basename='notification-channels')
router.register(r'types', NotificationTypeViewSet, basename='notification-types')
router.register(r'templates', NotificationTemplateViewSet, basename='notification-templates')
router.register(r'contacts', NotificationContactViewSet, basename='notification-contacts')
router.register(r'rules', NotificationRuleViewSet, basename='notification-rules')
router.register(r'logs', NotificationLogViewSet, basename='notification-logs')

urlpatterns = [
    path('', include(router.urls)),
]
