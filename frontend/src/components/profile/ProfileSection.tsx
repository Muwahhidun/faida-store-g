import React, { useState } from 'react';
import { FaEdit, FaEnvelope, FaPhone, FaUser, FaKey } from 'react-icons/fa';
import { EditNameModal } from './EditNameModal';
import { EditEmailModal } from './EditEmailModal';
import { EditPhoneModal } from './EditPhoneModal';
import { EditPasswordModal } from './EditPasswordModal';

interface ProfileSectionProps {
    userData: any;
    onUpdate: (field: string, value: string) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
    userData,
    onUpdate,
    showSuccess,
    showError
}) => {
    const [editNameOpen, setEditNameOpen] = useState(false);
    const [editEmailOpen, setEditEmailOpen] = useState(false);
    const [editPhoneOpen, setEditPhoneOpen] = useState(false);
    const [editPasswordOpen, setEditPasswordOpen] = useState(false);

    // Форматирование телефона для отображения
    const formatPhoneDisplay = (phone: string): string => {
        if (!phone) return 'Не указан';

        // Убираем все нецифровые символы
        const cleaned = phone.replace(/\D/g, '');

        // Проверяем, начинается ли с 7 (российский номер)
        const number = cleaned.startsWith('7') ? cleaned.slice(1) : cleaned;

        // Форматируем: +7 (XXX) XXX-XX-XX
        if (number.length === 10) {
            return `+7 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 8)}-${number.slice(8)}`;
        }

        return phone; // Если формат не подходит, возвращаем как есть
    };

    const handleNameUpdate = async (firstName: string, lastName: string) => {
        try {
            const { profileApi } = await import('../../api/client');
            await profileApi.updateProfile({ first_name: firstName, last_name: lastName });
            onUpdate('first_name', firstName);
            onUpdate('last_name', lastName);
            showSuccess('Имя успешно обновлено');
            setEditNameOpen(false);
        } catch (error) {
            showError('Не удалось обновить имя');
        }
    };

    const handleEmailUpdate = async (email: string) => {
        try {
            const { profileApi } = await import('../../api/client');
            await profileApi.updateProfile({ email });
            onUpdate('email', email);
            showSuccess('Email успешно обновлен');
            setEditEmailOpen(false);
        } catch (error) {
            showError('Не удалось обновить email');
        }
    };

    const handlePhoneUpdate = async (phone: string) => {
        try {
            const { profileApi } = await import('../../api/client');
            await profileApi.updateProfile({ phone });
            onUpdate('phone', phone);
            showSuccess('Телефон успешно обновлен');
            setEditPhoneOpen(false);
        } catch (error) {
            showError('Не удалось обновить телефон');
        }
    };

    const handlePasswordUpdate = async (currentPassword: string, newPassword: string) => {
        try {
            const { profileApi } = await import('../../api/client');
            await profileApi.changePassword({
                current_password: currentPassword,
                new_password: newPassword
            });
            showSuccess('Пароль успешно изменен');
            setEditPasswordOpen(false);
        } catch (error: any) {
            showError(error.message || 'Не удалось изменить пароль');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Личная информация</h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <FaUser className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Имя и фамилия</p>
                                <p className="text-base font-medium text-gray-900">
                                    {userData.first_name && userData.last_name
                                        ? `${userData.first_name} ${userData.last_name}`
                                        : userData.username || 'Не указано'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditNameOpen(true)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4" />
                            <span>Изменить</span>
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <FaEnvelope className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="text-base font-medium text-gray-900">
                                    {userData.email || 'Не указан'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditEmailOpen(true)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4" />
                            <span>Изменить</span>
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <FaPhone className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Телефон</p>
                                <p className="text-base font-medium text-gray-900">
                                    {formatPhoneDisplay(userData.phone)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditPhoneOpen(true)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4" />
                            <span>Изменить</span>
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <FaKey className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Пароль</p>
                                <p className="text-base font-medium text-gray-900">••••••••</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditPasswordOpen(true)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4" />
                            <span>Изменить</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация об аккаунте</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Логин</p>
                        <p className="text-base font-medium text-gray-900">{userData.username}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Роль</p>
                        <p className="text-base font-medium text-gray-900">
                            {userData.role === 'admin' ? 'Администратор' :
                             userData.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                        </p>
                    </div>
                </div>
            </div>

            {editNameOpen && (
                <EditNameModal
                    currentFirstName={userData.first_name || ''}
                    currentLastName={userData.last_name || ''}
                    onSave={handleNameUpdate}
                    onClose={() => setEditNameOpen(false)}
                />
            )}

            {editEmailOpen && (
                <EditEmailModal
                    currentEmail={userData.email || ''}
                    onSave={handleEmailUpdate}
                    onClose={() => setEditEmailOpen(false)}
                />
            )}

            {editPhoneOpen && (
                <EditPhoneModal
                    currentPhone={userData.phone || ''}
                    onSave={handlePhoneUpdate}
                    onClose={() => setEditPhoneOpen(false)}
                />
            )}

            {editPasswordOpen && (
                <EditPasswordModal
                    onSave={handlePasswordUpdate}
                    onClose={() => setEditPasswordOpen(false)}
                />
            )}
        </div>
    );
};
