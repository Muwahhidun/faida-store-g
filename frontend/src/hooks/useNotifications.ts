/**
 * React Query хуки для работы с API уведомлений
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminClient } from '../api/adminClient';
import type {
    NotificationCategory,
    NotificationChannel,
    NotificationType,
    NotificationTemplate,
    NotificationContact,
    NotificationRule,
    NotificationLog
} from '../types/notifications';

const NOTIFICATIONS_BASE = '/notifications';

// ==================== Каналы ====================

export const useNotificationChannels = () => {
    return useQuery({
        queryKey: ['notification-channels'],
        queryFn: async () => {
            const response = await adminClient.get<NotificationChannel[]>(`${NOTIFICATIONS_BASE}/channels/`);
            return response.data;
        },
    });
};

export const useTestChannel = () => {
    return useMutation({
        mutationFn: async (channelId: number) => {
            const response = await adminClient.post(`${NOTIFICATIONS_BASE}/channels/${channelId}/test_connection/`);
            return response.data;
        },
    });
};

// ==================== Контакты ====================

export const useNotificationContacts = () => {
    return useQuery({
        queryKey: ['notification-contacts'],
        queryFn: async () => {
            const response = await adminClient.get<NotificationContact[]>(`${NOTIFICATIONS_BASE}/contacts/`);
            return response.data;
        },
    });
};

export const useCreateContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<NotificationContact>) => {
            const response = await adminClient.post<NotificationContact>(`${NOTIFICATIONS_BASE}/contacts/`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-contacts'] });
        },
    });
};

export const useUpdateContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<NotificationContact> }) => {
            const response = await adminClient.patch<NotificationContact>(
                `${NOTIFICATIONS_BASE}/contacts/${id}/`,
                data
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-contacts'] });
        },
    });
};

export const useDeleteContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await adminClient.delete(`${NOTIFICATIONS_BASE}/contacts/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-contacts'] });
        },
    });
};

// ==================== Логи ====================

export const useNotificationLogs = () => {
    return useQuery({
        queryKey: ['notification-logs'],
        queryFn: async () => {
            const response = await adminClient.get<NotificationLog[]>(`${NOTIFICATIONS_BASE}/logs/`);
            return response.data;
        },
        refetchInterval: 30000, // Обновлять каждые 30 секунд
    });
};

export const useRetryNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (logId: number) => {
            const response = await adminClient.post(`${NOTIFICATIONS_BASE}/logs/${logId}/retry/`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
        },
    });
};

// ==================== Статистика ====================

export const useNotificationStats = () => {
    return useQuery({
        queryKey: ['notification-stats'],
        queryFn: async () => {
            // Загружаем все данные для подсчета статистики
            const [types, channels, logs] = await Promise.all([
                adminClient.get<NotificationType[]>(`${NOTIFICATIONS_BASE}/types/`),
                adminClient.get<NotificationChannel[]>(`${NOTIFICATIONS_BASE}/channels/`),
                adminClient.get<NotificationLog[]>(`${NOTIFICATIONS_BASE}/logs/`),
            ]);

            return {
                totalTypes: types.data.length,
                activeChannels: channels.data.filter(c => c.is_active).length,
                sentThisMonth: logs.data.filter(log => {
                    const logDate = new Date(log.created_at);
                    const now = new Date();
                    return (
                        logDate.getMonth() === now.getMonth() &&
                        logDate.getFullYear() === now.getFullYear() &&
                        log.status === 'sent'
                    );
                }).length,
                failedCount: logs.data.filter(log => log.status === 'failed').length,
                retryingCount: logs.data.filter(log => log.status === 'retrying').length,
            };
        },
        refetchInterval: 60000, // Обновлять каждую минуту
    });
};
