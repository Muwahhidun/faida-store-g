/**
 * Единое модальное окно для создания и редактирования каналов уведомлений
 */

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import {
    FaTimes,
    FaSave,
    FaSync,
    FaCheckCircle,
    FaExclamationCircle,
    FaEnvelope,
    FaWhatsapp,
    FaTelegram,
    FaBell,
    FaCheck
} from 'react-icons/fa';
import type { NotificationChannel } from '../../../types/notifications';

// Предустановленные типы каналов
const CHANNEL_PRESETS = [
    {
        code: 'email',
        name: 'Email',
        icon: 'FaEnvelope',
        IconComponent: FaEnvelope,
        color: 'blue',
        description: 'Отправка через SMTP'
    },
    {
        code: 'whatsapp',
        name: 'WhatsApp',
        icon: 'FaWhatsapp',
        IconComponent: FaWhatsapp,
        color: 'green',
        description: 'Отправка через Green API'
    },
    {
        code: 'telegram',
        name: 'Telegram',
        icon: 'FaTelegram',
        IconComponent: FaTelegram,
        color: 'blue',
        description: 'Отправка через Telegram Bot API'
    },
];

interface ChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    channel?: NotificationChannel | null;
    onSave: (data: any) => Promise<void>;
    onTestConnection: (channelCodeOrId: string | number, settings: Record<string, any>) => Promise<any>;
    isSaving?: boolean;
}

