import React from 'react';

interface OrderStepperProps {
    currentStep: 1 | 2;
}

const OrderStepper: React.FC<OrderStepperProps> = ({ currentStep }) => {
    return (
        <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
                {/* Шаг 1: Корзина */}
                <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white transition-colors ${
                        currentStep >= 1 ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}>
                        {currentStep > 1 ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            '1'
                        )}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                        currentStep === 1 ? 'text-emerald-600' : currentStep > 1 ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                        Корзина
                    </span>
                </div>

                {/* Линия между шагами */}
                <div className={`w-24 h-1 mx-4 transition-colors ${
                    currentStep >= 2 ? 'bg-emerald-600' : 'bg-gray-300'
                }`}></div>

                {/* Шаг 2: Оформление */}
                <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white transition-colors ${
                        currentStep >= 2 ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}>
                        2
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                        currentStep === 2 ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                        Оформление
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OrderStepper;
