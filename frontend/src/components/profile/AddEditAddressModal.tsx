import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import AddressMapPicker from './AddressMapPicker';
import { addressApi } from '@/api/client';
import { toast } from 'react-hot-toast';

interface AddEditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: any; // Если передан - режим редактирования
  onSuccess: () => void;
}

const AddEditAddressModal: React.FC<AddEditAddressModalProps> = ({
  isOpen,
  onClose,
  address,
  onSuccess
}) => {
  const [addressData, setAddressData] = useState({
    full_address: '',
    city: '',
    street: '',
    house: '',
    apartment: '',
    entrance: '',
    floor: '',
    comment: '',
    latitude: 42.9849,
    longitude: 47.5047,
    label: '',
    is_default: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsDataReady(false);
      return;
    }

    if (address) {
      console.log('AddEditAddressModal: Setting address data from:', address);
      const lat = typeof address.latitude === 'string' ? parseFloat(address.latitude) : (address.latitude || 42.9849);
      const lng = typeof address.longitude === 'string' ? parseFloat(address.longitude) : (address.longitude || 47.5047);
      console.log('Parsed coordinates:', { lat, lng });

      setAddressData({
        full_address: address.full_address || '',
        city: address.city || '',
        street: address.street || '',
        house: address.house || '',
        apartment: address.apartment || '',
        entrance: address.entrance || '',
        floor: address.floor || '',
        comment: address.comment || '',
        latitude: lat,
        longitude: lng,
        label: address.label || '',
        is_default: address.is_default || false
      });
      setIsDataReady(true);
    } else {
      // Сброс для нового адреса
      setAddressData({
        full_address: '',
        city: '',
        street: '',
        house: '',
        apartment: '',
        entrance: '',
        floor: '',
        comment: '',
        latitude: 42.9849,
        longitude: 47.5047,
        label: '',
        is_default: false
      });
      setIsDataReady(true);
    }
  }, [address, isOpen]);

  const handleMapAddressSelect = (data: any) => {
    setAddressData(prev => ({
      ...prev,
      full_address: data.full_address,
      city: data.city,
      street: data.street,
      house: data.house,
      latitude: data.latitude,
      longitude: data.longitude
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressData.full_address) {
      toast.error('Выберите адрес на карте');
      return;
    }

    setIsSubmitting(true);

    try {
      if (address?.id) {
        // Редактирование
        await addressApi.updateAddress(address.id, addressData);
        toast.success('Адрес успешно обновлен');
      } else {
        // Создание
        await addressApi.createAddress(addressData);
        toast.success('Адрес успешно добавлен');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении адреса');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {address ? 'Редактировать адрес' : 'Добавить адрес доставки'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Карта */}
          <div className="p-6 border-b">
            {isDataReady ? (
              <AddressMapPicker
                key={address?.id || 'new'}
                initialCoords={[addressData.latitude, addressData.longitude]}
                onAddressSelect={handleMapAddressSelect}
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-gray-600">Загрузка карты...</div>
              </div>
            )}
          </div>

          {/* Поля формы */}
          <div className="p-6 space-y-4">
            {/* Квартира, Подъезд, Этаж */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Квартира
                </label>
                <input
                  type="text"
                  value={addressData.apartment}
                  onChange={(e) => setAddressData({ ...addressData, apartment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Подъезд
                </label>
                <input
                  type="text"
                  value={addressData.entrance}
                  onChange={(e) => setAddressData({ ...addressData, entrance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Этаж
                </label>
                <input
                  type="text"
                  value={addressData.floor}
                  onChange={(e) => setAddressData({ ...addressData, floor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>
            </div>

            {/* Комментарий */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Комментарий для курьера
              </label>
              <textarea
                value={addressData.comment}
                onChange={(e) => setAddressData({ ...addressData, comment: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Код домофона, особенности подъезда и т.д."
              />
            </div>

            {/* Метка адреса */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Метка адреса
              </label>
              <select
                value={addressData.label}
                onChange={(e) => setAddressData({ ...addressData, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите метку</option>
                <option value="Дом">Дом</option>
                <option value="Работа">Работа</option>
                <option value="Другое">Другое</option>
              </select>
            </div>

            {/* Сделать основным */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_default"
                checked={addressData.is_default}
                onChange={(e) => setAddressData({ ...addressData, is_default: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                Сделать основным адресом
              </label>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !addressData.full_address}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditAddressModal;
