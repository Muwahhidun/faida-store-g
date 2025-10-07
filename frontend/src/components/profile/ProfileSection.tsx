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

    const handleNameUpdate = async (firstName: string, lastName: string) => {
        try {
            const { profileApi } = await import('../../api/client');
            await profileApi.updateProfile({ first_name: firstName, last_name: lastName });
            onUpdate('first_name', firstName);
            onUpdate('last_name', lastName);
            showSuccess('Name updated successfully');
            setEditNameOpen(false);
        } catch (error) {
            showError('Failed to update name');
        }
    };

    const handleEmailUpdate = async (email: string) => {
        try {
            const { profileApi } = await import('../../api/client');
            await profileApi.updateProfile({ email });
            onUpdate('email', email);
            showSuccess('Email updated successfully');
            setEditEmailOpen(false);
        } catch (error) {
            showError('Failed to update email');
        }
    };

    const handlePhoneUpdate = async (phone: string) => {
        try {
            const { profileApi } = await import('../../api/client');
            await profileApi.updateProfile({ phone });
            onUpdate('phone', phone);
            showSuccess('Phone updated successfully');
            setEditPhoneOpen(false);
        } catch (error) {
            showError('Failed to update phone');
        }
    };

    const handlePasswordUpdate = async (currentPassword: string, newPassword: string) => {
        try {
            const { profileApi } = await import('../../api/client');
            await profileApi.changePassword({
                current_password: currentPassword,
                new_password: newPassword
            });
            showSuccess('Password changed successfully');
            setEditPasswordOpen(false);
        } catch (error: any) {
            showError(error.message || 'Failed to change password');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <FaUser className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="text-base font-medium text-gray-900">
                                    {userData.first_name && userData.last_name
                                        ? `${userData.first_name} ${userData.last_name}`
                                        : userData.username || 'Not specified'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditNameOpen(true)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4" />
                            <span>Edit</span>
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
                                    {userData.email || 'Not specified'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditEmailOpen(true)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4" />
                            <span>Edit</span>
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
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="text-base font-medium text-gray-900">
                                    {userData.phone || 'Not specified'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditPhoneOpen(true)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4" />
                            <span>Edit</span>
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
                                <p className="text-sm text-gray-600">Password</p>
                                <p className="text-base font-medium text-gray-900">""""""""</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditPasswordOpen(true)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4" />
                            <span>Change</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Username</p>
                        <p className="text-base font-medium text-gray-900">{userData.username}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Role</p>
                        <p className="text-base font-medium text-gray-900">
                            {userData.role === 'admin' ? 'Administrator' :
                             userData.role === 'moderator' ? 'Moderator' : 'User'}
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
