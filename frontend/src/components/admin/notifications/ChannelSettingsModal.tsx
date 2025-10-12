/**
 * Модальное окно для настройки каналов уведомлений
 */

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes, FaSave, FaSync, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import type { NotificationChannel } from '../../../types/notifications';

interface ChannelSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel: NotificationChannel | null;
    onSave: (channelId: number, settings: Record<string, any>) => Promise<void>;
    onTestConnection: (channelId: number) => Promise<any>;
    isSaving?: boolean;
}

export default function ChannelSettingsModal({
    isOpen,
    onClose,
    channel,
    onSave,
    onTestConnection,
    isSaving = false
}: ChannelSettingsModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (channel) {
            setFormData(channel.settings || {});
            setTestResult(null);
        }
    }, [channel]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setTestResult(null); // Сбрасываем результат теста при изменении
    };

    const handleTest = async () => {
        if (!channel) return;

        setIsTesting(true);
        setTestResult(null);

        try {
            // Сначала сохраняем настройки
            await onSave(channel.id, formData);

            // Затем тестируем подключение
            const result = await onTestConnection(channel.id);

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

    const handleSubmit = async () => {
        if (!channel) return;
        await onSave(channel.id, formData);
        onClose();
    };

    const renderEmailForm = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host *
                </label>
                <input
                    type="text"
                    value={formData.smtp_host || ''}
                    onChange={(e) => handleChange('smtp_host', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.gmail.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Port *
                </label>
                <input
                    type="number"
                    value={formData.smtp_port || ''}
                    onChange={(e) => handleChange('smtp_port', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username (Email) *
                </label>
                <input
                    type="email"
                    value={formData.smtp_username || ''}
                    onChange={(e) => handleChange('smtp_username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="noreply@faida.ru"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                </label>
                <input
                    type="password"
                    value={formData.smtp_password || ''}
                    onChange={(e) => handleChange('smtp_password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Email *
                </label>
                <input
                    type="email"
                    value={formData.from_email || ''}
                    onChange={(e) => handleChange('from_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="info@faida.ru"
                />
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="use_tls"
                    checked={formData.use_tls !== false}
                    onChange={(e) => handleChange('use_tls', e.target.checked)}
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
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instance ID *
                </label>
                <input
                    type="text"
                    value={formData.instance_id || ''}
                    onChange={(e) => handleChange('instance_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="1234567"
                />
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
                    value={formData.api_token || ''}
                    onChange={(e) => handleChange('api_token', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="abc123xyz..."
                />
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
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bot Token *
                </label>
                <input
                    type="text"
                    value={formData.bot_token || ''}
                    onChange={(e) => handleChange('bot_token', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
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
        if (!channel) return null;

        switch (channel.code) {
            case 'email':
                return renderEmailForm();
            case 'whatsapp':
                return renderWhatsAppForm();
            case 'telegram':
                return renderTelegramForm();
            default:
                return <p className="text-gray-500">Настройки для этого канала не поддерживаются</p>;
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                                        {channel && (
                                            <span className="flex items-center space-x-2">
                                                <span className="text-2xl">{channel.icon}</span>
                                                <span>Настройка {channel.name}</span>
                                            </span>
                                        )}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

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
                                        onClick={handleTest}
                                        disabled={isTesting || isSaving}
                                        className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center space-x-2"
                                    >
                                        {isTesting ? (
                                            <>
                                                <FaSync className="animate-spin" />
                                                <span>Тестирование...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaSync />
                                                <span>Тест подключения</span>
                                            </>
                                        )}
                                    </button>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                            disabled={isSaving || isTesting}
                                        >
                                            Отмена
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSaving || isTesting}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                                        >
                                            <FaSave />
                                            <span>{isSaving ? 'Сохранение...' : 'Сохранить'}</span>
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
