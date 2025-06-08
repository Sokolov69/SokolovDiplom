#!/bin/bash
set -e

# Экспортируем переменные окружения
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

echo "Запуск Expo для мобильной разработки..."
# Чистый запуск Expo с конкретным указанием режима
npx expo start --tunnel