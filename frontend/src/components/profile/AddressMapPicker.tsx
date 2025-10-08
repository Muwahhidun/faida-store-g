import React, { useEffect, useRef, useState } from 'react';

interface AddressData {
  full_address: string;
  city: string;
  street: string;
  house: string;
  latitude: number;
  longitude: number;
}

interface AddressMapPickerProps {
  initialCoords?: [number, number];
  onAddressSelect: (data: AddressData) => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  initialCoords = [42.9849, 47.5047], // Махачкала по умолчанию
  onAddressSelect
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Проверяем, не загружается ли уже скрипт
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');

    // Загружаем Yandex Maps API если еще не загружен
    if (!window.ymaps && !existingScript) {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=02c1b9b1-c815-4c2f-a505-1f11e65a8d8d&lang=ru_RU';
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else if (window.ymaps) {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Обновление позиции при изменении initialCoords (для режима редактирования)
  useEffect(() => {
    console.log('AddressMapPicker: initialCoords changed', initialCoords);

    if (mapInstanceRef.current && placemarkRef.current && initialCoords) {
      // Всегда обновляем позицию при изменении initialCoords
      console.log('Setting map to coords:', initialCoords);
      placemarkRef.current.geometry.setCoordinates(initialCoords);
      mapInstanceRef.current.setCenter(initialCoords, 16);
      geocodeCoordinates(initialCoords);
    }
  }, [initialCoords[0], initialCoords[1]]);

  const initMap = () => {
    window.ymaps.ready(() => {
      if (!mapRef.current) return;

      // Проверяем, что карта еще не создана
      if (mapInstanceRef.current) return;

      // Создаем карту
      const map = new window.ymaps.Map(mapRef.current, {
        center: initialCoords,
        zoom: 16,
        controls: ['zoomControl', 'geolocationControl']
      }, {
        suppressMapOpenBlock: true // Отключаем промо-блоки Яндекса
      });

      mapInstanceRef.current = map;

      // Создаем метку в центре
      const placemark = new window.ymaps.Placemark(initialCoords, {}, {
        preset: 'islands#redDotIcon',
        draggable: true // Можно перетаскивать
      });

      map.geoObjects.add(placemark);
      placemarkRef.current = placemark;

      // Обработчик клика по карте - перемещаем маркер
      map.events.add('click', (e: any) => {
        const coords = e.get('coords');
        placemark.geometry.setCoordinates(coords);
        geocodeCoordinates(coords);
      });

      // Обработчик перетаскивания маркера
      placemark.events.add('dragend', () => {
        const coords = placemark.geometry.getCoordinates();
        geocodeCoordinates(coords);
      });

      // Получаем адрес для начальных координат
      geocodeCoordinates(initialCoords);
      setIsLoading(false);
    });
  };

  const geocodeCoordinates = async (coords: [number, number]) => {
    try {
      const geocoder = await window.ymaps.geocode(coords);
      const firstGeoObject = geocoder.geoObjects.get(0);

      if (firstGeoObject) {
        const addressLine = firstGeoObject.getAddressLine();
        const locality = firstGeoObject.getLocalities()[0] || '';
        const thoroughfare = firstGeoObject.getThoroughfare() || '';
        const premiseNumber = firstGeoObject.getPremiseNumber() || '';

        setAddress(addressLine);
        setSearchQuery(addressLine);

        // Формируем данные для передачи родителю
        // Округляем координаты до 8 знаков (точность ~1мм, этого более чем достаточно)
        const addressData: AddressData = {
          full_address: addressLine,
          city: locality,
          street: thoroughfare,
          house: premiseNumber,
          latitude: parseFloat(coords[0].toFixed(8)),
          longitude: parseFloat(coords[1].toFixed(8))
        };

        onAddressSelect(addressData);
      }
    } catch (error: any) {
      console.error('Ошибка геокодирования:', error);
      console.error('Детали ошибки:', error?.message, error?.toString());
      setAddress('Не удалось определить адрес');
    }
  };

  const handleSearchAddress = async (query: string) => {
    if (!query.trim() || !window.ymaps) return;

    setIsSearching(true);
    try {
      // Поиск с ограничением по Дагестану
      const geocoder = await window.ymaps.geocode(query, {
        results: 1,
        boundedBy: [[41.0, 45.0], [44.0, 49.0]], // Примерные границы Дагестана
      });

      const firstGeoObject = geocoder.geoObjects.get(0);

      if (firstGeoObject) {
        const coords = firstGeoObject.geometry.getCoordinates();

        // Перемещаем маркер и карту
        if (placemarkRef.current && mapInstanceRef.current) {
          placemarkRef.current.geometry.setCoordinates(coords);
          mapInstanceRef.current.setCenter(coords, 16);

          // Обновляем адрес
          await geocodeCoordinates(coords as [number, number]);
        }
      }
    } catch (error: any) {
      console.error('Ошибка поиска адреса:', error);
      console.error('Детали ошибки поиска:', error?.message, error?.toString());
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Очистка предыдущего таймера
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Дебаунс 800мс
    searchTimeoutRef.current = window.setTimeout(() => {
      handleSearchAddress(value);
    }, 800);
  };

  return (
    <div className="space-y-3">
      {/* Поле поиска адреса */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Поиск адреса
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            placeholder="Введите адрес: Махачкала, ул. Ленина, 10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Начните вводить адрес, и маркер автоматически переместится
        </p>
      </div>

      {/* Карта */}
      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg border border-gray-300 relative"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-gray-600">Загрузка карты...</div>
          </div>
        )}
      </div>

      {/* Выбранный адрес */}
      <div className="flex items-start space-x-2 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
        <span className="text-blue-600 mt-0.5">📍</span>
        <div className="flex-1">
          <p className="font-medium text-blue-900">Выбранный адрес:</p>
          <p className="text-blue-700">{address || 'Адрес не выбран'}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Или кликните на карту / перетащите маркер для точной настройки
      </p>
    </div>
  );
};

export default AddressMapPicker;
