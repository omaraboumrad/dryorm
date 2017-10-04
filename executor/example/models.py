from django.db import models


class Driver(models.Model):
    name = models.CharField(max_length=50)


class Location(models.Model):
    driver = models.ForeignKey(Driver)
    latitude = models.IntegerField()
    longitude = models.IntegerField()
    some = models.BooleanField(default=True)
