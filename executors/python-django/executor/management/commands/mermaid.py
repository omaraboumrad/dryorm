import sys
import zlib
import base64

from django.apps import apps
from django.db import models


def get_field_type(field):
    if isinstance(field, models.ForeignKey):
        return "ForeignKey"
    elif isinstance(field, models.OneToOneField):
        return "OneToOneField"
    elif isinstance(field, models.ManyToManyField):
        return "ManyToManyField"
    return field.get_internal_type()


def generate_mermaid_erd():
    mermaid = ["erDiagram"]
    relationships = []

    for model in apps.get_models():
        model_name = model.__name__
        mermaid.append(f"    {model_name} {{")
        for field in model._meta.get_fields():
            if field.auto_created and not field.concrete:
                continue

            field_type = get_field_type(field)

            if field_type in {"ForeignKey", "OneToOneField", "ManyToManyField"}:
                related_model = field.related_model.__name__
                rel_label = field.name
                if field_type == "ForeignKey":
                    arrow = "||--o{"
                elif field_type == "OneToOneField":
                    arrow = "||--||"
                else:  # ManyToManyField
                    arrow = "}o--o{"
                relationships.append(f"    {model_name} {arrow} {related_model} : {rel_label}")
            else:
                mermaid.append(f"        {field_type} {field.name}")
        mermaid.append("    }")

    mermaid.extend(relationships)
    return "\n".join(mermaid)


def kroki_encode(text):
    return base64.urlsafe_b64encode(zlib.compress(text.encode('utf-8'), 9)).decode('utf-8')
