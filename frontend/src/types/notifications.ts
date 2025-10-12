/**
 * Типы для гибкой системы уведомлений
 */

export interface NotificationCategory {
    id: number;
    code: string;
    name: string;
    description: string;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface NotificationChannel {
    id: number;
    code: string;
    name: string;
    icon: string;
    is_active: boolean;
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface NotificationType {
    id: number;
    category: number;
    category_name: string;
    code: string;
    name: string;
    description: string;
    is_enabled: boolean;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface NotificationTemplate {
    id: number;
    notification_type: number;
    notification_type_name: string;
    channel: number;
    channel_name: string;
    name: string;
    subject: string;
    template: string;
    variables_help: Record<string, string>;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface NotificationContact {
    id: number;
    channel: number;
    channel_name: string;
    channel_icon: string;
    name: string;
    value: string;  // Поле в БД называется "value", не "contact_value"
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContactTemplate {
    contact_id: number;
    template_id: number | null;
    template_name: string;
}

export interface NotificationRule {
    id: number;
    notification_type: {
        id: number;
        code: string;
        name: string;
        description: string;
    };
    channel: {
        id: number;
        code: string;
        name: string;
        icon: string;
    };
    is_enabled: boolean;
    contacts: NotificationContact[];
    contact_templates: ContactTemplate[];
    created_at: string;
    updated_at: string;
}

export interface NotificationLog {
    id: number;
    notification_type: number;
    notification_type_name: string;
    channel: number;
    channel_name: string;
    contact: number | null;
    contact_name: string;
    recipient_value: string;
    status: 'pending' | 'sent' | 'failed' | 'retrying';
    message: string;
    error_message: string;
    retry_count: number;
    max_retries: number;
    next_retry_at: string | null;
    created_at: string;
    updated_at: string;
}
