/**
 * Вкладка управления правилами уведомлений
 */

import { useState } from 'react';
import { FaToggleOn, FaToggleOff, FaExclamationTriangle, FaCheckCircle, FaEnvelope, FaWhatsapp, FaBell, FaSpinner, FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import type { NotificationRule, NotificationContact } from '../../../types/notifications';

// Хелпер для получения иконки канала
const getChannelIcon = (channelCode: string) => {
    switch (channelCode) {
        case 'email':
            return <FaEnvelope className="text-blue-600" />;
        case 'whatsapp':
            return <FaWhatsapp className="text-green-600" />;
        default:
            return null;
    }
};

interface RulesTabProps {
    rules: NotificationRule[];
    contacts: NotificationContact[];  // Оставляем для совместимости
    onToggleRule: (ruleId: number) => void;
    onAssignContacts: (ruleId: number, contactIds: number[]) => void;  // Оставляем для совместимости
    onSendTest?: (ruleId: number) => Promise<void>;
    onCreateRule: () => void;
    onEditRule: (rule: NotificationRule) => void;
    onDeleteRule: (rule: NotificationRule) => void;
    isToggling?: boolean;
    isAssigning?: boolean;  // Оставляем для совместимости
}

export default function RulesTab({
    rules,
    onToggleRule,
    onSendTest,
    onCreateRule,
    onEditRule,
    onDeleteRule,
    isToggling = false
}: RulesTabProps) {
    const [testingRuleId, setTestingRuleId] = useState<number | null>(null);
    const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set());  // По умолчанию все свернуты
    const [expandedNotificationTypes, setExpandedNotificationTypes] = useState<Set<string>>(new Set());  // По умолчанию все свернуты

    const toggleRuleExpansion = (ruleId: number) => {
        const newExpanded = new Set(expandedRules);
        if (newExpanded.has(ruleId)) {
            newExpanded.delete(ruleId);
        } else {
            newExpanded.add(ruleId);
        }
        setExpandedRules(newExpanded);
    };

    const toggleNotificationType = (typeCode: string) => {
        const newExpanded = new Set(expandedNotificationTypes);
        if (newExpanded.has(typeCode)) {
            newExpanded.delete(typeCode);
        } else {
            newExpanded.add(typeCode);
        }
        setExpandedNotificationTypes(newExpanded);
    };

    const handleSendTest = async (ruleId: number) => {
        if (!onSendTest) return;

        setTestingRuleId(ruleId);
        try {
            await onSendTest(ruleId);
        } finally {
            setTestingRuleId(null);
        }
    };

    // Группируем правила сначала по rule_type, затем по notification_type
    const groupedByRuleType = rules.reduce((acc, rule) => {
        const ruleType = rule.rule_type;
        if (!acc[ruleType]) {
            acc[ruleType] = {};
        }

        const typeCode = rule.notification_type.code;
        if (!acc[ruleType][typeCode]) {
            acc[ruleType][typeCode] = {
                typeName: rule.notification_type.name,
                typeDescription: rule.notification_type.description,
                rules: []
            };
        }
        acc[ruleType][typeCode].rules.push(rule);
        return acc;
    }, {} as Record<'system' | 'additional', Record<string, { typeName: string; typeDescription: string; rules: NotificationRule[] }>>);

    const systemRules = groupedByRuleType['system'] || {};
    const additionalRules = groupedByRuleType['additional'] || {};

    return (
        <div className="space-y-6">
            {/* Заголовок и кнопка создания */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Правила отправки</h3>
                <button
                    onClick={onCreateRule}
                    className="btn-primary flex items-center space-x-2"
                >
                    <FaPlus className="w-4 h-4" />
                    <span>Создать правило</span>
                </button>
            </div>

            {/* Системные уведомления */}
            {Object.keys(systemRules).length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-purple-300 to-transparent" />
                        <h2 className="text-xl font-bold text-purple-700">
                            Системные уведомления (для пользователей)
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-l from-purple-300 to-transparent" />
                    </div>

                    {Object.entries(systemRules).map(([typeCode, group]) => {
                        const isTypeExpanded = expandedNotificationTypes.has(`system-${typeCode}`);

                        return (
                            <div key={typeCode} className="bg-white border-2 border-purple-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleNotificationType(`system-${typeCode}`)}
                                    className="w-full bg-purple-50 px-6 py-4 border-b border-purple-200 hover:bg-purple-100 transition-colors text-left"
                                >
                                    <div className="flex items-center space-x-3">
                                        {isTypeExpanded ? (
                                            <FaChevronDown className="text-purple-600 w-5 h-5 flex-shrink-0" />
                                        ) : (
                                            <FaChevronRight className="text-purple-600 w-5 h-5 flex-shrink-0" />
                                        )}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{group.typeName}</h3>
                                            {group.typeDescription && (
                                                <p className="text-sm text-gray-600 mt-1">{group.typeDescription}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {isTypeExpanded && (
                                    <div className="divide-y divide-gray-200">
                        {group.rules.map(rule => {
                            const hasContacts = rule.contacts && rule.contacts.length > 0;
                            const activeContacts = rule.contacts?.filter(c => c.is_active) || [];
                            const isExpanded = expandedRules.has(rule.id);

                            return (
                                <div key={rule.id}>
                                    {/* Заголовок правила (сворачиваемый) */}
                                    <div className="flex items-center justify-between pl-12 pr-4 py-4 hover:bg-gray-50 transition-colors">
                                        <button
                                            onClick={() => toggleRuleExpansion(rule.id)}
                                            className="flex items-center space-x-3 flex-1 text-left"
                                        >
                                            {isExpanded ? (
                                                <FaChevronDown className="text-gray-500 w-4 h-4 flex-shrink-0" />
                                            ) : (
                                                <FaChevronRight className="text-gray-500 w-4 h-4 flex-shrink-0" />
                                            )}
                                            <span className="text-xl flex-shrink-0">{getChannelIcon(rule.channel.code)}</span>
                                            <div className="min-w-0">
                                                <h4 className="font-medium text-gray-900">
                                                    {rule.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Канал: {rule.channel.name}
                                                </p>
                                                {rule.default_template && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Шаблон: {rule.default_template.name}
                                                    </p>
                                                )}
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {rule.is_enabled ? (
                                                        <span className="inline-flex items-center text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                                                            <FaCheckCircle className="mr-1" />
                                                            Включено
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded">
                                                            Выключено
                                                        </span>
                                                    )}
                                                    {!hasContacts && (
                                                        <span className="inline-flex items-center text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                                                            <FaExclamationTriangle className="mr-1" />
                                                            Без контактов
                                                        </span>
                                                    )}
                                                    {hasContacts && (
                                                        <span className="inline-flex items-center text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                                            {rule.contacts.length} контакт(ов)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        {/* Кнопки управления в заголовке */}
                                        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                                            {hasContacts && rule.is_enabled && onSendTest && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSendTest(rule.id);
                                                    }}
                                                    disabled={testingRuleId === rule.id}
                                                    className="px-2 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                                                    title="Отправить тест"
                                                >
                                                    {testingRuleId === rule.id ? (
                                                        <FaSpinner className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <FaBell className="w-3 h-3" />
                                                    )}
                                                    <span>Тест</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleRule(rule.id);
                                                }}
                                                disabled={isToggling}
                                                className={`p-1.5 rounded transition-colors ${
                                                    rule.is_enabled
                                                        ? 'text-green-700 hover:bg-green-100'
                                                        : 'text-gray-700 hover:bg-gray-200'
                                                }`}
                                                title={rule.is_enabled ? 'Выключить' : 'Включить'}
                                            >
                                                {rule.is_enabled ? (
                                                    <FaToggleOn className="w-5 h-5" />
                                                ) : (
                                                    <FaToggleOff className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditRule(rule);
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Редактировать"
                                            >
                                                <FaEdit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteRule(rule);
                                                }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Удалить"
                                            >
                                                <FaTrash className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Детали правила (показываются при раскрытии) */}
                                    {isExpanded && (
                                        <div className="pl-12 pr-6 pb-4 pt-2 bg-gray-50">
                                            {/* Статус контактов */}
                                            {!hasContacts ? (
                                                <div className="flex items-center text-amber-600 p-3 bg-amber-50 border border-amber-200 rounded">
                                                    <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                                                    <span className="text-sm">Контакты не назначены</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 pl-16">
                                                    <div className="text-sm font-medium text-gray-700">
                                                        Получатели ({rule.contacts.length}):
                                                    </div>
                                                    <div className="space-y-1">
                                                        {rule.contacts.map(contact => (
                                                            <div
                                                                key={contact.id}
                                                                className={`text-xs px-2 py-1 rounded w-fit ${
                                                                    contact.is_active
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-gray-100 text-gray-600 line-through'
                                                                }`}
                                                            >
                                                                {contact.name} · {contact.value}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {activeContacts.length === 0 && (
                                                        <div className="text-xs text-red-600 p-2 bg-red-50 border border-red-200 rounded">
                                                            ⚠️ Все контакты неактивны - уведомления не будут отправляться
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                            </div>
                        )}
                    </div>
                );
            })}
                </div>
            )}

            {/* Дополнительные уведомления */}
            {Object.keys(additionalRules).length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-blue-300 to-transparent" />
                        <h2 className="text-xl font-bold text-blue-700">
                            Дополнительные уведомления
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-l from-blue-300 to-transparent" />
                    </div>

                    {Object.entries(additionalRules).map(([typeCode, group]) => {
                        const isTypeExpanded = expandedNotificationTypes.has(`additional-${typeCode}`);

                        return (
                            <div key={typeCode} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleNotificationType(`additional-${typeCode}`)}
                                    className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors text-left"
                                >
                                    <div className="flex items-center space-x-3">
                                        {isTypeExpanded ? (
                                            <FaChevronDown className="text-gray-500 w-5 h-5 flex-shrink-0" />
                                        ) : (
                                            <FaChevronRight className="text-gray-500 w-5 h-5 flex-shrink-0" />
                                        )}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{group.typeName}</h3>
                                            {group.typeDescription && (
                                                <p className="text-sm text-gray-600 mt-1">{group.typeDescription}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {isTypeExpanded && (
                                    <div className="divide-y divide-gray-200">
                        {group.rules.map(rule => {
                            const hasContacts = rule.contacts && rule.contacts.length > 0;
                            const activeContacts = rule.contacts?.filter(c => c.is_active) || [];
                            const isExpanded = expandedRules.has(rule.id);

                            return (
                                <div key={rule.id}>
                                    {/* Заголовок правила (сворачиваемый) */}
                                    <div className="flex items-center justify-between pl-12 pr-4 py-4 hover:bg-gray-50 transition-colors">
                                        <button
                                            onClick={() => toggleRuleExpansion(rule.id)}
                                            className="flex items-center space-x-3 flex-1 text-left"
                                        >
                                            {isExpanded ? (
                                                <FaChevronDown className="text-gray-500 w-4 h-4 flex-shrink-0" />
                                            ) : (
                                                <FaChevronRight className="text-gray-500 w-4 h-4 flex-shrink-0" />
                                            )}
                                            <span className="text-xl flex-shrink-0">{getChannelIcon(rule.channel.code)}</span>
                                            <div className="min-w-0">
                                                <h4 className="font-medium text-gray-900">
                                                    {rule.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Канал: {rule.channel.name}
                                                </p>
                                                {rule.default_template && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Шаблон: {rule.default_template.name}
                                                    </p>
                                                )}
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {rule.is_enabled ? (
                                                        <span className="inline-flex items-center text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                                                            <FaCheckCircle className="mr-1" />
                                                            Включено
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded">
                                                            Выключено
                                                        </span>
                                                    )}
                                                    {!hasContacts && (
                                                        <span className="inline-flex items-center text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                                                            <FaExclamationTriangle className="mr-1" />
                                                            Без контактов
                                                        </span>
                                                    )}
                                                    {hasContacts && (
                                                        <span className="inline-flex items-center text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                                            {rule.contacts.length} контакт(ов)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        {/* Кнопки управления в заголовке */}
                                        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                                            {hasContacts && rule.is_enabled && onSendTest && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSendTest(rule.id);
                                                    }}
                                                    disabled={testingRuleId === rule.id}
                                                    className="px-2 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                                                    title="Отправить тест"
                                                >
                                                    {testingRuleId === rule.id ? (
                                                        <FaSpinner className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <FaBell className="w-3 h-3" />
                                                    )}
                                                    <span>Тест</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleRule(rule.id);
                                                }}
                                                disabled={isToggling}
                                                className={`p-1.5 rounded transition-colors ${
                                                    rule.is_enabled
                                                        ? 'text-green-700 hover:bg-green-100'
                                                        : 'text-gray-700 hover:bg-gray-200'
                                                }`}
                                                title={rule.is_enabled ? 'Выключить' : 'Включить'}
                                            >
                                                {rule.is_enabled ? (
                                                    <FaToggleOn className="w-5 h-5" />
                                                ) : (
                                                    <FaToggleOff className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditRule(rule);
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Редактировать"
                                            >
                                                <FaEdit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteRule(rule);
                                                }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Удалить"
                                            >
                                                <FaTrash className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Детали правила (показываются при раскрытии) */}
                                    {isExpanded && (
                                        <div className="pl-12 pr-6 pb-4 pt-2 bg-gray-50">
                                            {/* Статус контактов */}
                                            {!hasContacts ? (
                                                <div className="flex items-center text-amber-600 p-3 bg-amber-50 border border-amber-200 rounded">
                                                    <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                                                    <span className="text-sm">Контакты не назначены</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 pl-16">
                                                    <div className="text-sm font-medium text-gray-700">
                                                        Получатели ({rule.contacts.length}):
                                                    </div>
                                                    <div className="space-y-1">
                                                        {rule.contacts.map(contact => (
                                                            <div
                                                                key={contact.id}
                                                                className={`text-xs px-2 py-1 rounded w-fit ${
                                                                    contact.is_active
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-gray-100 text-gray-600 line-through'
                                                                }`}
                                                            >
                                                                {contact.name} · {contact.value}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {activeContacts.length === 0 && (
                                                        <div className="text-xs text-red-600 p-2 bg-red-50 border border-red-200 rounded">
                                                            ⚠️ Все контакты неактивны - уведомления не будут отправляться
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                            </div>
                        )}
                    </div>
                );
            })}
                </div>
            )}

            {rules.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">Нет правил уведомлений</p>
                </div>
            )}

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            Правила определяют какие контакты получают уведомления каждого типа. Для каждого типа уведомления создается отдельное правило на каждый канал (Email, WhatsApp).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
