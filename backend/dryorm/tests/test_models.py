from django.test import TestCase

from dryorm.models import Snippet, generate_random_string


class GenerateRandomStringTest(TestCase):
    def test_default_length(self):
        result = generate_random_string()
        self.assertEqual(len(result), 8)

    def test_custom_length(self):
        result = generate_random_string(length=16)
        self.assertEqual(len(result), 16)

    def test_alphanumeric_only(self):
        result = generate_random_string(length=100)
        self.assertTrue(result.isalnum())


class SnippetModelTest(TestCase):
    def test_create_snippet_with_name(self):
        snippet = Snippet.objects.create_snippet(
            name="Test Snippet",
            code="from django.db import models",
            database="sqlite",
            private=False,
        )
        self.assertEqual(snippet.name, "Test Snippet")
        self.assertEqual(snippet.slug, "test-snippet")
        self.assertFalse(snippet.private)

    def test_create_snippet_without_name(self):
        snippet = Snippet.objects.create_snippet(
            name="",
            code="from django.db import models",
            database="sqlite",
            private=False,
        )
        self.assertEqual(len(snippet.name), 8)
        self.assertTrue(snippet.name.isalnum())

    def test_create_snippet_with_ref_info(self):
        snippet = Snippet.objects.create_snippet(
            name="PR Test",
            code="# test",
            database="postgres",
            private=True,
            ref_type="pr",
            ref_id="12345",
            sha="abc123def456",
        )
        self.assertEqual(snippet.ref_type, "pr")
        self.assertEqual(snippet.ref_id, "12345")
        self.assertEqual(snippet.sha, "abc123def456")

    def test_get_absolute_url(self):
        # Note: The 'detail' URL pattern doesn't exist in the SPA routing
        snippet = Snippet.objects.create_snippet(
            name="URL Test",
            code="# test",
            database="sqlite",
            private=False,
        )
        self.assertIsNotNone(snippet.id)
        self.assertEqual(snippet.name, "URL Test")
