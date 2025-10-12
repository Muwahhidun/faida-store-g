/**
 * Полнофункциональная секция уведомлений с реальными данными из API
 */

import React, { useState } from 'react';
import {
    FaBell,
    FaEnvelope,
    FaWhatsapp,
    FaTelegram,
    FaListUl,
    FaUsers,
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
    FaRoute,
    FaFileAlt
} from 'react-icons/fa';
import {
    useNotificationChannels,
    useNotificationContacts,
    useNotificationLogs,
    useNotificationStats,
    useNotificationRules,
    useCreateContact,
    useUpdateContact,
    useDeleteContact,
    useRetryNotification,
    useTestChannel,
    useSendTestMessage,
    useAssignContacts,
    useToggleRule,
    useUpdateChannelSettings,
    useUpdateChannel,
    useCreateChannel,
    useDeleteChannel,
    useCreateTemplate,
    useUpdateTemplate,
    useTestChannelPreview,
    useSendTestToRule,
    useCreateRule,
    useUpdateRule,
    useDeleteRule
} from '../../../hooks/useNotifications';
import toast from 'react-hot-toast';
import type { NotificationContact, NotificationTemplate, NotificationRule } from '../../../types/notifications';
import { ContactFormModal } from '../notifications/ContactFormModal';
import { TemplateFormModal } from '../notifications/TemplateFormModal';
import { RuleFormModal } from '../notifications/RuleFormModal';
import RulesTab from '../notifications/RulesTab';
import ChannelModal from '../notifications/ChannelModal';
import TemplatesTab from '../notifications/TemplatesTab';
import DeleteConfirmModal from '../../DeleteConfirmModal';

