from django.core.management.base import BaseCommand
from django.db.models import Count
from profiles.models import UserProfile
from trades.models import TradeOffer


class Command(BaseCommand):
    help = 'Обновляет счетчик успешных обменов для всех пользователей'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Начинаем перерасчет счетчика успешных обменов...'))
        
        # Получаем все профили пользователей
        profiles = UserProfile.objects.all()
        updated_count = 0
        
        for profile in profiles:
            # Считаем завершенные обмены как инициатор
            initiator_trades = TradeOffer.objects.filter(
                initiator=profile.user,
                status__name='completed'
            ).count()
            
            # Считаем завершенные обмены как получатель
            receiver_trades = TradeOffer.objects.filter(
                receiver=profile.user,
                status__name='completed'
            ).count()
            
            # Общее количество успешных обменов
            total_successful_trades = initiator_trades + receiver_trades
            
            # Обновляем только если значение изменилось
            if profile.successful_trades != total_successful_trades:
                old_value = profile.successful_trades
                profile.successful_trades = total_successful_trades
                profile.save()
                updated_count += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Пользователь {profile.user.username}: {old_value} → {total_successful_trades}'
                    )
                )
        
        if updated_count == 0:
            self.stdout.write(self.style.SUCCESS('Все счетчики уже актуальны'))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Успешно обновлено {updated_count} профилей пользователей'
                )
            ) 