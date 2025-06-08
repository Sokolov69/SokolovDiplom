from django.db import models
from django.utils.translation import gettext_lazy as _

# Create your models here.

class TimeStampedModel(models.Model):
    """
    Абстрактная модель, которая предоставляет поля created_at и updated_at
    """
    created_at = models.DateTimeField(_("Дата создания"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Дата обновления"), auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """
    Абстрактная модель для мягкого удаления
    """
    is_deleted = models.BooleanField(_("Удален"), default=False)
    deleted_at = models.DateTimeField(_("Дата удаления"), null=True, blank=True)

    class Meta:
        abstract = True
