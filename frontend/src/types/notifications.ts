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
    variables_help: Record<string, string>;  // Доступные переменные для этого типа уведомления
    created_at: string;
    updated_at: string;
}

export interface NotificationTemplate {
    id: number;
    notification_type: number;
    notification_type_name: string;
    channel_type: 'telegram' | 'whatsapp' | 'email';
    channel_type_display: string;  // "Telegram", "WhatsApp", "Email"
    name: string;
    subject: string;
    template: string;
    variables_help: Record<string, string>;
    is_default: boolean;
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

export interface NotificationContact {
    id: number;
    channel_type: 'telegram' | 'whatsapp' | 'email';
    channel_type_display: string;  // "Telegram", "WhatsApp", "Email"
    name: string;
    value: string;  // @username, +7999... или email
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
    name: string;
    rule_type: 'system' | 'additional';
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
    default_template: {
        id: number;
        name: string;
        channel_type: 'telegram' | 'whatsapp' | 'email';
    } | null;
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
