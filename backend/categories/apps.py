from django.apps import AppConfig
import logging


class CategoriesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'categories'
    verbose_name = 'Категории товаров'

    def ready(self):
        """Инициализация приложения при запуске"""
        self._setup_logging()
        self._check_s3_configuration()
        self._register_signals()

    def _setup_logging(self):
        """Настройка логирования для приложения"""
        self.logger = logging.getLogger(self.name)
        self.logger.info(f"Инициализация приложения {self.verbose_name}")

    def _check_s3_configuration(self):
        """Проверка конфигурации S3 хранилища"""
        from django.conf import settings
        
        if not settings.USE_S3:
            self.logger.warning("S3 хранилище отключено. Файлы будут сохраняться локально.")
            return

        self.logger.info("Проверка конфигурации S3 хранилища...")
        
        # Проверяем наличие всех необходимых настроек
        required_settings = {
            'AWS_ACCESS_KEY_ID': settings.AWS_ACCESS_KEY_ID,
            'AWS_SECRET_ACCESS_KEY': settings.AWS_SECRET_ACCESS_KEY,
            'AWS_STORAGE_BUCKET_NAME': settings.AWS_STORAGE_BUCKET_NAME,
            'AWS_S3_ENDPOINT_URL': settings.AWS_S3_ENDPOINT_URL,
            'AWS_S3_REGION_NAME': settings.AWS_S3_REGION_NAME,
            'DEFAULT_FILE_STORAGE': settings.DEFAULT_FILE_STORAGE,
        }
        
        missing_settings = [
            key for key, value in required_settings.items() 
            if not value and key != 'AWS_SECRET_ACCESS_KEY'
        ]
        
        if missing_settings:
            self.logger.error(f"Отсутствуют необходимые настройки S3: {', '.join(missing_settings)}")
            return
            
        self.logger.info("Все необходимые настройки S3 присутствуют")
        
        # Проверяем доступность S3 в отдельном потоке, чтобы не блокировать запуск
        self._test_s3_connection_async()

    def _test_s3_connection_async(self):
        """Асинхронная проверка соединения с S3"""
        import threading
        thread = threading.Thread(target=self._test_s3_connection)
        thread.daemon = True
        thread.start()

    def _test_s3_connection(self):
        """Проверка соединения с S3"""
        try:
            from django.conf import settings
            import boto3
            from botocore.client import Config
            from botocore.exceptions import ClientError, NoCredentialsError
            
            session = boto3.session.Session()
            client = session.client(
                's3',
                region_name=settings.AWS_S3_REGION_NAME,
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version='s3v4', connect_timeout=10, read_timeout=10)
            )
            
            # Пробуем выполнить простую операцию
            response = client.list_objects_v2(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                MaxKeys=1
            )
            
            self.logger.info("Соединение с S3 установлено успешно")
            
            # Проверяем права доступа
            self._check_s3_permissions(client, settings.AWS_STORAGE_BUCKET_NAME)
            
        except NoCredentialsError:
            self.logger.error("Неверные учетные данные для S3")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                self.logger.error(f"Бакет S3 не найден: {settings.AWS_STORAGE_BUCKET_NAME}")
            elif error_code == 'AccessDenied':
                self.logger.error("Доступ к S3 запрещен. Проверьте права доступа")
            else:
                self.logger.error(f"Ошибка S3 ({error_code}): {e}")
        except Exception as e:
            self.logger.error(f"Ошибка при проверке соединения с S3: {str(e)}")

    def _check_s3_permissions(self, client, bucket_name):
        """Проверка прав доступа к S3"""
        try:
            # Проверяем права на чтение
            client.get_bucket_acl(Bucket=bucket_name)
            self.logger.debug("Права на чтение бакета: OK")
            
            # Проверяем права на запись (пробуем создать тестовый объект)
            test_key = 'test_permissions.txt'
            client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=b'test',
                ACL='public-read'
            )
            
            # Удаляем тестовый объект
            client.delete_object(Bucket=bucket_name, Key=test_key)
            
            self.logger.info("Права доступа к S3 проверены успешно")
            
        except Exception as e:
            self.logger.warning(f"Не удалось проверить полные права доступа к S3: {e}")

    def _register_signals(self):
        """Регистрация сигналов Django"""
        try:
            from . import signals  # Если есть файл signals.py
            self.logger.debug("Сигналы приложения зарегистрированы")
        except ImportError:
            # Сигналы не определены - это нормально
            pass
