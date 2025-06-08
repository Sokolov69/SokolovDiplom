from django.db import migrations

def add_item_conditions(apps, schema_editor):
    """
    Добавляет предопределенные состояния предметов
    """
    ItemCondition = apps.get_model('items', 'ItemCondition')
    
    conditions = [
        {
            'name': 'Новый',
            'description': 'Новый предмет в оригинальной упаковке, не использовался',
            'order': 1
        },
        {
            'name': 'Как новый',
            'description': 'Предмет в отличном состоянии, практически не использовался',
            'order': 2
        },
        {
            'name': 'Хорошее',
            'description': 'Предмет в хорошем состоянии, есть незначительные следы использования',
            'order': 3
        },
        {
            'name': 'Удовлетворительное',
            'description': 'Предмет в рабочем состоянии, есть заметные следы использования',
            'order': 4
        },
        {
            'name': 'Требует ремонта',
            'description': 'Предмет требует ремонта или восстановления',
            'order': 5
        },
    ]
    
    for condition_data in conditions:
        ItemCondition.objects.get_or_create(
            name=condition_data['name'],
            defaults=condition_data
        )


def add_item_statuses(apps, schema_editor):
    """
    Добавляет предопределенные статусы предметов
    """
    ItemStatus = apps.get_model('items', 'ItemStatus')
    
    statuses = [
        {
            'name': 'Доступен',
            'description': 'Предмет доступен для обмена',
            'is_active': True,
            'order': 1
        },
        {
            'name': 'Зарезервирован',
            'description': 'Предмет зарезервирован для обмена',
            'is_active': True,
            'order': 2
        },
        {
            'name': 'Скрыт',
            'description': 'Предмет временно скрыт и недоступен для обмена',
            'is_active': True,
            'order': 3
        },
        {
            'name': 'Обменен',
            'description': 'Предмет был успешно обменен',
            'is_active': True,
            'order': 4
        },
        {
            'name': 'Удален',
            'description': 'Предмет удален пользователем',
            'is_active': False,
            'order': 5
        },
    ]
    
    for status_data in statuses:
        ItemStatus.objects.get_or_create(
            name=status_data['name'],
            defaults=status_data
        )


def remove_item_conditions(apps, schema_editor):
    """
    Удаляет предопределенные состояния предметов (для отката миграции)
    """
    ItemCondition = apps.get_model('items', 'ItemCondition')
    conditions = ['Новый', 'Как новый', 'Хорошее', 'Удовлетворительное', 'Требует ремонта']
    ItemCondition.objects.filter(name__in=conditions).delete()


def remove_item_statuses(apps, schema_editor):
    """
    Удаляет предопределенные статусы предметов (для отката миграции)
    """
    ItemStatus = apps.get_model('items', 'ItemStatus')
    statuses = ['Доступен', 'Зарезервирован', 'Скрыт', 'Обменен', 'Удален']
    ItemStatus.objects.filter(name__in=statuses).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('items', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_item_conditions, remove_item_conditions),
        migrations.RunPython(add_item_statuses, remove_item_statuses),
    ] 