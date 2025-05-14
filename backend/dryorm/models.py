import random
import string


from django.db import models
from django.utils.text import slugify
from django.urls import reverse


def generate_random_string(length=8):
    # A-Z, a-z, 0-9
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=length))


class SnippetManager(models.Manager):

    def create_snippet(self, name, code, database, private):

        if not name:
            name = generate_random_string()
        slug = slugify(name)

        return self.create(
            name=name,
            slug=slug,
            code=code,
            database=database,
            private=private
        )


class Snippet(models.Model):

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    code = models.TextField()
    result = models.TextField(blank=True)
    created = models.DateTimeField(auto_now=True)
    private = models.BooleanField(default=False)
    database = models.CharField(max_length=50, default='sqlite')

    objects = SnippetManager()

    def get_absolute_url(self):
        return reverse('detail', kwargs={'pk': self.id})
