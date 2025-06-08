#!/bin/bash

# Ждем 5 секунд для уверенности, что база данных запустилась
echo "Waiting for database..."
sleep 5

# Применяем миграции
echo "Applying migrations..."
python manage.py migrate

# Запускаем сервер
echo "Starting server..."
python manage.py runserver 0.0.0.0:8000 