import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaStar } from 'react-icons/fa';
import { addressApi } from '@/api/client';
import { toast } from 'react-hot-toast';
import AddEditAddressModal from './AddEditAddressModal';
import DeleteAddressModal from './DeleteAddressModal';

const AddressesSection: React.FC = () => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<any>(null);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await addressApi.getAddresses();
      setAddresses(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки адресов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (address: any) => {
    setDeletingAddress(address);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAddress) return;

    try {
      await addressApi.deleteAddress(deletingAddress.id);
      toast.success('Адрес успешно удален');
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении адреса');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressApi.setDefaultAddress(id);
      toast.success('Адрес установлен как основной');
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при установке основного адреса');
    }
  };

  const formatAddress = (address: any) => {
    const parts = [address.full_address];

    if (address.apartment) {
      parts.push(`кв. ${address.apartment}`);
    }
    if (address.entrance) {
      parts.push(`подъезд ${address.entrance}`);
    }
    if (address.floor) {
      parts.push(`этаж ${address.floor}`);
    }

    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Загрузка адресов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок и кнопка добавления (только если есть адреса) */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Мои адреса доставки</h3>
        {addresses.length > 0 && (
          <button
            onClick={handleAddAddress}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FaPlus className="w-4 h-4" />
            <span>Добавить адрес</span>
          </button>
        )}
      </div>

      {/* Список адресов */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaMapMarkerAlt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">У вас пока нет сохраненных адресов</p>
          <button
            onClick={handleAddAddress}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Добавить первый адрес
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-4 border rounded-lg ${
                address.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Метка и иконка основного адреса */}
                  <div className="flex items-center space-x-2 mb-2">
                    <FaMapMarkerAlt className={address.is_default ? 'text-blue-600' : 'text-gray-400'} />
                    {address.label && (
                      <span className="text-sm font-medium text-gray-700">{address.label}</span>
                    )}
                    {address.is_default && (
                      <span className="flex items-center space-x-1 text-xs text-blue-600">
                        <FaStar className="w-3 h-3" />
                        <span>Основной</span>
                      </span>
                    )}
                  </div>

                  {/* Адрес */}
                  <p className="text-gray-900 mb-1">{formatAddress(address)}</p>

                  {/* Комментарий */}
                  {address.comment && (
                    <p className="text-sm text-gray-600">
                      Примечание: {address.comment}
                    </p>
                  )}
                </div>

                {/* Кнопки действий */}
                <div className="flex items-center space-x-2 ml-4">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition"
                      title="Сделать основным"
                    >
                      <FaStar className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition"
                    title="Редактировать"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(address)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                    title="Удалить"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка добавления/редактирования */}
      <AddEditAddressModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        address={editingAddress}
        onSuccess={loadAddresses}
      />

      {/* Модалка подтверждения удаления */}
      <DeleteAddressModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAddress(null);
        }}
        onConfirm={handleDeleteConfirm}
        addressName={deletingAddress?.full_address || ''}
      />
    </div>
  );
};

export default AddressesSection;
