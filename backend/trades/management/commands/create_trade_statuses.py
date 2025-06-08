from django.core.management.base import BaseCommand
from trades.models import TradeStatus


class Command(BaseCommand):
    help = 'Создает базовые статусы для системы обменов'

    def handle(self, *args, **options):
        statuses = [
            {
                'name': 'pending',
                'description': 'Ожидает ответа',
                'order': 1
            },
            {
                'name': 'accepted',
                'description': 'Принято',
                'order': 2
            },
            {
                'name': 'rejected',
                'description': 'Отклонено',
                'order': 3
            },
            {
                'name': 'completed',
                'description': 'Завершено',
                'order': 4
            },
            {
                'name': 'cancelled',
                'description': 'Отменено',
                'order': 5
            }
        ]

        created_count = 0
        for status_data in statuses:
            status, created = TradeStatus.objects.get_or_create(
                name=status_data['name'],
                defaults={
                    'description': status_data['description'],
                    'order': status_data['order'],
                    'is_active': True
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Создан статус: {status.name} - {status.description}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Статус уже существует: {status.name}')
                )

        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Успешно создано {created_count} статусов')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Все статусы уже существуют')
            ) 