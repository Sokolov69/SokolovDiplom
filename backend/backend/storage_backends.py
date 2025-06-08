from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage
import logging
import os
import hashlib
import boto3
from botocore.config import Config

# Настраиваем логгер
logger = logging.getLogger(__name__)

class S3Storage:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
            config=Config(s3={'addressing_style': 'path'})  # Используем 'path' вместо 'virtual'
        )
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        self.base_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}"

    def generate_file_hash(self, file):
        """Генерирует хеш на основе содержимого файла"""
        hasher = hashlib.sha256()
        for chunk in file.chunks():
            hasher.update(chunk)
        return hasher.hexdigest()

    def upload_file(self, file, folder='media'):
        try:
            file_extension = file.name.split('.')[-1]
            file_hash = self.generate_file_hash(file)
            file_key = f"{folder}/{file_hash}.{file_extension}"
            
            logger.info(f"Загрузка файла в S3: bucket={self.bucket_name}, key={file_key}")

            try:
                self.s3_client.head_object(Bucket=self.bucket_name, Key=file_key)
                logger.info(f"Файл уже существует: {file_key}")
                return f"{self.base_url}/{file_key}"
            except:
                file.seek(0)
                self.s3_client.upload_fileobj(
                    file,
                    self.bucket_name,
                    file_key,
                    ExtraArgs={'ACL': 'public-read'}
                )
                logger.info(f"Файл успешно загружен: {file_key}")
                return f"{self.base_url}/{file_key}"
        except Exception as e:
            logger.error(f"Ошибка при загрузке файла: {e}")
            return None

    def delete_file(self, file_key):
        """
        Удаляет файл из S3 по ключу
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            logger.info(f"Файл успешно удален: {file_key}")
            return True
        except Exception as e:
            logger.error(f"Ошибка при удалении файла: {e}")
            return False

class StaticStorage(S3Boto3Storage):
    location = settings.STATIC_LOCATION
    default_acl = 'public-read'
    file_overwrite = True
    
    def _save(self, name, content):
        # Используем прямую загрузку через S3Storage
        storage = S3Storage()
        file_url = storage.upload_file(content, folder=self.location)
        if file_url:
            # Возвращаем только имя файла, как ожидается Django
            return name
        else:
            # Попытка использовать стандартный метод
            return super()._save(name, content)

class MediaStorage(S3Boto3Storage):
    location = settings.MEDIA_LOCATION
    default_acl = 'public-read'
    file_overwrite = False
    
    def _save(self, name, content):
        # Используем прямую загрузку через S3Storage
        storage = S3Storage()
        file_url = storage.upload_file(content, folder=self.location)
        if file_url:
            logger.info(f"Файл успешно сохранен с URL: {file_url}")
            # Возвращаем только имя файла, как ожидается Django
            return name
        else:
            logger.error("Не удалось сохранить файл через S3Storage, пробуем стандартный метод")
            return super()._save(name, content)
    
    def url(self, name, parameters=None, expire=None):
        """Возвращает публичный URL для файла"""
        # Формируем URL напрямую без подписи
        direct_url = f"{settings.AWS_S3_ENDPOINT_URL}/{self.bucket_name}/{self.location}/{name}"
        logger.debug(f"URL для файла {name}: {direct_url}")
        return direct_url 