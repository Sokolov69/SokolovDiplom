FROM node:20

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей проекта и пакетов для туннелирования
RUN npm install
RUN npm install --global @expo/ngrok

# Копирование остальных файлов проекта
COPY . .

# Делаем скрипт запуска исполняемым
RUN chmod 777 start.sh

# Экспозиция портов
# 19000 - Metro bundler
# 19001 - React Native Debugger
# 19002 - Expo Developer Tools
# 8081 - React Native server
EXPOSE 19000 19001 19002 8081 19006

# Настройка переменных среды для Expo
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
ENV EXPO_DEBUG=true

# Запуск через скрипт
CMD ["./start.sh"] 