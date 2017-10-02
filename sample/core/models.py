from django.db import models


class Question(models.Model):
    name = models.TextField(null=True)
