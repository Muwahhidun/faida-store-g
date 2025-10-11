/**
 * Новая секция уведомлений для гибкой системы
 * Управление категориями, каналами, типами, шаблонами, контактами, правилами и логами
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
    FaChartBar
} from 'react-icons/fa';

// Типы для табов
type Tab = 'overview' | 'channels' | 'types' | 'templates' | 'contacts' | 'rules' | 'logs';

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
        { id: 'types', label: 'Типы', icon: <FaListUl /> },
        { id: 'templates', label: 'Шаблоны', icon: <FaFileAlt /> },
        { id: 'contacts', label: 'Контакты', icon: <FaUsers /> },
        { id: 'rules', label: 'Правила', icon: <FaRandom /> },
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
                        <h2 className="text-lg font-semibold text-gray-900">Гибкая система уведомлений</h2>
                        <p className="text-sm text-gray-600">
                            Управление уведомлениями через категории, каналы, типы и шаблоны
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
                {activeTab === 'types' && <TypesTab />}
                {activeTab === 'templates' && <TemplatesTab />}
                {activeTab === 'contacts' && <ContactsTab />}
                {activeTab === 'rules' && <RulesTab />}
                {activeTab === 'logs' && <LogsTab />}
            </div>
        </div>
    );
};

// ==================== TAB COMPONENTS ====================

/**
 * Обзор системы уведомлений
 */
const OverviewTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Статистика уведомлений</h3>

            {/* Карточки статистики */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <FaBell className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">12</p>
                            <p className="text-sm text-gray-600">Типов уведомлений</p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <FaEnvelope className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">2</p>
                            <p className="text-sm text-gray-600">Активных каналов</p>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <FaHistory className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">156</p>
                            <p className="text-sm text-gray-600">Отправлено за месяц</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Информационный блок */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Как работает система?</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>
                        <strong>Категории</strong> - группируют типы уведомлений (Заказы, Системные)
                    </li>
                    <li>
                        <strong>Каналы</strong> - способы отправки (Email, WhatsApp, Telegram)
                    </li>
                    <li>
                        <strong>Типы</strong> - конкретные события (Новый заказ, Смена статуса)
                    </li>
                    <li>
                        <strong>Шаблоны</strong> - текст сообщений с переменными для каждого канала
                    </li>
                    <li>
                        <strong>Контакты</strong> - получатели уведомлений (админы, менеджеры)
                    </li>
                    <li>
                        <strong>Правила</strong> - связывают типы с каналами и контактами
                    </li>
                </ol>
            </div>
        </div>
    );
};

/**
 * Управление каналами
 */
const ChannelsTab: React.FC = () => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Каналы связи</h3>
            <p className="text-sm text-gray-600 mb-6">
                Каналы определяют способы отправки уведомлений
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    🚧 Этот раздел в разработке. Используйте Django Admin для управления каналами:
                    <br />
                    <a
                        href="http://localhost:8000/admin/notifications/notificationchannel/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Перейти в админку →
                    </a>
                </p>
            </div>
        </div>
    );
};

/**
 * Управление типами уведомлений
 */
const TypesTab: React.FC = () => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Типы уведомлений</h3>
            <p className="text-sm text-gray-600 mb-6">
                Типы определяют конкретные события для отправки уведомлений
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    🚧 Этот раздел в разработке. Используйте Django Admin для управления типами:
                    <br />
                    <a
                        href="http://localhost:8000/admin/notifications/notificationtype/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Перейти в админку →
                    </a>
                </p>
            </div>
        </div>
    );
};

/**
 * Управление шаблонами
 */
const TemplatesTab: React.FC = () => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Шаблоны уведомлений</h3>
            <p className="text-sm text-gray-600 mb-6">
                Шаблоны содержат текст сообщений с переменными для подстановки
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    🚧 Этот раздел в разработке. Используйте Django Admin для управления шаблонами:
                    <br />
                    <a
                        href="http://localhost:8000/admin/notifications/notificationtemplate/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Перейти в админку →
                    </a>
                </p>
            </div>
        </div>
    );
};

/**
 * Управление контактами
 */
const ContactsTab: React.FC = () => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Контакты получателей</h3>
            <p className="text-sm text-gray-600 mb-6">
                Контакты - это получатели уведомлений (email адреса, телефоны)
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    🚧 Этот раздел в разработке. Используйте Django Admin для управления контактами:
                    <br />
                    <a
                        href="http://localhost:8000/admin/notifications/notificationcontact/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Перейти в админку →
                    </a>
                </p>
            </div>
        </div>
    );
};

/**
 * Управление правилами
 */
const RulesTab: React.FC = () => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Правила отправки</h3>
            <p className="text-sm text-gray-600 mb-6">
                Правила связывают типы уведомлений с каналами и контактами
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    🚧 Этот раздел в разработке. Используйте Django Admin для управления правилами:
                    <br />
                    <a
                        href="http://localhost:8000/admin/notifications/notificationrule/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Перейти в админку →
                    </a>
                </p>
            </div>
        </div>
    );
};

/**
 * Просмотр логов уведомлений
 */
const LogsTab: React.FC = () => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Логи отправленных уведомлений</h3>
            <p className="text-sm text-gray-600 mb-6">
                История всех отправленных уведомлений с статусами
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    🚧 Этот раздел в разработке. Используйте Django Admin для просмотра логов:
                    <br />
                    <a
                        href="http://localhost:8000/admin/notifications/notificationlog/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Перейти в админку →
                    </a>
                </p>
            </div>
        </div>
    );
};
