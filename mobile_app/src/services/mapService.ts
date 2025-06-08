import { YaMap } from 'react-native-yamap';

/**
 * Сервис для работы с Яндекс.Картами
 */
class MapService {
  private initialized = false;
  private apiKey = 'bef0b6db-3d2c-4f46-81ef-923e9d4fa5f6';

  /**
   * Инициализирует Яндекс.Карты
   */
  init() {
    if (!this.initialized) {
      try {
        YaMap.init(this.apiKey);
        this.initialized = true;
        console.log('Яндекс.Карты успешно инициализированы');
      } catch (error) {
        console.error('Ошибка при инициализации Яндекс.Карт:', error);
      }
    }
    return this.initialized;
  }

  /**
   * Проверяет, инициализированы ли Яндекс.Карты
   */
  isInitialized() {
    return this.initialized;
  }
}

export const mapService = new MapService(); 