// Типы для табов
type Tab = 'overview' | 'channels' | 'contacts' | 'templates' | 'rules' | 'logs';

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
        { id: 'templates', label: 'Шаблоны', icon: <FaFileAlt /> },
        { id: 'rules', label: 'Правила', icon: <FaRoute /> },
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
                {activeTab === 'templates' && <TemplatesTabWrapper />}
                {activeTab === 'rules' && <RulesTabWrapper />}
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
    const sendTestMessage = useSendTestMessage();
    const updateSettings = useUpdateChannelSettings();
    const updateChannel = useUpdateChannel();
    const createChannel = useCreateChannel();
    const deleteChannel = useDeleteChannel();
    const testChannelPreview = useTestChannelPreview();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
    const [deletingChannelId, setDeletingChannelId] = useState<number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [channelToDelete, setChannelToDelete] = useState<{ id: number; name: string } | null>(null);

    const handleOpenSettings = (channel: any) => {
        setSelectedChannel(channel);
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleOpenCreate = () => {
        setSelectedChannel(null);
        setModalMode('create');
        setModalOpen(true);
    };

    const handleSaveChannel = async (data: any) => {
        try {
            if (modalMode === 'edit' && data.id) {
                // Режим редактирования
                await updateChannel.mutateAsync({
                    id: data.id,
                    data: {
                        name: data.name,
                        is_active: data.is_active,
                        settings: data.settings
                    }
                });
                toast.success('Настройки сохранены');
            } else if (modalMode === 'create') {
                // Режим создания
                await createChannel.mutateAsync({
                    code: data.code,
                    name: data.name,
                    icon: data.icon,
                    is_active: data.is_active,
                    settings: data.settings
                });
                toast.success('Канал создан успешно!');
            }
        } catch (error: any) {
            console.error('[handleSaveChannel] Error:', error);

            // Обработка ошибок
            if (error.response?.data) {
                const errorData = error.response.data;
                if (errorData.name) {
                    toast.error(`Ошибка: ${errorData.name[0] || errorData.name}`);
                } else if (errorData.settings) {
                    toast.error(`${errorData.settings}`);
                } else if (errorData.error) {
                    toast.error(`Ошибка: ${errorData.error}`);
                } else if (typeof errorData === 'string') {
                    toast.error(errorData);
                } else {
                    toast.error('Ошибка сохранения канала. Проверьте данные.');
                }
            } else {
                toast.error(error.message || 'Ошибка сохранения канала');
            }

            throw error;
        }
    };

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

    const handleSendTest = async (channelId: number, channelName: string) => {
        try {
            const result = await sendTestMessage.mutateAsync({ channelId });
            if (result.success) {
                toast.success(`${channelName}: Отправлено ${result.sent} из ${result.total} контактов`);
            } else {
                toast.error(`${channelName}: Ошибка отправки`);
            }
        } catch (error: any) {
            toast.error(`Ошибка: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleDeleteChannel = (channelId: number, channelName: string) => {
        setChannelToDelete({ id: channelId, name: channelName });
        setDeleteModalOpen(true);
    };

    const confirmDeleteChannel = async () => {
        if (!channelToDelete) return;

        setDeletingChannelId(channelToDelete.id);
        try {
            await deleteChannel.mutateAsync(channelToDelete.id);
            toast.success(`Канал "${channelToDelete.name}" удален`);
            setDeleteModalOpen(false);
            setChannelToDelete(null);
        } catch (error: any) {
            // Обработка ошибки защищенного удаления
            const errorMessage = error.response?.data?.error || error.message || '';

            if (errorMessage.includes('protected') || errorMessage.includes('constraint') ||
                errorMessage.includes('зависим') || errorMessage.includes('связан')) {
                toast.error(
                    `Невозможно удалить канал "${channelToDelete.name}". К нему привязаны контакты или правила. ` +
                    `Сначала удалите или переназначьте их.`,
                    { duration: 6000 }
                );
            } else {
                toast.error(errorMessage || 'Ошибка удаления');
            }
            // Не закрываем модал при ошибке, чтобы пользователь увидел сообщение
        } finally {
            setDeletingChannelId(null);
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
                <button
                    onClick={handleOpenCreate}
                    className="btn-secondary text-sm flex items-center space-x-2"
                >
                    <FaPlus className="w-3 h-3" />
                    <span>Добавить канал</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channels?.map((channel) => {
                    const IconComponent = channel.code === 'email' ? FaEnvelope :
                                        channel.code === 'whatsapp' ? FaWhatsapp :
                                        channel.code === 'telegram' ? FaTelegram : FaBell;

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
                            </div>

                            <div className="mt-3 flex items-center space-x-3">
                                <button
                                    onClick={() => handleOpenSettings(channel)}
                                    className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                                >
                                    <FaEdit className="w-3 h-3" />
                                    <span>Изменить</span>
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={() => handleDeleteChannel(channel.id, channel.name)}
                                    disabled={deletingChannelId === channel.id}
                                    className="text-sm text-red-600 hover:underline flex items-center space-x-1 disabled:opacity-50"
                                >
                                    {deletingChannelId === channel.id ? (
                                        <FaSpinner className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <FaTrash className="w-3 h-3" />
                                    )}
                                    <span>Удалить</span>
                                </button>
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

            <ChannelModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedChannel(null);
                }}
                mode={modalMode}
                channel={selectedChannel}
                onSave={handleSaveChannel}
                onTestConnection={async (channelCodeOrId: string | number, settings: Record<string, any>) => {
                    try {
                        if (modalMode === 'edit' && typeof channelCodeOrId === 'number') {
                            // Режим редактирования - тестируем существующий канал
                            return await testChannel.mutateAsync(channelCodeOrId);
                        } else if (modalMode === 'create' && typeof channelCodeOrId === 'string') {
                            // Режим создания - тестируем с временными настройками
                            const result = await testChannelPreview.mutateAsync({
                                channelCode: channelCodeOrId,
                                settings
                            });
                            return result;
                        }
                        return { success: false, error: 'Некорректные параметры' };
                    } catch (error: any) {
                        return {
                            success: false,
                            error: error.response?.data?.error || error.message || 'Ошибка подключения'
                        };
                    }
                }}
                isSaving={createChannel.isPending || updateChannel.isPending}
            />

            {deleteModalOpen && channelToDelete && (
                <DeleteConfirmModal
                    title={channelToDelete.name}
                    itemType="канал"
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setChannelToDelete(null);
                    }}
                    onConfirm={confirmDeleteChannel}
                    deleting={deletingChannelId === channelToDelete.id}
                />
            )}
        </div>
    );
};

// ==================== TEMPLATES TAB ====================

const TemplatesTabWrapper: React.FC = () => {
    const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const createTemplate = useCreateTemplate();
    const updateTemplate = useUpdateTemplate();

    const handleCreate = () => {
        setEditingTemplate(null);
        setIsModalOpen(true);
    };

    const handleEdit = (template: NotificationTemplate) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleSubmit = async (data: Partial<NotificationTemplate>) => {
        try {
            if (editingTemplate) {
                await updateTemplate.mutateAsync({ id: editingTemplate.id, data });
                toast.success('Шаблон обновлен!');
            } else {
                await createTemplate.mutateAsync(data);
                toast.success('Шаблон создан!');
            }
            handleCloseModal();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка сохранения');
        }
    };

    return (
        <>
            <TemplatesTab
                onCreateTemplate={handleCreate}
                onEditTemplate={handleEdit}
            />
            {isModalOpen && (
                <TemplateFormModal
                    template={editingTemplate}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    isSubmitting={createTemplate.isPending || updateTemplate.isPending}
                />
            )}
        </>
    );
};

// ==================== CONTACTS TAB ====================

const ContactsTab: React.FC = () => {
    const { data: contacts, isLoading: contactsLoading } = useNotificationContacts();
    const { data: channels } = useNotificationChannels();
    const createContact = useCreateContact();
    const updateContact = useUpdateContact();
    const deleteContact = useDeleteContact();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<NotificationContact | null>(null);
    const [deletingContactId, setDeletingContactId] = useState<number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<{ id: number; name: string } | null>(null);

    const handleCreate = () => {
        setEditingContact(null);
        setIsModalOpen(true);
    };

    const handleEdit = (contact: NotificationContact) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContact(null);
    };

    const handleSubmit = async (data: Partial<NotificationContact>) => {
        try {
            if (editingContact) {
                await updateContact.mutateAsync({ id: editingContact.id, data });
                toast.success('Контакт обновлен!');
            } else {
                await createContact.mutateAsync(data);
                toast.success('Контакт создан!');
            }
            handleCloseModal();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка сохранения');
        }
    };

    const handleDelete = (contact: NotificationContact) => {
        setContactToDelete({ id: contact.id, name: contact.name });
        setDeleteModalOpen(true);
    };

    const confirmDeleteContact = async () => {
        if (!contactToDelete) return;

        setDeletingContactId(contactToDelete.id);
        try {
            await deleteContact.mutateAsync(contactToDelete.id);
            toast.success('Контакт удален');
            setDeleteModalOpen(false);
            setContactToDelete(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка удаления');
            // Не закрываем модал при ошибке
        } finally {
            setDeletingContactId(null);
        }
    };

    if (contactsLoading) {
        return (
            <div className="flex justify-center py-12">
                <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Контакты получателей</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Управление контактами для получения уведомлений
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="btn-primary flex items-center space-x-2"
                >
                    <FaPlus className="w-4 h-4" />
                    <span>Добавить контакт</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts?.map((contact) => {
                    const IconComponent = contact.channel_type === 'email' ? FaEnvelope :
                                        contact.channel_type === 'whatsapp' ? FaWhatsapp :
                                        contact.channel_type === 'telegram' ? FaTelegram : FaBell;

                    return (
                        <div
                            key={contact.id}
                            className={`border rounded-lg p-4 ${
                                contact.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        contact.is_active ? 'bg-blue-100' : 'bg-gray-200'
                                    }`}>
                                        <IconComponent className={`w-5 h-5 ${
                                            contact.is_active ? 'text-blue-600' : 'text-gray-500'
                                        }`} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                                        <p className="text-xs text-gray-600">{contact.channel_type_display}</p>
                                    </div>
                                </div>

                                {contact.is_active ? (
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                        Активен
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                                        Отключен
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-gray-700">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                        {contact.value}
                                    </span>
                                </p>
                            </div>

                            <div className="mt-4 flex items-center space-x-2 pt-3 border-t border-gray-200">
                                <button
                                    onClick={() => handleEdit(contact)}
                                    className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                                >
                                    <FaEdit className="w-3 h-3" />
                                    <span>Изменить</span>
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={() => handleDelete(contact)}
                                    disabled={deletingContactId === contact.id}
                                    className="text-sm text-red-600 hover:underline flex items-center space-x-1 disabled:opacity-50"
                                >
                                    {deletingContactId === contact.id ? (
                                        <FaSpinner className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <FaTrash className="w-3 h-3" />
                                    )}
                                    <span>Удалить</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {(!contacts || contacts.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                    <FaUsers className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="mb-2">Нет контактов</p>
                    <button
                        onClick={handleCreate}
                        className="text-blue-600 hover:underline text-sm"
                    >
                        Создать первый контакт
                    </button>
                </div>
            )}

            {/* Модальное окно */}
            {isModalOpen && (
                <ContactFormModal
                    contact={editingContact}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    isSubmitting={createContact.isPending || updateContact.isPending}
                />
            )}

            {deleteModalOpen && contactToDelete && (
                <DeleteConfirmModal
                    title={contactToDelete.name}
                    itemType="контакт"
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setContactToDelete(null);
                    }}
                    onConfirm={confirmDeleteContact}
                    deleting={deletingContactId === contactToDelete.id}
                />
            )}
        </div>
    );
};

// ==================== RULES TAB ====================

const RulesTabWrapper: React.FC = () => {
    const { data: rules, isLoading: rulesLoading } = useNotificationRules();
    const { data: contacts, isLoading: contactsLoading } = useNotificationContacts();
    const assignContacts = useAssignContacts();
    const toggleRule = useToggleRule();
    const sendTestToRule = useSendTestToRule();
    const createRule = useCreateRule();
    const updateRule = useUpdateRule();
    const deleteRule = useDeleteRule();

    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
    const [deletingRuleId, setDeletingRuleId] = useState<number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<{ id: number; name: string } | null>(null);

    const handleCreateRule = () => {
        setEditingRule(null);
        setIsRuleModalOpen(true);
    };

    const handleEditRule = (rule: NotificationRule) => {
        setEditingRule(rule);
        setIsRuleModalOpen(true);
    };

    const handleCloseRuleModal = () => {
        setIsRuleModalOpen(false);
        setEditingRule(null);
    };

    const handleSubmitRule = async (data: Partial<NotificationRule>) => {
        try {
            if (editingRule) {
                await updateRule.mutateAsync({ id: editingRule.id, data });
                toast.success('Правило обновлено!');
            } else {
                await createRule.mutateAsync(data);
                toast.success('Правило создано!');
            }
            handleCloseRuleModal();
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
            if (errorMessage?.includes('already exists') || errorMessage?.includes('уже существует')) {
                toast.error('Правило для этой комбинации типа уведомления и канала уже существует');
            } else {
                toast.error(errorMessage || 'Ошибка сохранения');
            }
        }
    };

    const handleDeleteRule = (rule: NotificationRule) => {
        setRuleToDelete({
            id: rule.id,
            name: `${rule.notification_type.name} - ${rule.channel.name}`
        });
        setDeleteModalOpen(true);
    };

    const confirmDeleteRule = async () => {
        if (!ruleToDelete) return;

        setDeletingRuleId(ruleToDelete.id);
        try {
            await deleteRule.mutateAsync(ruleToDelete.id);
            toast.success(`Правило удалено`);
            setDeleteModalOpen(false);
            setRuleToDelete(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка удаления');
        } finally {
            setDeletingRuleId(null);
        }
    };

    const handleToggleRule = async (ruleId: number) => {
        try {
            await toggleRule.mutateAsync(ruleId);
            toast.success('Статус правила изменен');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка изменения статуса');
        }
    };

    const handleAssignContacts = async (ruleId: number, contactIds: number[]) => {
        try {
            await assignContacts.mutateAsync({ ruleId, contactIds });
            toast.success('Контакты назначены');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка назначения контактов');
        }
    };

    const handleSendTest = async (ruleId: number) => {
        try {
            const result = await sendTestToRule.mutateAsync({ ruleId });
            if (result.success) {
                toast.success(`Тестовое сообщение отправлено: ${result.sent} из ${result.total} контактов`);
            } else {
                toast.error(`Не удалось отправить тест: ${result.failed} ошибок`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка отправки теста');
        }
    };

    if (rulesLoading || contactsLoading) {
        return (
            <div className="flex justify-center py-12">
                <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <RulesTab
                rules={rules || []}
                contacts={contacts || []}
                onToggleRule={handleToggleRule}
                onAssignContacts={handleAssignContacts}
                onSendTest={handleSendTest}
                onCreateRule={handleCreateRule}
                onEditRule={handleEditRule}
                onDeleteRule={handleDeleteRule}
                isToggling={toggleRule.isPending}
                isAssigning={assignContacts.isPending}
            />

            {isRuleModalOpen && (
                <RuleFormModal
                    rule={editingRule}
                    onClose={handleCloseRuleModal}
                    onSubmit={handleSubmitRule}
                    isSubmitting={createRule.isPending || updateRule.isPending}
                />
            )}

            {deleteModalOpen && ruleToDelete && (
                <DeleteConfirmModal
                    title={ruleToDelete.name}
                    itemType="правило"
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setRuleToDelete(null);
                    }}
                    onConfirm={confirmDeleteRule}
                    deleting={deletingRuleId === ruleToDelete.id}
                />
            )}
        </>
    );
};

// ==================== LOGS TAB ====================

const LogsTab: React.FC = () => {
    const { data: logs, isLoading } = useNotificationLogs();
    const retryNotification = useRetryNotification();

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const handleRetry = async (logId: number) => {
        try {
            await retryNotification.mutateAsync(logId);
            toast.success('Уведомление отправлено повторно!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка повторной отправки');
        }
    };

    // Фильтрация логов
    const filteredLogs = logs?.filter(log => {
        // Фильтр по статусу
        if (statusFilter !== 'all' && log.status !== statusFilter) {
            return false;
        }

        // Поиск по названию, получателю
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                log.notification_type_name.toLowerCase().includes(query) ||
                log.recipient_value.toLowerCase().includes(query) ||
                log.contact_name?.toLowerCase().includes(query)
            );
        }

        return true;
    }) || [];

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
            sent: { color: 'bg-green-100 text-green-800', icon: <FaCheckCircle />, label: 'Отправлено' },
            failed: { color: 'bg-red-100 text-red-800', icon: <FaExclamationTriangle />, label: 'Ошибка' },
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: <FaClock />, label: 'Ожидает' },
            retrying: { color: 'bg-blue-100 text-blue-800', icon: <FaSyncAlt />, label: 'Повтор' },
        };

        const badge = badges[status] || badges.pending;

        return (
            <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded ${badge.color}`}>
                {badge.icon}
                <span>{badge.label}</span>
            </span>
        );
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
                <h3 className="text-lg font-semibold text-gray-900">Логи уведомлений</h3>
                <p className="text-sm text-gray-600">Обновляется каждые 30 секунд</p>
            </div>

            {/* Фильтры */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск по типу, получателю..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Все статусы</option>
                        <option value="sent">Отправлено</option>
                        <option value="pending">Ожидает</option>
                        <option value="retrying">Повтор</option>
                        <option value="failed">Ошибка</option>
                    </select>
                </div>
            </div>

            {/* Статистика по фильтрам */}
            {filteredLogs.length > 0 && (
                <p className="text-sm text-gray-600">
                    Найдено: <strong>{filteredLogs.length}</strong> {logs && logs.length !== filteredLogs.length && `из ${logs.length}`}
                </p>
            )}

            <div className="space-y-3">
                {filteredLogs.slice(0, 50).map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="font-semibold text-gray-900">{log.notification_type_name}</h4>
                                    {getStatusBadge(log.status)}
                                    <span className="text-sm text-gray-500">{log.channel_name}</span>
                                </div>

                                <p className="text-sm text-gray-600 mb-1">
                                    Получатель: <span className="font-mono">{log.contact_name || log.recipient_value}</span>
                                </p>

                                <p className="text-xs text-gray-500">
                                    {new Date(log.created_at).toLocaleString('ru-RU')}
                                </p>

                                {log.error_message && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                        <strong>Ошибка:</strong> {log.error_message}
                                    </div>
                                )}

                                {log.status === 'retrying' && log.next_retry_at && (
                                    <p className="mt-2 text-xs text-blue-600">
                                        <FaClock className="inline mr-1" />
                                        Следующая попытка: {new Date(log.next_retry_at).toLocaleString('ru-RU')}
                                    </p>
                                )}

                                {log.retry_count > 0 && (
                                    <p className="mt-1 text-xs text-gray-600">
                                        Попыток: {log.retry_count} / {log.max_retries}
                                    </p>
                                )}
                            </div>

                            {(log.status === 'failed' || log.status === 'retrying') && (
                                <button
                                    onClick={() => handleRetry(log.id)}
                                    disabled={retryNotification.isPending}
                                    className="btn-secondary text-sm flex items-center space-x-2"
                                    title="Повторить отправку"
                                >
                                    {retryNotification.isPending ? (
                                        <FaSpinner className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <FaSyncAlt className="w-3 h-3" />
                                    )}
                                    <span>Повторить</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <FaHistory className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    {!logs || logs.length === 0 ? (
                        <>
                            <p>Пока нет логов</p>
                            <p className="text-sm mt-1">Логи появятся после отправки первого уведомления</p>
                        </>
                    ) : (
                        <>
                            <p>Логи не найдены</p>
                            <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
