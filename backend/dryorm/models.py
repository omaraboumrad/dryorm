import random
import string
import re
import ast

from django.db import models
from django.utils.text import slugify
from django.urls import reverse


def generate_random_string(length=8):
    # A-Z, a-z, 0-9
    characters = string.ascii_letters + string.digits
    return "".join(random.choices(characters, k=length))


class SnippetManager(models.Manager):

    def create_snippet(self, name, code, database, private, orm_version=None, ref_type=None, ref_id=None, sha=None, session_key=None):
        if not name:
            name = generate_random_string()
        slug = slugify(name)

        return self.create(
            name=name,
            slug=slug,
            code=code,
            database=database,
            private=private,
            orm_version=orm_version,
            ref_type=ref_type,
            ref_id=ref_id,
            sha=sha,
            session_key=session_key,
        )


class Snippet(models.Model):

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    code = models.TextField()
    result = models.TextField(blank=True)
    created = models.DateTimeField(auto_now=True)
    private = models.BooleanField(default=False)
    database = models.CharField(max_length=50, default="sqlite")

    # Version info - either orm_version OR (ref_type + ref_id + sha) should be set
    orm_version = models.CharField(max_length=50, null=True, blank=True)  # e.g., "django-5.2.8", "sqlalchemy-2.0"
    ref_type = models.CharField(max_length=10, null=True, blank=True)  # "pr", "branch", or "tag"
    ref_id = models.CharField(max_length=100, null=True, blank=True)  # PR number, branch name, or tag name
    sha = models.CharField(max_length=40, null=True, blank=True)  # Git commit SHA to pin to specific version

    # Keep for backwards compatibility during migration
    django_version = models.CharField(max_length=20, default="5.2.8")

    # Session-based ownership (for allowing updates without auth)
    session_key = models.CharField(max_length=40, null=True, blank=True)

    objects = SnippetManager()

    def get_absolute_url(self):
        return reverse("detail", kwargs={"pk": self.id})

    def parse_code(self):
        """Parse Python code to extract imports and class names."""
        imports = []
        classes = []
        
        try:
            # Try to parse with AST for accurate parsing
            tree = ast.parse(self.code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ""
                    for alias in node.names:
                        if module:
                            imports.append(f"{module}.{alias.name}")
                        else:
                            imports.append(alias.name)
                elif isinstance(node, ast.ClassDef):
                    classes.append(node.name)
                    
        except SyntaxError:
            # Fallback to regex parsing if AST fails
            import_patterns = [
                r'^import\s+([^\s#]+)',
                r'^from\s+([^\s#]+)\s+import\s+([^\s#,]+)'
            ]
            
            for line in self.code.split('\n'):
                line = line.strip()
                
                # Check for import statements
                for pattern in import_patterns:
                    match = re.match(pattern, line)
                    if match:
                        if 'from' in pattern:
                            imports.append(f"{match.group(1)}.{match.group(2)}")
                        else:
                            imports.append(match.group(1))
                
                # Check for class definitions
                class_match = re.match(r'^class\s+(\w+)', line)
                if class_match:
                    classes.append(class_match.group(1))
        
        # Filter out django.db.models and ensure unique items
        filtered_imports = [imp for imp in set(imports) if imp != "django.db.models"]
        unique_classes = list(set(classes))
        
        return {"imports": filtered_imports, "classes": unique_classes}
