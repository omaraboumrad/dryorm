import uuid

from django.db import models
from django.urls import reverse


class Snippet(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    models_code = models.TextField()
    framework = models.CharField(max_length=100)

    created = models.DateField(auto_now=True)

    def get_absolute_url(self):
        return reverse('detail', kwargs={'pk': self.id})

