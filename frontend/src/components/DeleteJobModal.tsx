import React, { useEffect } from 'react';
import { FaTrash, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

interface DeleteJobModalProps {
  jobTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}

/**
 * Модальное окно подтверждения удаления вакансии
 */
const DeleteJobModal: React.FC<DeleteJobModalProps> = ({ jobTitle, onClose, onConfirm, deleting }) => {
  // Обработчик ESC для закрытия модального окна
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, deleting]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaExclamationTriangle className="w-5 h-5 mr-2 text-red-600" />
            Подтверждение удаления
          </h3>
          <button
            onClick={onClose}
            disabled={deleting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Внимание!</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Вы собираетесь удалить вакансию:</p>
                  <p className="font-semibold mt-2">"{jobTitle}"</p>
                  <p className="mt-2">Это действие необратимо!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-3"
            disabled={deleting}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={deleting}
          >
            <FaTrash className="w-4 h-4 mr-2" />
            {deleting ? 'Удаление...' : 'Удалить вакансию'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteJobModal;
