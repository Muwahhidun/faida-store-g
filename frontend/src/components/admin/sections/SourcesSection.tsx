import React from 'react';
import { Source, AvailableOptions } from '../../../types/admin';

interface SourcesSectionProps {
    sources: Source[];
    availableOptions: AvailableOptions;
    onSourcesUpdate: () => void;
}

/**
 * Секция управления источниками данных 1С
 * Отображает список источников, их статусы, позволяет запускать синхронизацию
 */
export const SourcesSection: React.FC<SourcesSectionProps> = ({
    sources,
    availableOptions,
    onSourcesUpdate
}) => {
    // TODO: Перенести код из AdminPanelPage
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Источники данных</h3>
            <p className="text-gray-500">Секция в разработке... Код будет перенесён из AdminPanelPage</p>
            <div className="mt-4">
                <p className="text-sm">Источников: {sources.length}</p>
            </div>
        </div>
    );
};
