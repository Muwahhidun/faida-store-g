import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { FaShoppingCart, FaUser, FaPhone, FaMapMarkerAlt, FaComment, FaCreditCard, FaArrowLeft, FaPlus, FaMoneyBillWave, FaGlobe } from 'react-icons/fa';
import toast from 'react-hot-toast';
import OrderStepper from '../components/OrderStepper';
import AddEditAddressModal from '../components/profile/AddEditAddressModal';
import { addressApi } from '../api/client';

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { items: cart, clearCart } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_address: '',
        comment: '',
        payment_method: 'cash_on_delivery' as 'cash_on_delivery' | 'card_on_delivery' | 'online',
    });

    // Загрузка данных профиля пользователя
    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    setIsLoadingProfile(false);
                    return;
                }

                const response = await axios.get('http://localhost:8000/api/users-management/me/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const userData = response.data;

                // Формируем полное имя из first_name и last_name
                let fullName = '';
                if (userData.first_name && userData.last_name) {
                    fullName = `${userData.first_name} ${userData.last_name}`;
                } else if (userData.first_name) {
                    fullName = userData.first_name;
                } else if (userData.last_name) {
                    fullName = userData.last_name;
                }

                // Нормализуем телефон (убеждаемся что начинается с +7)
                let normalizedPhone = '';
                if (userData.phone) {
                    const cleaned = userData.phone.replace(/\D/g, '');
                    const number = cleaned.startsWith('7') ? cleaned.slice(1) : cleaned;
                    if (number.length === 10) {
                        normalizedPhone = `+7${number}`;
                    }
                }

                // Заполняем форму данными из профиля
                setFormData(prev => ({
                    ...prev,
                    customer_name: fullName || prev.customer_name,
                    customer_phone: normalizedPhone || prev.customer_phone,
                }));

                // Загружаем адреса доставки
                const addressesData = await addressApi.getAddresses();
                setAddresses(addressesData);

                // Выбираем адрес по умолчанию
                const defaultAddress = addressesData.find((addr: any) => addr.is_default);
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                    setFormData(prev => ({
                        ...prev,
                        delivery_address: formatAddressForOrder(defaultAddress)
                    }));
                }

            } catch (error) {
                console.error('Ошибка при загрузке профиля:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadUserProfile();
    }, []);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Форматирование адреса для отправки на сервер
    const formatAddressForOrder = (address: any): string => {
        const parts = [address.full_address];
        if (address.apartment) parts.push(`кв. ${address.apartment}`);
        if (address.entrance) parts.push(`подъезд ${address.entrance}`);
        if (address.floor) parts.push(`этаж ${address.floor}`);
        return parts.join(', ');
    };

    // Обработка выбора адреса
    const handleAddressSelect = (addressId: number) => {
        setSelectedAddressId(addressId);
        const selectedAddress = addresses.find(addr => addr.id === addressId);
        if (selectedAddress) {
            setFormData(prev => ({
                ...prev,
                delivery_address: formatAddressForOrder(selectedAddress)
            }));
        }
        // Очистка ошибки адреса при выборе
        if (errors.delivery_address) {
            setErrors(prev => ({ ...prev, delivery_address: '' }));
        }
    };

    // Обработка успешного добавления адреса
    const handleAddressAdded = async () => {
        try {
            const addressesData = await addressApi.getAddresses();
            setAddresses(addressesData);

            // Автоматически выбираем только что добавленный адрес (последний в списке)
            const newAddress = addressesData[addressesData.length - 1];
            if (newAddress) {
                setSelectedAddressId(newAddress.id);
                setFormData(prev => ({
                    ...prev,
                    delivery_address: formatAddressForOrder(newAddress)
                }));
            }
        } catch (error) {
            console.error('Ошибка при обновлении списка адресов:', error);
        }
    };

    // Функция для безопасного преобразования цены
    const parsePrice = (price: number | string): number => {
        if (typeof price === 'string') {
            return parseFloat(price) || 0;
        }
        return price || 0;
    };

    // Подсчет итоговой суммы
    const totalAmount = cart?.reduce((sum, item) => {
        const price = parsePrice(item.price);
        return sum + price * item.quantity;
    }, 0) || 0;

    // Форматирование телефона для отображения
    const formatPhoneDisplay = (value: string): string => {
        // Убираем все нецифровые символы
        const cleaned = value.replace(/\D/g, '');

        // Убираем +7 если есть в начале
        const number = cleaned.startsWith('7') ? cleaned.slice(1) : cleaned;

        // Ограничиваем 10 цифрами
        const limited = number.slice(0, 10);

        // Форматируем: (XXX) XXX-XX-XX
        if (limited.length === 0) return '';
        if (limited.length <= 3) return `(${limited}`;
        if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
        if (limited.length <= 8) return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
        return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6, 8)}-${limited.slice(8)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Специальная обработка для телефона
        if (name === 'customer_phone') {
            // Убираем все нецифровые символы
            const cleaned = value.replace(/\D/g, '');
            // Убираем +7 если есть
            const number = cleaned.startsWith('7') ? cleaned.slice(1) : cleaned;
            // Ограничиваем 10 цифрами и добавляем +7
            const formatted = number.slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: formatted ? `+7${formatted}` : '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Очистка ошибки при изменении поля
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.customer_name.trim()) {
            newErrors.customer_name = 'Имя обязательно для заполнения';
        }

        if (!formData.customer_phone.trim()) {
            newErrors.customer_phone = 'Телефон обязателен для заполнения';
        }

        if (!formData.delivery_address.trim()) {
            newErrors.delivery_address = 'Адрес доставки обязателен для заполнения';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Пожалуйста, заполните все обязательные поля');
            return;
        }

        if (!cart || cart.length === 0) {
            toast.error('Корзина пуста');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('Необходимо авторизоваться');
                navigate('/login');
                return;
            }

            // Получаем примечание из выбранного адреса
            const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
            const deliveryComment = selectedAddress?.comment || '';

            // Формируем данные заказа
            const orderData = {
                ...formData,
                delivery_comment: deliveryComment,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                })),
            };

            // Отправляем заказ на сервер
            const response = await axios.post('http://localhost:8000/api/orders/', orderData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            // Успешное создание заказа
            toast.success('Заказ успешно оформлен!');
            clearCart(); // Очищаем корзину
            navigate(`/order-success/${response.data.order_number}`);

        } catch (err: any) {
            console.error('Ошибка при создании заказа:', err);

            if (err.response?.status === 401) {
                toast.error('Необходимо авторизоваться');
                navigate('/login');
            } else if (err.response?.data) {
                const errorData = err.response.data;
                if (typeof errorData === 'object' && !Array.isArray(errorData)) {
                    // Обработка ошибок полей
                    const fieldErrors: Record<string, string> = {};
                    Object.entries(errorData).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            fieldErrors[key] = value.join(', ');
                        } else if (typeof value === 'string') {
                            fieldErrors[key] = value;
                        }
                    });
                    setErrors(fieldErrors);
                    toast.error('Ошибка при оформлении заказа. Проверьте данные.');
                } else {
                    toast.error('Ошибка при оформлении заказа');
                }
            } else {
                toast.error('Ошибка соединения с сервером');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!cart || cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 sm:p-8 text-center">
                    <FaShoppingCart className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Корзина пуста</h2>
                    <p className="text-gray-600 mb-6">
                        Добавьте товары в корзину для оформления заказа
                    </p>
                    <button
                        onClick={() => navigate('/products')}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Перейти к каталогу
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Stepper */}
                <OrderStepper currentStep={2} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Форма оформления */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                            <h2 className="text-xl font-bold mb-6">Контактная информация</h2>

                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Имя */}
                                <div>
                                    <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Ваше имя <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="customer_name"
                                            name="customer_name"
                                            value={formData.customer_name}
                                            onChange={handleChange}
                                            className={`input pl-10 ${errors.customer_name ? 'border-red-500' : ''}`}
                                            placeholder="Иван Иванов"
                                        />
                                    </div>
                                    {errors.customer_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
                                    )}
                                </div>

                                {/* Телефон */}
                                <div>
                                    <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-2">
                                        Телефон <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaPhone className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <span className="absolute left-10 text-gray-700 font-medium">
                                            +7
                                        </span>
                                        <input
                                            type="tel"
                                            id="customer_phone"
                                            name="customer_phone"
                                            value={formatPhoneDisplay(formData.customer_phone)}
                                            onChange={handleChange}
                                            className={`input pl-16 ${errors.customer_phone ? 'border-red-500' : ''}`}
                                            placeholder="(999) 123-45-67"
                                        />
                                    </div>
                                    {errors.customer_phone && (
                                        <p className="mt-1 text-sm text-red-600">{errors.customer_phone}</p>
                                    )}
                                </div>

                                {/* Адрес доставки */}
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Адрес доставки <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddressModalOpen(true)}
                                            className="flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium self-start sm:self-auto"
                                        >
                                            <FaPlus className="mr-1" />
                                            Добавить адрес
                                        </button>
                                    </div>

                                    {addresses.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                                            <FaMapMarkerAlt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 mb-3">У вас нет сохраненных адресов</p>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddressModalOpen(true)}
                                                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                                            >
                                                Добавить первый адрес
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {addresses.map((address) => (
                                                <label
                                                    key={address.id}
                                                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                                        selectedAddressId === address.id
                                                            ? 'border-emerald-500 bg-emerald-50'
                                                            : 'border-gray-200 hover:border-emerald-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="address"
                                                        value={address.id}
                                                        checked={selectedAddressId === address.id}
                                                        onChange={() => handleAddressSelect(address.id)}
                                                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <div className="flex items-center">
                                                            <FaMapMarkerAlt className={`mr-2 ${selectedAddressId === address.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                            {address.label && (
                                                                <span className="font-medium text-gray-900 mr-2">{address.label}</span>
                                                            )}
                                                            {address.is_default && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                                    По умолчанию
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-700 mt-1">
                                                            {formatAddressForOrder(address)}
                                                        </p>
                                                        {address.comment && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {address.comment}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {errors.delivery_address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.delivery_address}</p>
                                    )}
                                </div>

                                {/* Комментарий */}
                                <div>
                                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                                        Комментарий к заказу
                                    </label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 pointer-events-none">
                                            <FaComment className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <textarea
                                            id="comment"
                                            name="comment"
                                            value={formData.comment}
                                            onChange={handleChange}
                                            rows={3}
                                            className="input pl-10"
                                            placeholder="Дополнительная информация о заказе"
                                        />
                                    </div>
                                </div>

                                {/* Способ оплаты */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Способ оплаты <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Наличными */}
                                        <label
                                            className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                formData.payment_method === 'cash_on_delivery'
                                                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value="cash_on_delivery"
                                                checked={formData.payment_method === 'cash_on_delivery'}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                                formData.payment_method === 'cash_on_delivery'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                <FaMoneyBillWave className="w-5 h-5" />
                                            </div>
                                            <span className={`text-sm font-medium text-center ${
                                                formData.payment_method === 'cash_on_delivery'
                                                    ? 'text-emerald-700'
                                                    : 'text-gray-700'
                                            }`}>
                                                Наличными
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">при получении</span>
                                            {formData.payment_method === 'cash_on_delivery' && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </label>

                                        {/* Картой */}
                                        <label
                                            className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                formData.payment_method === 'card_on_delivery'
                                                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value="card_on_delivery"
                                                checked={formData.payment_method === 'card_on_delivery'}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                                formData.payment_method === 'card_on_delivery'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                <FaCreditCard className="w-5 h-5" />
                                            </div>
                                            <span className={`text-sm font-medium text-center ${
                                                formData.payment_method === 'card_on_delivery'
                                                    ? 'text-emerald-700'
                                                    : 'text-gray-700'
                                            }`}>
                                                Картой
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">при получении</span>
                                            {formData.payment_method === 'card_on_delivery' && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </label>

                                        {/* Онлайн */}
                                        <label
                                            className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                formData.payment_method === 'online'
                                                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value="online"
                                                checked={formData.payment_method === 'online'}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                                formData.payment_method === 'online'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                <FaGlobe className="w-5 h-5" />
                                            </div>
                                            <span className={`text-sm font-medium text-center ${
                                                formData.payment_method === 'online'
                                                    ? 'text-emerald-700'
                                                    : 'text-gray-700'
                                            }`}>
                                                Онлайн
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">оплата сейчас</span>
                                            {formData.payment_method === 'online' && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                            </form>
                        </div>
                    </div>

                    {/* Итоговая информация */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Итого
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Товары ({cart && cart.length})
                                    </span>
                                    <span className="font-medium">
                                        {totalAmount.toFixed(2)} RUB
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Доставка</span>
                                    <span className="font-medium text-green-600">Бесплатно</span>
                                </div>

                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-gray-900">К оплате</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            {totalAmount.toFixed(2)} RUB
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Кнопки действий */}
                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    form="checkout-form"
                                    disabled={isLoading}
                                    className={`w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="spinner w-5 h-5 mr-2"></div>
                                            Оформление...
                                        </div>
                                    ) : (
                                        'Оформить заказ'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/cart')}
                                    className="w-full block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Назад в корзину
                                </button>
                            </div>

                            {/* Дополнительная информация */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="text-sm text-gray-600 space-y-2">
                                    <p>✓ Бесплатная доставка</p>
                                    <p>✓ Возврат в течение 14 дней</p>
                                    <p>✓ Гарантия качества</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Модалка добавления адреса */}
                <AddEditAddressModal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    address={null}
                    onSuccess={handleAddressAdded}
                />
            </div>
        </div>
    );
};

export default CheckoutPage;
