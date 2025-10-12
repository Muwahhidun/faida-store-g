import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes, FaEnvelope, FaWhatsapp, FaTelegram, FaCheck } from 'react-icons/fa';

interface ChannelCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (channelData: { code: string; name: string; icon: string; is_active: boolean }, settings: Record<string, any>) => Promise<void>;
    isSaving: boolean;
}

// Предустановленные каналы
const CHANNEL_PRESETS = [
    {
        code: 'email',
        name: 'Email',
        icon: 'FaEnvelope',
        IconComponent: FaEnvelope,
        color: 'blue',
    },
    {
        code: 'whatsapp',
        name: 'WhatsApp',
        icon: 'FaWhatsapp',
        IconComponent: FaWhatsapp,
        color: 'green',
    },
    {
        code: 'telegram',
        name: 'Telegram',
        icon: 'FaTelegram',
        IconComponent: FaTelegram,
        color: 'blue',
    },
];

const ChannelCreateModal: React.FC<ChannelCreateModalProps> = ({
    isOpen,
    onClose,
    onSave,
    isSaving,
}) => {
    const [step, setStep] = useState<'select' | 'configure'>('select');
    const [selectedChannel, setSelectedChannel] = useState<typeof CHANNEL_PRESETS[0] | null>(null);
    const [customName, setCustomName] = useState('');
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Сброс при закрытии
    useEffect(() => {
        if (!isOpen) {
            setStep('select');
            setSelectedChannel(null);
            setCustomName('');
            setSettings({});
            setErrors({});
        }
    }, [isOpen]);

    const handleChannelSelect = (channel: typeof CHANNEL_PRESETS[0]) => {
        setSelectedChannel(channel);
        setCustomName('');
        setSettings({});
        setErrors({});
        setStep('configure');
    };

    const handleBack = () => {
        setStep('select');
        setSelectedChannel(null);
        setCustomName('');
        setSettings({});
        setErrors({});
    };

    const handleSettingChange = (field: string, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateSettings = () => {
        const newErrors: Record<string, string> = {};

        if (!customName.trim()) {
            newErrors.customName = 'Название обязательно';
        }

        if (selectedChannel?.code === 'email') {
            if (!settings.smtp_host?.trim()) newErrors.smtp_host = 'SMTP Host обязателен';
            if (!settings.smtp_port) newErrors.smtp_port = 'SMTP Port обязателен';
            if (!settings.smtp_username?.trim()) newErrors.smtp_username = 'Username обязателен';
            if (!settings.smtp_password?.trim()) newErrors.smtp_password = 'Password обязателен';
            if (!settings.from_email?.trim()) newErrors.from_email = 'From Email обязателен';
        } else if (selectedChannel?.code === 'whatsapp') {
            if (!settings.instance_id?.trim()) newErrors.instance_id = 'Instance ID обязателен';
            if (!settings.api_token?.trim()) newErrors.api_token = 'API Token обязателен';
        } else if (selectedChannel?.code === 'telegram') {
            if (!settings.bot_token?.trim()) newErrors.bot_token = 'Bot Token обязателен';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedChannel) return;

        if (!validateSettings()) return;

        try {
            const channelData = {
                code: selectedChannel.code,
                name: `${selectedChannel.name} - ${customName}`,
                icon: selectedChannel.icon,
                is_active: true,
            };

            await onSave(channelData, settings);
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

    const renderEmailForm = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                </label>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-500 font-medium">Email -</span>
                    <input
                        type="text"
                        value={customName}
                        onChange={(e) => {
                            setCustomName(e.target.value);
                            if (errors.customName) {
                                setErrors(prev => ({ ...prev, customName: '' }));
                            }
                        }}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.customName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Основная почта"
                    />
                </div>
                {errors.customName && <p className="mt-1 text-sm text-red-600">{errors.customName}</p>}
                <p className="mt-1 text-xs text-gray-500">
                    Например: "Основная почта", "Уведомления", "Резервная"
                </p>
            </div>

            <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Настройки SMTP</h4>

                <div className="space-y-3">
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
                            SMTP Username *
                        </label>
                        <input
                            type="text"
                            value={settings.smtp_username || ''}
                            onChange={(e) => handleSettingChange('smtp_username', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.smtp_username ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="your-email@gmail.com"
                        />
                        {errors.smtp_username && <p className="mt-1 text-sm text-red-600">{errors.smtp_username}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP Password *
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
                            placeholder="noreply@example.com"
                        />
                        {errors.from_email && <p className="mt-1 text-sm text-red-600">{errors.from_email}</p>}
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="use_tls"
                            checked={settings.use_tls !== false}
                            onChange={(e) => handleSettingChange('use_tls', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="use_tls" className="ml-2 block text-sm text-gray-700">
                            Использовать TLS
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderWhatsAppForm = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                </label>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-500 font-medium">WhatsApp -</span>
                    <input
                        type="text"
                        value={customName}
                        onChange={(e) => {
                            setCustomName(e.target.value);
                            if (errors.customName) {
                                setErrors(prev => ({ ...prev, customName: '' }));
                            }
                        }}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.customName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Основной"
                    />
                </div>
                {errors.customName && <p className="mt-1 text-sm text-red-600">{errors.customName}</p>}
            </div>

            <div className="border-t pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                        Используется сервис <strong>Green API</strong>. Получите учетные данные на{' '}
                        <a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="underline">
                            green-api.com
                        </a>
                    </p>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instance ID *
                        </label>
                        <input
                            type="text"
                            value={settings.instance_id || ''}
                            onChange={(e) => handleSettingChange('instance_id', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.instance_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="7103123456"
                        />
                        {errors.instance_id && <p className="mt-1 text-sm text-red-600">{errors.instance_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Token *
                        </label>
                        <input
                            type="text"
                            value={settings.api_token || ''}
                            onChange={(e) => handleSettingChange('api_token', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.api_token ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="abc123def456..."
                        />
                        {errors.api_token && <p className="mt-1 text-sm text-red-600">{errors.api_token}</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTelegramForm = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                </label>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-500 font-medium">Telegram -</span>
                    <input
                        type="text"
                        value={customName}
                        onChange={(e) => {
                            setCustomName(e.target.value);
                            if (errors.customName) {
                                setErrors(prev => ({ ...prev, customName: '' }));
                            }
                        }}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.customName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Основной"
                    />
                </div>
                {errors.customName && <p className="mt-1 text-sm text-red-600">{errors.customName}</p>}
            </div>

            <div className="border-t pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                        Создайте бота через <strong>@BotFather</strong> в Telegram и получите токен.
                    </p>
                </div>

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
                </div>
            </div>
        </div>
    );

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !isSaving && onClose()}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                                        {step === 'select' ? 'Выберите канал' : `Настройка ${selectedChannel?.name}`}
                                    </Dialog.Title>
                                    <button
                                        onClick={() => !isSaving && onClose()}
                                        disabled={isSaving}
                                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                {step === 'select' ? (
                                    <div className="space-y-3">
                                        {CHANNEL_PRESETS.map((channel) => {
                                            const Icon = channel.IconComponent;
                                            return (
                                                <button
                                                    key={channel.code}
                                                    onClick={() => handleChannelSelect(channel)}
                                                    className="w-full flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                                >
                                                    <div className={`text-3xl text-${channel.color}-600`}>
                                                        <Icon />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <h4 className="font-semibold text-gray-900">{channel.name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {channel.code === 'email' && 'Отправка через SMTP'}
                                                            {channel.code === 'whatsapp' && 'Отправка через Green API'}
                                                            {channel.code === 'telegram' && 'Отправка через Telegram Bot API'}
                                                        </p>
                                                    </div>
                                                    <FaCheck className="text-gray-400" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        {selectedChannel?.code === 'email' && renderEmailForm()}
                                        {selectedChannel?.code === 'whatsapp' && renderWhatsAppForm()}
                                        {selectedChannel?.code === 'telegram' && renderTelegramForm()}

                                        <div className="flex items-center justify-between space-x-3 mt-6 pt-4 border-t">
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                disabled={isSaving}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                Назад
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>Сохранение...</span>
                                                    </>
                                                ) : (
                                                    <span>Создать и сохранить</span>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ChannelCreateModal;
