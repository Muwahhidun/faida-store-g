import React, { useState, useEffect } from 'react';
import { FaBell, FaSave, FaSpinner, FaWhatsapp, FaPlus, FaTrash, FaCheckCircle, FaPaperPlane } from 'react-icons/fa';
import { adminClient } from '../../../api/adminClient';
import toast from 'react-hot-toast';

interface WhatsAppOperator {
    id: number;
    name: string;
    phone_number: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface NotificationSettings {
    id: number;
    enable_email_notifications: boolean;
    admin_email: string;
    enable_whatsapp_notifications: boolean;
    green_api_instance_id: string;
    green_api_token: string;
    notify_on_new_order: boolean;
    notify_on_status_change: boolean;
}

/**
 * Секция уведомлений
 * Управление настройками Email и WhatsApp уведомлений
 */
export const NotificationsSection: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);

    // Настройки уведомлений
    const [settings, setSettings] = useState<NotificationSettings | null>(null);

    // Операторы WhatsApp
    const [operators, setOperators] = useState<WhatsAppOperator[]>([]);
    const [newOperatorName, setNewOperatorName] = useState('');
    const [newOperatorPhone, setNewOperatorPhone] = useState('');
    const [addingOperator, setAddingOperator] = useState(false);

    // Загрузка данных
    const loadData = async () => {
        try {
            setLoading(true);

            // Загружаем настройки
            const settingsResponse = await adminClient.get('/notification-settings/');
            setSettings(settingsResponse.data);

            // Загружаем операторов
            const operatorsResponse = await adminClient.get('/whatsapp-operators/');
            setOperators(operatorsResponse.data);
        } catch (err) {
            toast.error('Ошибка загрузки данных уведомлений');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Сохранение настроек
    const handleSaveSettings = async () => {
        if (!settings) return;

        setSaveLoading(true);
        try {
            await adminClient.patch(`/notification-settings/${settings.id}/`, {
                enable_email_notifications: settings.enable_email_notifications,
                admin_email: settings.admin_email,
                enable_whatsapp_notifications: settings.enable_whatsapp_notifications,
                green_api_instance_id: settings.green_api_instance_id,
                green_api_token: settings.green_api_token,
                notify_on_new_order: settings.notify_on_new_order,
                notify_on_status_change: settings.notify_on_status_change,
            });
            toast.success('Настройки уведомлений сохранены!');
            loadData();
        } catch (err) {
            toast.error('Ошибка при сохранении настроек');
            console.error(err);
        } finally {
            setSaveLoading(false);
        }
    };

    // Добавление оператора
    const handleAddOperator = async () => {
        if (!newOperatorName.trim() || !newOperatorPhone.trim()) {
            toast.error('Заполните имя и телефон оператора');
            return;
        }

        setAddingOperator(true);
        try {
            await adminClient.post('/whatsapp-operators/', {
                name: newOperatorName,
                phone_number: newOperatorPhone,
                is_active: true,
            });
            toast.success('Оператор добавлен!');
            setNewOperatorName('');
            setNewOperatorPhone('');
            loadData();
        } catch (err) {
            toast.error('Ошибка при добавлении оператора');
            console.error(err);
        } finally {
            setAddingOperator(false);
        }
    };

    // Удаление оператора
    const handleDeleteOperator = async (id: number) => {
        if (!confirm('Удалить этого оператора?')) return;

        try {
            await adminClient.delete(`/whatsapp-operators/${id}/`);
            toast.success('Оператор удален');
            loadData();
        } catch (err) {
            toast.error('Ошибка при удалении оператора');
            console.error(err);
        }
    };

    // Переключение активности оператора
    const handleToggleOperator = async (operator: WhatsAppOperator) => {
        try {
            await adminClient.patch(`/whatsapp-operators/${operator.id}/`, {
                is_active: !operator.is_active,
            });
            toast.success(`Оператор ${!operator.is_active ? 'активирован' : 'деактивирован'}`);
            loadData();
        } catch (err) {
            toast.error('Ошибка при изменении статуса оператора');
            console.error(err);
        }
    };

    // Тестовая отправка
    const handleTestWhatsApp = async () => {
        if (!settings?.enable_whatsapp_notifications) {
            toast.error('WhatsApp уведомления отключены');
            return;
        }

        if (operators.filter(op => op.is_active).length === 0) {
            toast.error('Нет активных операторов для тестовой отправки');
            return;
        }

        setTestLoading(true);
        try {
            // Отправляем тестовое сообщение всем активным операторам
            const activeOperators = operators.filter(op => op.is_active);

            for (const operator of activeOperators) {
                await adminClient.post('/notification-settings/test_whatsapp/', {
                    phone_number: operator.phone_number,
                    message: `Тестовое сообщение от Faida Group Store\n\nОператор: ${operator.name}\nВремя: ${new Date().toLocaleString('ru-RU')}`,
                });
            }

            toast.success(`Тестовое сообщение отправлено ${activeOperators.length} операторам!`);
        } catch (err) {
            toast.error('Ошибка при отправке тестового сообщения');
            console.error(err);
        } finally {
            setTestLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card p-6">
                <div className="flex items-center justify-center py-12">
                    <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="card p-6">
                <p className="text-red-600">Ошибка загрузки настроек</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Основные настройки */}
            <div className="card p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaBell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Настройки уведомлений</h2>
                        <p className="text-sm text-gray-600">Управление Email и WhatsApp уведомлениями</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Email настройки */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Email уведомления</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Включить Email уведомления
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        Отправка уведомлений на email администратора
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.enable_email_notifications}
                                        onChange={(e) => setSettings({...settings, enable_email_notifications: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email администратора
                                </label>
                                <input
                                    type="email"
                                    value={settings.admin_email}
                                    onChange={(e) => setSettings({...settings, admin_email: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="admin@faida.ru"
                                />
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp настройки */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
                            <FaWhatsapp className="text-green-600" />
                            <span>WhatsApp уведомления (Green API)</span>
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Включить WhatsApp уведомления
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        Отправка уведомлений операторам в WhatsApp
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.enable_whatsapp_notifications}
                                        onChange={(e) => setSettings({...settings, enable_whatsapp_notifications: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Instance ID
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.green_api_instance_id}
                                        onChange={(e) => setSettings({...settings, green_api_instance_id: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="1103108965"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        API Token
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.green_api_token}
                                        onChange={(e) => setSettings({...settings, green_api_token: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-xs"
                                        placeholder="API Token..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Настройки типов уведомлений */}
                    <div className="pb-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Типы уведомлений</h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Уведомлять о новых заказах
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        Отправлять уведомление при создании нового заказа
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.notify_on_new_order}
                                        onChange={(e) => setSettings({...settings, notify_on_new_order: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Уведомлять о смене статуса заказа
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        Отправлять уведомление при изменении статуса заказа
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.notify_on_status_change}
                                        onChange={(e) => setSettings({...settings, notify_on_status_change: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex space-x-3">
                        <button
                            onClick={handleSaveSettings}
                            disabled={saveLoading}
                            className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center space-x-2 ${
                                saveLoading ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                        >
                            {saveLoading ? (
                                <>
                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                    <span>Сохранение...</span>
                                </>
                            ) : (
                                <>
                                    <FaSave className="w-4 h-4" />
                                    <span>Сохранить настройки</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleTestWhatsApp}
                            disabled={testLoading || !settings.enable_whatsapp_notifications}
                            className={`px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center space-x-2 ${
                                testLoading || !settings.enable_whatsapp_notifications ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                        >
                            {testLoading ? (
                                <>
                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                    <span>Отправка...</span>
                                </>
                            ) : (
                                <>
                                    <FaPaperPlane className="w-4 h-4" />
                                    <span>Тест</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Операторы WhatsApp */}
            <div className="card p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Операторы WhatsApp</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Список операторов, которые будут получать уведомления в WhatsApp
                </p>

                {/* Форма добавления оператора */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Добавить оператора</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            value={newOperatorName}
                            onChange={(e) => setNewOperatorName(e.target.value)}
                            placeholder="Имя оператора"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                            type="text"
                            value={newOperatorPhone}
                            onChange={(e) => setNewOperatorPhone(e.target.value)}
                            placeholder="+7 (999) 123-45-67"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handleAddOperator}
                        disabled={addingOperator}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center space-x-2"
                    >
                        {addingOperator ? (
                            <FaSpinner className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <FaPlus className="w-4 h-4" />
                                <span>Добавить оператора</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Список операторов */}
                <div className="space-y-2">
                    {operators.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                            Операторы не добавлены
                        </p>
                    ) : (
                        operators.map((operator) => (
                            <div
                                key={operator.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                    operator.is_active
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <FaWhatsapp
                                        className={`w-5 h-5 ${
                                            operator.is_active ? 'text-green-600' : 'text-gray-400'
                                        }`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {operator.name}
                                        </p>
                                        <p className="text-xs text-gray-600">{operator.phone_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleToggleOperator(operator)}
                                        className={`p-2 rounded-lg ${
                                            operator.is_active
                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                                        }`}
                                        title={operator.is_active ? 'Деактивировать' : 'Активировать'}
                                    >
                                        <FaCheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteOperator(operator.id)}
                                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg"
                                        title="Удалить"
                                    >
                                        <FaTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
