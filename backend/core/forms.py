from django.forms import ModelForm

from core import models


class SnippetForm(ModelForm):

    class Meta:
        model = models.Snippet

        fields = [
            'models_code',
            'transactions_code',
            'framework'
        ]
