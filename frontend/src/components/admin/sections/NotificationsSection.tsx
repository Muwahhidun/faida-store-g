/**
 * Полнофункциональная секция уведомлений с реальными данными из API
 */

import React, { useState } from 'react';
import {
    FaBell,
    FaEnvelope,
    FaWhatsapp,
    FaListUl,
    FaFileAlt,
    FaUsers,
    FaRandom,
    FaHistory,
    FaChartBar,
    FaSpinner,
    FaPlus,
    FaTrash,
    FaEdit,
    FaCheckCircle,
    FaExclamationTriangle,
    FaClock,
    FaSyncAlt,
    FaTimes
} from 'react-icons/fa';
import {
    useNotificationChannels,
    useNotificationContacts,
    useNotificationLogs,
    useNotificationStats,
    useCreateContact,
    useUpdateContact,
    useDeleteContact,
    useRetryNotification,
    useTestChannel
} from '../../../hooks/useNotifications';
import toast from 'react-hot-toast';
import type { NotificationContact } from '../../../types/notifications';

// Типы для табов
type Tab = 'overview' | 'channels' | 'contacts' | 'logs';

interface TabConfig {
    id: Tab;
    label: string;
    icon: React.ReactNode;
}

export const NotificationsSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const tabs: TabConfig[] = [
        { id: 'overview', label: 'Обзор', icon: <FaChartBar /> },
        { id: 'channels', label: 'Каналы', icon: <FaBell /> },
        { id: 'contacts', label: 'Контакты', icon: <FaUsers /> },
        { id: 'logs', label: 'Логи', icon: <FaHistory /> },
    ];

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="card p-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaBell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Система уведомлений</h2>
                        <p className="text-sm text-gray-600">
                            Управление каналами, контактами и просмотр логов
                        </p>
                    </div>
                </div>

                {/* Табы */}
                <div className="mt-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Контент табов */}
            <div className="card p-6">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'channels' && <ChannelsTab />}
                {activeTab === 'contacts' && <ContactsTab />}
                {activeTab === 'logs' && <LogsTab />}
            </div>
        </div>
    );
};

// ==================== OVERVIEW TAB ====================

const OverviewTab: React.FC = () => {
    const { data: stats, isLoading } = useNotificationStats();

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Статистика уведомлений</h3>

            {/* Карточки статистики */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <FaListUl className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalTypes || 0}</p>
                            <p className="text-sm text-gray-600">Типов уведомлений</p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <FaBell className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.activeChannels || 0}</p>
                            <p className="text-sm text-gray-600">Активных каналов</p>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <FaCheckCircle className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.sentThisMonth || 0}</p>
                            <p className="text-sm text-gray-600">Отправлено за месяц</p>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <FaExclamationTriangle className="w-8 h-8 text-red-600" />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {(stats?.failedCount || 0) + (stats?.retryingCount || 0)}
                            </p>
                            <p className="text-sm text-gray-600">Ошибок/Повторов</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Информация */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Доступные возможности:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start space-x-2">
                        <FaCheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>Каналы</strong> - Email, WhatsApp, можно добавить Telegram, SMS
                        </span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <FaCheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>Контакты</strong> - админы и менеджеры, которым отправляются уведомления
                        </span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <FaCheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>Логи</strong> - история всех отправок с возможностью повтора
                        </span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <FaCheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>Retry</strong> - автоматические повторные попытки при ошибках
                        </span>
                    </li>
                </ul>

                <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-gray-700">
                        💡 <strong>Совет:</strong> Для расширенных настроек (типы, шаблоны, правила) используйте{' '}
                        <a
                            href="http://localhost:8000/admin/notifications/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Django Admin →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

// ==================== CHANNELS TAB ====================

const ChannelsTab: React.FC = () => {
    const { data: channels, isLoading } = useNotificationChannels();
    const testChannel = useTestChannel();

    const handleTestChannel = async (channelId: number, channelName: string) => {
        try {
            const result = await testChannel.mutateAsync(channelId);
            if (result.success) {
                toast.success(`${channelName}: Подключение успешно!`);
            } else {
                toast.error(`${channelName}: ${result.error}`);
            }
        } catch (error: any) {
            toast.error(`Ошибка тестирования: ${error.response?.data?.error || error.message}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Каналы связи</h3>
                <a
                    href="http://localhost:8000/admin/notifications/notificationchannel/add/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm flex items-center space-x-2"
                >
                    <FaPlus className="w-3 h-3" />
                    <span>Добавить канал</span>
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channels?.map((channel) => {
                    const IconComponent = channel.code === 'email' ? FaEnvelope :
                                        channel.code === 'whatsapp' ? FaWhatsapp : FaBell;

                    return (
                        <div
                            key={channel.id}
                            className={`border rounded-lg p-4 ${
                                channel.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        channel.is_active ? 'bg-blue-100' : 'bg-gray-200'
                                    }`}>
                                        <IconComponent className={`w-5 h-5 ${
                                            channel.is_active ? 'text-blue-600' : 'text-gray-500'
                                        }`} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{channel.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            {channel.is_active ? 'Активен' : 'Отключен'}
                                        </p>
                                    </div>
                                </div>

                                {channel.code === 'whatsapp' && channel.is_active && (
                                    <button
                                        onClick={() => handleTestChannel(channel.id, channel.name)}
                                        disabled={testChannel.isPending}
                                        className="btn-secondary text-sm flex items-center space-x-2"
                                    >
                                        {testChannel.isPending ? (
                                            <FaSpinner className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <FaSyncAlt className="w-3 h-3" />
                                        )}
                                        <span>Тест</span>
                                    </button>
                                )}
                            </div>

                            {channel.code === 'whatsapp' && channel.settings?.instance_id && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-600">
                                        Instance ID: <span className="font-mono">{channel.settings.instance_id}</span>
                                    </p>
                                </div>
                            )}

                            <div className="mt-3">
                                <a
                                    href={`http://localhost:8000/admin/notifications/notificationchannel/${channel.id}/change/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                                >
                                    <FaEdit className="w-3 h-3" />
                                    <span>Настроить</span>
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>

            {(!channels || channels.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                    <FaBell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Нет настроенных каналов</p>
                </div>
            )}
        </div>
    );
};

// ==================== CONTACTS TAB (продолжение в следующем сообщении) ====================
// Файл слишком большой, продолжу во второй части
