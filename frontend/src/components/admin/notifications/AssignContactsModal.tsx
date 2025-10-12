/**
 * Модальное окно для назначения контактов правилу
 */

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes, FaCheck } from 'react-icons/fa';
import type { NotificationRule, NotificationContact } from '../../../types/notifications';

interface AssignContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    rule: NotificationRule | null;
    contacts: NotificationContact[];
    onAssign: (ruleId: number, contactIds: number[]) => void;
    isLoading?: boolean;
}

export default function AssignContactsModal({
    isOpen,
    onClose,
    rule,
    contacts,
    onAssign,
    isLoading = false
}: AssignContactsModalProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Инициализация уже назначенных контактов
    useEffect(() => {
        if (rule) {
            setSelectedIds(rule.contacts.map(c => c.id));
        }
    }, [rule]);

    const handleToggle = (contactId: number) => {
        setSelectedIds(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const handleSubmit = () => {
        if (rule) {
            onAssign(rule.id, selectedIds);
        }
    };

    // Фильтруем контакты: показываем только те, у которых тип совпадает с типом канала в правиле
    const availableContacts = rule
        ? contacts.filter(c => c.channel_type === rule.channel.code)
        : [];

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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                                        Назначить контакты
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                {rule && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-600">Правило:</div>
                                        <div className="font-medium">{rule.notification_type.name}</div>
                                        <div className="text-sm text-gray-500">
                                            Канал: {rule.channel.name}
                                        </div>
                                    </div>
                                )}

                                {availableContacts.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Нет доступных контактов для канала "{rule?.channel.name}"
                                    </div>
                                ) : (
                                    <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                                        {availableContacts.map(contact => (
                                            <label
                                                key={contact.id}
                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                                    selectedIds.includes(contact.id)
                                                        ? 'bg-blue-50 border-blue-300'
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(contact.id)}
                                                    onChange={() => handleToggle(contact.id)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-gray-900">
                                                            {contact.name}
                                                        </span>
                                                        {!contact.is_active && (
                                                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">
                                                                Неактивен
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {contact.value}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Выбрано: {selectedIds.length} из {availableContacts.length}
                                    </span>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                            disabled={isLoading}
                                        >
                                            Отмена
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                                        >
                                            <FaCheck />
                                            <span>{isLoading ? 'Сохранение...' : 'Сохранить'}</span>
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
