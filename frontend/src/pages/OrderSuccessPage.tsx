import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaHome, FaShoppingBag } from 'react-icons/fa';

const OrderSuccessPage: React.FC = () => {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white shadow-2xl rounded-2xl p-8 text-center">
                    {/* Иконка успеха */}
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <FaCheckCircle className="h-12 w-12 text-green-600" />
                    </div>

                    {/* Заголовок */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Заказ оформлен!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Спасибо за ваш заказ
                    </p>

                    {/* Номер заказа */}
                    {orderNumber && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-600 mb-1">Номер заказа</p>
                            <p className="text-2xl font-bold text-blue-600">{orderNumber}</p>
                        </div>
                    )}

                    {/* Информация */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-gray-900 mb-2">Что дальше?</h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Мы получили ваш заказ и начали его обработку</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>В ближайшее время с вами свяжется наш менеджер для подтверждения</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Вы можете отслеживать статус заказа в личном кабинете</span>
                            </li>
                        </ul>
                    </div>

                    {/* Кнопки действий */}
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                            <FaShoppingBag className="mr-2" />
                            Мои заказы
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                            <FaHome className="mr-2" />
                            На главную
                        </button>
                    </div>
                </div>

                {/* Дополнительная информация */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Если у вас есть вопросы, свяжитесь с нами:</p>
                    <p className="mt-1 font-medium text-gray-900">
                        +7 (999) 123-45-67 • info@faida.ru
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
