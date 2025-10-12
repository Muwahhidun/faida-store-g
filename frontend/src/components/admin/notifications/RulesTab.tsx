/**
 * Вкладка управления правилами уведомлений
 */

import { useState } from 'react';
import { FaToggleOn, FaToggleOff, FaUserPlus, FaExclamationTriangle, FaCheckCircle, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import type { NotificationRule, NotificationContact } from '../../../types/notifications';
import AssignContactsModal from './AssignContactsModal';
import toast from 'react-hot-toast';

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
    contacts: NotificationContact[];
    onToggleRule: (ruleId: number) => void;
    onAssignContacts: (ruleId: number, contactIds: number[]) => void;
    isToggling?: boolean;
    isAssigning?: boolean;
}

export default function RulesTab({
    rules,
    contacts,
    onToggleRule,
    onAssignContacts,
    isToggling = false,
    isAssigning = false
}: RulesTabProps) {
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);

    const handleOpenAssignModal = (rule: NotificationRule) => {
        setSelectedRule(rule);
        setAssignModalOpen(true);
    };

    const handleAssign = (ruleId: number, contactIds: number[]) => {
        onAssignContacts(ruleId, contactIds);
        setAssignModalOpen(false);
        setSelectedRule(null);
    };

    // Группируем правила по типу уведомления
    const groupedRules = rules.reduce((acc, rule) => {
        const typeCode = rule.notification_type.code;
        if (!acc[typeCode]) {
            acc[typeCode] = {
                typeName: rule.notification_type.name,
                typeDescription: rule.notification_type.description,
                rules: []
            };
        }
        acc[typeCode].rules.push(rule);
        return acc;
    }, {} as Record<string, { typeName: string; typeDescription: string; rules: NotificationRule[] }>);

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>Правила</strong> определяют какие контакты получают уведомления каждого типа.
                            Для каждого типа уведомления создается отдельное правило на каждый канал (Email, WhatsApp).
                        </p>
                    </div>
                </div>
            </div>

            {Object.entries(groupedRules).map(([typeCode, group]) => (
                <div key={typeCode} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">{group.typeName}</h3>
                        {group.typeDescription && (
                            <p className="text-sm text-gray-600 mt-1">{group.typeDescription}</p>
                        )}
                    </div>

                    <div className="divide-y divide-gray-200">
                        {group.rules.map(rule => {
                            const hasContacts = rule.contacts && rule.contacts.length > 0;
                            const activeContacts = rule.contacts?.filter(c => c.is_active) || [];

                            return (
                                <div key={rule.id} className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Канал */}
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className="text-2xl">{getChannelIcon(rule.channel.code)}</span>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">
                                                        {rule.channel.name}
                                                    </h4>
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
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Статус контактов */}
                                            <div className="ml-11">
                                                {!hasContacts ? (
                                                    <div className="flex items-center text-amber-600">
                                                        <FaExclamationTriangle className="mr-2" />
                                                        <span className="text-sm">Контакты не назначены</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="text-sm text-gray-600">
                                                            Получатели ({rule.contacts.length}):
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {rule.contacts.map(contact => (
                                                                <span
                                                                    key={contact.id}
                                                                    className={`text-xs px-2 py-1 rounded ${
                                                                        contact.is_active
                                                                            ? 'bg-blue-100 text-blue-800'
                                                                            : 'bg-gray-100 text-gray-600 line-through'
                                                                    }`}
                                                                >
                                                                    {contact.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {activeContacts.length === 0 && (
                                                            <div className="text-xs text-red-600 mt-1">
                                                                ⚠️ Все контакты неактивны - уведомления не будут отправляться
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Кнопки управления */}
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => handleOpenAssignModal(rule)}
                                                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                <FaUserPlus />
                                                <span>Назначить</span>
                                            </button>
                                            <button
                                                onClick={() => onToggleRule(rule.id)}
                                                disabled={isToggling}
                                                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg ${
                                                    rule.is_enabled
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                                title={rule.is_enabled ? 'Выключить' : 'Включить'}
                                            >
                                                {rule.is_enabled ? (
                                                    <FaToggleOn className="text-xl" />
                                                ) : (
                                                    <FaToggleOff className="text-xl" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {rules.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">Нет правил уведомлений</p>
                </div>
            )}

            <AssignContactsModal
                isOpen={assignModalOpen}
                onClose={() => {
                    setAssignModalOpen(false);
                    setSelectedRule(null);
                }}
                rule={selectedRule}
                contacts={contacts}
                onAssign={handleAssign}
                isLoading={isAssigning}
            />
        </div>
    );
}
