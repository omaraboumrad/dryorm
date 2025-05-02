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

    def create_snippet(self, name, code, framework, private):

        if not name:
            name = generate_random_string()
        slug = slugify(name)

        return self.create(
            name=name,
            slug=slug,
            code=code,
            framework=framework,
            private=private
        )


class Snippet(models.Model):

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    code = models.TextField()
    framework = models.CharField(max_length=100)
    result = models.TextField(blank=True)
    created = models.DateField(auto_now=True)
    private = models.BooleanField(default=False)

    objects = SnippetManager()

    def get_absolute_url(self):
        return reverse('detail', kwargs={'pk': self.id})
