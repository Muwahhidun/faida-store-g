import React, { useState, useEffect } from 'react';
import {
    FaUsers, FaPlus, FaEdit, FaTrash, FaSearch, FaCheckCircle, FaTimesCircle, FaTimes
} from 'react-icons/fa';
import { User } from '../../../types/admin';
import { adminClient } from '../../../api/adminClient';
import { CustomSelect } from '../../CustomSelect';

interface UsersSectionProps {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
    onUsersCountChange: (count: number) => void;
}

/**
 * Секция управления пользователями
 * Отображает список пользователей, позволяет создавать, редактировать и удалять
 */
export const UsersSection: React.FC<UsersSectionProps> = ({
    onError,
    onSuccess,
    onUsersCountChange
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await adminClient.get('/users-management/');
            const usersData = Array.isArray(response.data)
                ? response.data
                : response.data.results || [];
            setUsers(usersData);

            // Обновляем счетчик
            const totalCount = response.data.count || usersData.length;
            onUsersCountChange(totalCount);
        } catch (err: any) {
            onError('Ошибка загрузки пользователей');
            console.error('Load users error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Никогда';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'moderator':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const handleCreateUser = () => {
        setShowCreateModal(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
    };

    const handleDeleteUser = (user: User) => {
        setDeletingUser(user);
    };

    const handleConfirmDelete = async () => {
        if (!deletingUser) return;

        try {
            await adminClient.delete(`/users-management/${deletingUser.id}/`);
            onSuccess(`Пользователь "${deletingUser.username}" успешно удален.`);
            loadUsers();
            setDeletingUser(null);
        } catch (err: any) {
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось удалить пользователя.';
            onError(`Ошибка: ${errorMessage}`);
        }
    };

    return (
        <>
            {/* Модалы будут добавлены позже */}
            {showCreateModal && (
                <UserModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={async (userData) => {
                        try {
                            await adminClient.post('/users-management/', userData);
                            onSuccess('Пользователь успешно создан.');
                            loadUsers();
                            setShowCreateModal(false);
                        } catch (err: any) {
                            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось создать пользователя.';
                            onError(`Ошибка: ${errorMessage}`);
                            throw err;
                        }
                    }}
                />
            )}

            {editingUser && (
                <UserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={async (userData) => {
                        try {
                            await adminClient.patch(`/users-management/${editingUser.id}/`, userData);
                            onSuccess('Пользователь успешно обновлен.');
                            loadUsers();
                            setEditingUser(null);
                        } catch (err: any) {
                            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось обновить пользователя.';
                            onError(`Ошибка: ${errorMessage}`);
                            throw err;
                        }
                    }}
                />
            )}

            {deletingUser && (
                <DeleteUserModal
                    user={deletingUser}
                    onClose={() => setDeletingUser(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}

            <div className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaUsers className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-gray-900">Пользователи</h2>
                            <p className="text-sm text-gray-600 truncate">Управление пользователями системы</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateUser}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center space-x-2 flex-shrink-0"
                    >
                        <FaPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Создать пользователя</span>
                        <span className="sm:hidden">Создать</span>
                    </button>
                </div>

                {/* Фильтры */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Поиск по имени, email, логину..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <CustomSelect
                        value={roleFilter}
                        onChange={setRoleFilter}
                        options={[
                            { value: 'all', label: 'Все роли' },
                            { value: 'admin', label: 'Администраторы' },
                            { value: 'moderator', label: 'Модераторы' },
                            { value: 'user', label: 'Пользователи' }
                        ]}
                        className="min-w-[180px]"
                    />
                </div>

                {/* Список пользователей */}
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Загрузка...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                        <FaUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Пользователи не найдены</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Пользователь
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Роль
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Статус
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Дата регистрации
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Последний вход
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Действия
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.username}
                                                </div>
                                                {(user.first_name || user.last_name) && (
                                                    <div className="text-sm text-gray-500">
                                                        {user.first_name} {user.last_name}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.email}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                                                {user.role_display}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {user.is_active ? (
                                                <span className="flex items-center text-sm text-green-600">
                                                    <FaCheckCircle className="w-4 h-4 mr-1" />
                                                    Активен
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-sm text-red-600">
                                                    <FaTimesCircle className="w-4 h-4 mr-1" />
                                                    Неактивен
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(user.date_joined)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(user.last_login)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Редактировать"
                                                >
                                                    <FaEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Удалить"
                                                >
                                                    <FaTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

/**
 * Модальное окно для создания/редактирования пользователя
 */
interface UserModalProps {
    user?: User;
    onClose: () => void;
    onSave: (userData: Partial<User> & { password?: string }) => Promise<void>;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        role: user?.role || 'user',
        is_active: user?.is_active ?? true,
        password: '',
    });
    const [saving, setSaving] = useState(false);

    // Обработчик Escape для закрытия модального окна
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, saving]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dataToSave: any = { ...formData };
            // Не отправляем пароль если он пустой при редактировании
            if (user && !dataToSave.password) {
                delete dataToSave.password;
            }
            await onSave(dataToSave);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black opacity-30"></div>
                <div
                    className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Кнопка закрытия */}
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        aria-label="Закрыть"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>

                    <h3 className="text-lg font-semibold mb-4">
                        {user ? 'Редактировать пользователя' : 'Создать пользователя'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Логин *
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Пароль {user ? '' : '*'}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required={!user}
                                placeholder={user ? 'Оставьте пустым, чтобы не менять' : ''}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Имя
                            </label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Фамилия
                            </label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <CustomSelect
                                value={formData.role}
                                onChange={(value) => setFormData({ ...formData, role: value as any })}
                                options={[
                                    { value: 'user', label: 'Пользователь' },
                                    { value: 'moderator', label: 'Модератор' },
                                    { value: 'admin', label: 'Администратор' }
                                ]}
                                label="Роль *"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                Активен
                            </label>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                disabled={saving}
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                disabled={saving}
                            >
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

/**
 * Модальное окно подтверждения удаления пользователя
 */
interface DeleteUserModalProps {
    user: User;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onClose, onConfirm }) => {
    const [deleting, setDeleting] = useState(false);

    // Обработчик Escape для закрытия модального окна
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !deleting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, deleting]);

    const handleConfirm = async () => {
        setDeleting(true);
        try {
            await onConfirm();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black opacity-30"></div>
                <div
                    className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Кнопка закрытия */}
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        aria-label="Закрыть"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>

                    <h3 className="text-lg font-semibold mb-4 text-red-600">
                        Удалить пользователя?
                    </h3>
                    <p className="text-gray-700 mb-6">
                        Вы уверены, что хотите удалить пользователя <strong>{user.username}</strong>?
                        Это действие нельзя отменить.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={deleting}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                            disabled={deleting}
                        >
                            {deleting ? 'Удаление...' : 'Удалить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
