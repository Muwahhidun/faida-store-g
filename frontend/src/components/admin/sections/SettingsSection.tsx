import React from 'react';
import { GlobalSettings } from '../../../types/admin';

interface SettingsSectionProps {
    globalSettings: GlobalSettings;
    onSettingsUpdate: () => void;
}

/**
 * Секция настроек сайта
 * Глобальные настройки отображения остатков, минимального порога и других параметров
 */
export const SettingsSection: React.FC<SettingsSectionProps> = ({
    globalSettings,
    onSettingsUpdate
}) => {
    // TODO: Перенести код из AdminPanelPage
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Настройки сайта</h3>
            <p className="text-gray-500">Секция в разработке... Код будет перенесён из AdminPanelPage</p>
            <div className="mt-4">
                <p className="text-sm">
                    Показ остатков: {globalSettings.show_stock_quantities_globally ? 'Включен' : 'Отключен'}
                </p>
                <p className="text-sm">
                    Порог: {globalSettings.default_low_stock_threshold}
                </p>
            </div>
        </div>
    );
};
