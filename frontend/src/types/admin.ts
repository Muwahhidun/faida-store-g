/**
 * Типы и интерфейсы для админ-панели
 */

export interface Source {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    show_on_site: boolean;
    json_file_path: string;
    media_dir_path: string;
    default_price_type?: string;
    default_price_type_name: string;
    default_warehouse?: string;
    default_warehouse_name: string;
    import_status: 'idle' | 'running' | 'completed' | 'failed' | 'running_data' | 'running_full';
    import_status_display: string;
    last_import_started: string | null;
    last_import_completed: string | null;
    import_error_message: string | null;
    auto_sync_enabled: boolean;
    data_sync_interval: number;
    last_data_sync: string | null;
    next_data_sync: string | null;
    full_sync_interval: number;
    last_full_sync: string | null;
    next_full_sync: string | null;
    last_error_time: string | null;
}

export interface AvailableOptions {
    price_types: Array<{ code: string; name: string }>;
    warehouses: Array<{ code: string; name: string }>;
}

export interface Category {
    id: number;
    name: string;
    display_name: string;
    category_visible_name: string;  // Название для отображения (display_name или name)
    parent: number | null;
    is_active: boolean;
    is_visible_on_site: boolean;
    products_count: number;
    order: number;
    sources: Array<{
        id: number;
        name: string;
        code: string;
    }>;
    children?: Category[];
}

export interface Product {
    id: number;
    code: string;
    name: string;
    article: string;
    price: string;
    currency: string;
    unit: string;
    in_stock: boolean;
    stock_quantity: number;
    is_visible_on_site: boolean;
    category: Category;
    source_name: string;
    source_code: string;
    brand: string;
    main_image?: {
        id: number;
        image: string;
        alt_text: string;
        is_main: boolean;
    };
    images: Array<{
        id: number;
        image: string;
        alt_text: string;
        is_main: boolean;
    }>;
    created_at: string;
    updated_at: string;
    // Поля для настроек остатков
    use_default_stock_settings?: boolean;
    stock_display_style?: string;
    low_stock_threshold?: number;
    // Поля для визуальной индикации видимости
    is_category_visible?: boolean;
    is_source_visible?: boolean;
    visibility_status?: {
        is_visible_to_users: boolean;
        reasons: Array<{
            type: 'product' | 'category' | 'source' | 'stock';
            message: string;
            field: string;
        }>;
    };
}

export interface GlobalSettings {
    min_stock_for_display: number;
    default_stock_display_style: 'exact' | 'status' | 'detailed_status';
    default_low_stock_threshold: number;
    show_stock_quantities_globally: boolean;
}

export interface ProductStockSettingsModalProps {
    product: Product;
    onClose: () => void;
    onSave: (data: {
        use_default_stock_settings: boolean;
        stock_display_style: string;
        low_stock_threshold: number;
    }) => void;
    globalSettings: GlobalSettings;
}

export interface VisibilityIndicatorProps {
    product: Product;
    categories: Category[];
    sources: Source[];
    minStock: number;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'user' | 'moderator' | 'admin';
    role_display: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    date_joined: string;
    last_login: string | null;
}
