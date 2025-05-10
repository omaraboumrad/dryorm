import sys
import zlib
import base64

from django.apps import apps
from django.db import models
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType


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
    referenced_models = set()
    auth_models = {User, Group, Permission, ContentType}

    # First pass: collect all referenced models from executor app
    for model in apps.get_models():
        if model._meta.app_label != 'executor':
            continue
            
        for field in model._meta.get_fields():
            if field.auto_created and not field.concrete:
                continue

            field_type = get_field_type(field)
            if field_type in {"ForeignKey", "OneToOneField", "ManyToManyField"}:
                referenced_models.add(field.related_model)

    # Check if any auth model is referenced
    include_auth_models = any(model in referenced_models for model in auth_models)

    # Second pass: generate diagram
    for model in apps.get_models():
        # Only include executor models and auth models if referenced
        if model._meta.app_label != 'executor' and (model not in auth_models or not include_auth_models):
            continue

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
                    arrow = "}o--||"
                elif field_type == "OneToOneField":
                    arrow = "||--||"
                else:  # ManyToManyField
                    arrow = "}o--o{"
                relationships.append(f"    {model_name} {arrow} {related_model} : {rel_label}")
                # Include the relationship field in the model definition
                mermaid.append(f"        {field_type} {field.name}")
            else:
                mermaid.append(f"        {field_type} {field.name}")
        mermaid.append("    }")

    mermaid.extend(relationships)
    return "\n".join(mermaid)


def kroki_encode(text):
    return base64.urlsafe_b64encode(zlib.compress(text.encode('utf-8'), 9)).decode('utf-8')