export default function ChannelModal({
    isOpen,
    onClose,
    mode,
    channel,
    onSave,
    onTestConnection,
    isSaving = false
}: ChannelModalProps) {
    // Состояния
    const [step, setStep] = useState<'select' | 'configure'>('select');
    const [selectedChannelType, setSelectedChannelType] = useState<typeof CHANNEL_PRESETS[0] | null>(null);
    const [channelName, setChannelName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    // Инициализация при открытии
    useEffect(() => {
        if (!isOpen) {
            // Сброс состояний при закрытии
            setStep('select');
            setSelectedChannelType(null);
            setChannelName('');
            setIsActive(true);
            setSettings({});
            setErrors({});
            setTestResult(null);
            setIsTesting(false);
        } else if (mode === 'edit' && channel) {
            // Режим редактирования - сразу форма настроек
            const channelType = CHANNEL_PRESETS.find(p => p.code === channel.code);
            setSelectedChannelType(channelType || null);
            setStep('configure');
            setChannelName(channel.name || '');
            setIsActive(channel.is_active !== false);
            setSettings(channel.settings || {});
            setTestResult(null);
        } else if (mode === 'create') {
            // Режим создания - сначала выбор типа
            setStep('select');
        }
    }, [isOpen, mode, channel]);

    // Функция для получения иконки канала
    const getChannelIcon = (code: string) => {
        switch (code) {
            case 'email':
                return <FaEnvelope className="w-5 h-5 text-blue-600" />;
            case 'whatsapp':
                return <FaWhatsapp className="w-5 h-5 text-green-600" />;
            case 'telegram':
                return <FaTelegram className="w-5 h-5 text-blue-500" />;
            default:
                return <FaBell className="w-5 h-5 text-gray-600" />;
        }
    };

    // Обработчики
    const handleChannelTypeSelect = (channelType: typeof CHANNEL_PRESETS[0]) => {
        setSelectedChannelType(channelType);
        setChannelName('');
        setSettings({});
        setErrors({});
        setTestResult(null);
        setStep('configure');
    };

    const handleBack = () => {
        setStep('select');
        setSelectedChannelType(null);
        setChannelName('');
        setSettings({});
        setErrors({});
        setTestResult(null);
    };

    const handleSettingChange = (field: string, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
        setTestResult(null);
    };

    const validateSettings = () => {
        const newErrors: Record<string, string> = {};

        if (!channelName.trim()) {
            newErrors.channelName = 'Название обязательно';
        }

        const code = mode === 'edit' ? channel?.code : selectedChannelType?.code;

        if (code === 'email') {
            if (!settings.smtp_host?.trim()) newErrors.smtp_host = 'SMTP Host обязателен';
            if (!settings.smtp_port) newErrors.smtp_port = 'SMTP Port обязателен';
            if (!settings.smtp_username?.trim()) newErrors.smtp_username = 'Username обязателен';
            if (!settings.smtp_password?.trim()) newErrors.smtp_password = 'Password обязателен';
            if (!settings.from_email?.trim()) newErrors.from_email = 'From Email обязателен';
        } else if (code === 'whatsapp') {
            if (!settings.instance_id?.trim()) newErrors.instance_id = 'Instance ID обязателен';
            if (!settings.api_token?.trim()) newErrors.api_token = 'API Token обязателен';
        } else if (code === 'telegram') {
            if (!settings.bot_token?.trim()) newErrors.bot_token = 'Bot Token обязателен';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            let result;

            if (mode === 'edit' && channel) {
                // Режим редактирования - тестируем существующий канал
                result = await onTestConnection(channel.id, settings);
            } else if (mode === 'create' && selectedChannelType) {
                // Режим создания - тестируем временные настройки
                result = await onTestConnection(selectedChannelType.code, settings);
            } else {
                throw new Error('Некорректное состояние для теста');
            }

            if (result.success) {
                setTestResult({ success: true, message: 'Подключение успешно!' });
            } else {
                setTestResult({ success: false, message: result.error || 'Ошибка подключения' });
            }
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.response?.data?.error || error.message || 'Ошибка теста'
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateSettings()) return;

        try {
            if (mode === 'edit' && channel) {
                // Режим редактирования
                await onSave({
                    id: channel.id,
                    name: channelName,
                    is_active: isActive,
                    settings: settings
                });
            } else if (mode === 'create' && selectedChannelType) {
                // Режим создания
                await onSave({
                    code: selectedChannelType.code,
                    name: channelName,
                    icon: selectedChannelType.icon,
                    is_active: isActive,
                    settings: settings
                });
            }
            onClose();
        } catch (error: any) {
            if (error.response?.data) {
                const serverErrors: Record<string, string> = {};
                Object.keys(error.response.data).forEach(key => {
                    const value = error.response.data[key];
                    serverErrors[key] = Array.isArray(value) ? value[0] : value;
                });
                setErrors(serverErrors);
            }
        }
    };

    // Рендер общих полей
    const renderCommonFields = () => {
        const channelCode = mode === 'edit' ? channel?.code : selectedChannelType?.code;
        const channelDisplayName = mode === 'edit' ? channel?.name : selectedChannelType?.name;

        return (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название канала *
                    </label>
                    <input
                        type="text"
                        value={channelName}
                        onChange={(e) => {
                            setChannelName(e.target.value);
                            if (errors.channelName) {
                                setErrors(prev => ({ ...prev, channelName: '' }));
                            }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.channelName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={mode === 'create' ? `${channelDisplayName} - Основной` : 'Название канала'}
                    />
                    {errors.channelName && <p className="mt-1 text-sm text-red-600">{errors.channelName}</p>}
                    {mode === 'create' && (
                        <p className="mt-1 text-xs text-gray-500">
                            Например: "Основная почта", "Уведомления", "Резервный бот"
                        </p>
                    )}
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                        Активен (канал будет использоваться для отправки)
                    </label>
                </div>

                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Настройки подключения</h4>
                </div>
            </>
        );
    };

    // Рендер форм для разных типов каналов
    const renderEmailForm = () => (
        <div className="space-y-4">
            {renderCommonFields()}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host *
                </label>
                <input
                    type="text"
                    value={settings.smtp_host || ''}
                    onChange={(e) => handleSettingChange('smtp_host', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.smtp_host ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="smtp.gmail.com"
                />
                {errors.smtp_host && <p className="mt-1 text-sm text-red-600">{errors.smtp_host}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Port *
                </label>
                <input
                    type="number"
                    value={settings.smtp_port || ''}
                    onChange={(e) => handleSettingChange('smtp_port', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.smtp_port ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="587"
                />
                {errors.smtp_port && <p className="mt-1 text-sm text-red-600">{errors.smtp_port}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username (Email) *
                </label>
                <input
                    type="email"
                    value={settings.smtp_username || ''}
                    onChange={(e) => handleSettingChange('smtp_username', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.smtp_username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="noreply@faida.ru"
                />
                {errors.smtp_username && <p className="mt-1 text-sm text-red-600">{errors.smtp_username}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                </label>
                <input
                    type="password"
                    value={settings.smtp_password || ''}
                    onChange={(e) => handleSettingChange('smtp_password', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.smtp_password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                />
                {errors.smtp_password && <p className="mt-1 text-sm text-red-600">{errors.smtp_password}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Email *
                </label>
                <input
                    type="email"
                    value={settings.from_email || ''}
                    onChange={(e) => handleSettingChange('from_email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.from_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="info@faida.ru"
                />
                {errors.from_email && <p className="mt-1 text-sm text-red-600">{errors.from_email}</p>}
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="use_tls"
                    checked={settings.use_tls !== false}
                    onChange={(e) => handleSettingChange('use_tls', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="use_tls" className="ml-2 text-sm text-gray-700">
                    Использовать TLS/SSL
                </label>
            </div>
        </div>
    );

    const renderWhatsAppForm = () => (
        <div className="space-y-4">
            {renderCommonFields()}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instance ID *
                </label>
                <input
                    type="text"
                    value={settings.instance_id || ''}
                    onChange={(e) => handleSettingChange('instance_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                        errors.instance_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1234567"
                />
                {errors.instance_id && <p className="mt-1 text-sm text-red-600">{errors.instance_id}</p>}
                <p className="text-xs text-gray-500 mt-1">
                    ID инстанса из личного кабинета Green API
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Token *
                </label>
                <input
                    type="text"
                    value={settings.api_token || ''}
                    onChange={(e) => handleSettingChange('api_token', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                        errors.api_token ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="abc123xyz..."
                />
                {errors.api_token && <p className="mt-1 text-sm text-red-600">{errors.api_token}</p>}
                <p className="text-xs text-gray-500 mt-1">
                    API токен из личного кабинета Green API
                </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Важно:</strong> Убедитесь что инстанс авторизован (QR код отсканирован)
                    в личном кабинете Green API.
                </p>
            </div>
        </div>
    );

    const renderTelegramForm = () => (
        <div className="space-y-4">
            {renderCommonFields()}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bot Token *
                </label>
                <input
                    type="text"
                    value={settings.bot_token || ''}
                    onChange={(e) => handleSettingChange('bot_token', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.bot_token ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
                {errors.bot_token && <p className="mt-1 text-sm text-red-600">{errors.bot_token}</p>}
                <p className="text-xs text-gray-500 mt-1">
                    Токен получен от @BotFather в Telegram
                </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800 space-y-2">
                    <p><strong>Как создать бота:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Откройте Telegram и найдите @BotFather</li>
                        <li>Отправьте команду /newbot</li>
                        <li>Следуйте инструкциям для создания бота</li>
                        <li>Скопируйте полученный токен сюда</li>
                    </ol>
                </div>
            </div>
        </div>
    );

    const renderForm = () => {
        const channelCode = mode === 'edit' ? channel?.code : selectedChannelType?.code;

        switch (channelCode) {
            case 'email':
                return renderEmailForm();
            case 'whatsapp':
                return renderWhatsAppForm();
            case 'telegram':
                return renderTelegramForm();
            default:
                return null; // Не показываем ничего если тип канала не определен
        }
    };

    // Заголовок модального окна
    const getTitle = () => {
        if (mode === 'create') {
            return 'Создание канала';
        } else {
            return 'Настройки канала';
        }
    };

    return (
        <Dialog open={isOpen} onClose={() => !isSaving && onClose()} className="relative z-50">
            <div className="fixed inset-0 bg-black bg-opacity-25" />

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                                        {mode === 'edit' && channel ? (
                                            <span className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    {getChannelIcon(channel.code)}
                                                </div>
                                                <span>{getTitle()}</span>
                                            </span>
                                        ) : mode === 'create' && step === 'select' ? (
                                            <span className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    <FaBell className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <span>{getTitle()}</span>
                                            </span>
                                        ) : mode === 'create' && step === 'configure' && selectedChannelType ? (
                                            <span className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    {getChannelIcon(selectedChannelType.code)}
                                                </div>
                                                <span>{getTitle()}</span>
                                            </span>
                                        ) : (
                                            <span>{getTitle()}</span>
                                        )}
                                    </Dialog.Title>
                                    <button
                                        onClick={() => !isSaving && onClose()}
                                        disabled={isSaving}
                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                {mode === 'create' && step === 'select' ? (
                                    // Шаг 1: Выбор типа канала
                                    <div className="space-y-3">
                                        {CHANNEL_PRESETS.map((channelType) => {
                                            const Icon = channelType.IconComponent;
                                            return (
                                                <button
                                                    key={channelType.code}
                                                    onClick={() => handleChannelTypeSelect(channelType)}
                                                    className="w-full flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                                >
                                                    <div className={`text-3xl text-${channelType.color}-600`}>
                                                        <Icon />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <h4 className="font-semibold text-gray-900">{channelType.name}</h4>
                                                        <p className="text-sm text-gray-500">{channelType.description}</p>
                                                    </div>
                                                    <FaCheck className="text-gray-400" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    // Шаг 2: Форма настроек
                                    <form onSubmit={handleSubmit}>
                                        {renderForm()}

                                        {testResult && (
                                            <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                                                testResult.success
                                                    ? 'bg-green-50 text-green-800'
                                                    : 'bg-red-50 text-red-800'
                                            }`}>
                                                {testResult.success ? (
                                                    <FaCheckCircle className="flex-shrink-0" />
                                                ) : (
                                                    <FaExclamationCircle className="flex-shrink-0" />
                                                )}
                                                <span className="text-sm">{testResult.message}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                            <button
                                                type="button"
                                                onClick={handleTestConnection}
                                                disabled={isTesting || isSaving}
                                                className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center space-x-2"
                                            >
                                                {isTesting ? (
                                                    <>
                                                        <FaSync className="animate-spin" />
                                                        <span>Тест...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaSync />
                                                        <span>Тест</span>
                                                    </>
                                                )}
                                            </button>

                                            <div className="flex space-x-3">
                                                {mode === 'create' && (
                                                    <button
                                                        type="button"
                                                        onClick={handleBack}
                                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                                        disabled={isSaving}
                                                    >
                                                        Назад
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => !isSaving && onClose()}
                                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                                    disabled={isSaving || isTesting}
                                                >
                                                    Отмена
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSaving || isTesting}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                                                >
                                                    <FaSave />
                                                    <span>{isSaving ? 'Сохранение...' : 'Сохранить'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    );
}
