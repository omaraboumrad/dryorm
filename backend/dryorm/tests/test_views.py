import json
from unittest.mock import patch

from django.test import TestCase, Client

from dryorm.models import Snippet


class ConfigAPITest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_config_api_returns_json(self):
        response = self.client.get("/api/config")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")

    def test_config_api_contains_databases(self):
        response = self.client.get("/api/config")
        data = response.json()
        self.assertIn("databases", data)
        self.assertIsInstance(data["databases"], list)

    def test_config_api_contains_orm_versions(self):
        response = self.client.get("/api/config")
        data = response.json()
        self.assertIn("ormVersions", data)
        self.assertIsInstance(data["ormVersions"], list)

    def test_config_api_contains_templates(self):
        response = self.client.get("/api/config")
        data = response.json()
        self.assertIn("templates", data)
        self.assertIsInstance(data["templates"], dict)

    def test_config_api_post_not_allowed(self):
        response = self.client.post("/api/config")
        self.assertEqual(response.status_code, 405)


class SnippetsAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        Snippet.objects.create_snippet(
            name="Public Snippet 1",
            code="# public 1",
            database="sqlite",
            private=False,
        )
        Snippet.objects.create_snippet(
            name="Public Snippet 2",
            code="# public 2",
            database="postgres",
            private=False,
        )
        Snippet.objects.create_snippet(
            name="Private Snippet",
            code="# private",
            database="sqlite",
            private=True,
        )

    def test_snippets_api_returns_json(self):
        response = self.client.get("/api/snippets")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")

    def test_snippets_api_excludes_private(self):
        response = self.client.get("/api/snippets")
        data = response.json()
        self.assertEqual(len(data["snippets"]), 2)
        names = [s["name"] for s in data["snippets"]]
        self.assertNotIn("Private Snippet", names)

    def test_snippets_api_search(self):
        response = self.client.get("/api/snippets?q=Snippet%201")
        data = response.json()
        self.assertEqual(len(data["snippets"]), 1)
        self.assertEqual(data["snippets"][0]["name"], "Public Snippet 1")

    def test_snippets_api_pagination(self):
        response = self.client.get("/api/snippets")
        data = response.json()
        self.assertIn("pagination", data)
        self.assertIn("page", data["pagination"])
        self.assertIn("totalPages", data["pagination"])
        self.assertIn("total", data["pagination"])


class SnippetAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.snippet = Snippet.objects.create_snippet(
            name="Test Snippet",
            code="# test code",
            database="sqlite",
            private=False,
            orm_version="django-5.2.8",
        )

    def test_snippet_api_returns_snippet(self):
        response = self.client.get(f"/api/snippet/{self.snippet.slug}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["code"], "# test code")
        self.assertEqual(data["name"], "Test Snippet")
        self.assertEqual(data["slug"], self.snippet.slug)

    def test_snippet_api_not_found(self):
        response = self.client.get("/api/snippet/nonexistent-slug")
        self.assertEqual(response.status_code, 404)

    def test_snippet_api_with_ref_info(self):
        snippet = Snippet.objects.create_snippet(
            name="PR Snippet",
            code="# pr test",
            database="postgres",
            private=False,
            ref_type="pr",
            ref_id="12345",
            sha="abc123",
        )
        response = self.client.get(f"/api/snippet/{snippet.slug}")
        data = response.json()
        self.assertIn("refInfo", data)
        self.assertEqual(data["refInfo"]["type"], "pr")
        self.assertEqual(data["refInfo"]["id"], "12345")


class SaveViewTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_save_creates_snippet(self):
        response = self.client.post(
            "/save",
            data=json.dumps({
                "name": "New Snippet",
                "code": "# new code",
                "database": "sqlite",
                "private": False,
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("slug", data)

        snippet = Snippet.objects.get(slug=data["slug"])
        self.assertEqual(snippet.name, "New Snippet")

    def test_save_invalid_json(self):
        response = self.client.post(
            "/save",
            data="not json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_save_get_not_allowed(self):
        response = self.client.get("/save")
        self.assertEqual(response.status_code, 405)

    def test_save_with_ref_info(self):
        response = self.client.post(
            "/save",
            data=json.dumps({
                "name": "PR Snippet",
                "code": "# pr code",
                "database": "postgres",
                "private": False,
                "ref_type": "pr",
                "ref_id": "99999",
                "sha": "abc123def",
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        snippet = Snippet.objects.get(slug=data["slug"])
        self.assertEqual(snippet.ref_type, "pr")
        self.assertEqual(snippet.ref_id, "99999")

    def test_save_update_own_snippet(self):
        response = self.client.post(
            "/save",
            data=json.dumps({
                "name": "Original",
                "code": "# original",
                "database": "sqlite",
                "private": False,
            }),
            content_type="application/json",
        )
        slug = response.json()["slug"]

        response = self.client.post(
            "/save",
            data=json.dumps({
                "slug": slug,
                "name": "Updated",
                "code": "# updated",
                "database": "postgres",
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("updated"))

        snippet = Snippet.objects.get(slug=slug)
        self.assertEqual(snippet.name, "Updated")
        self.assertEqual(snippet.code, "# updated")


class SearchRefsViewTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_search_refs_empty_query(self):
        response = self.client.get("/search-refs?type=pr&q=")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["results"], [])

    def test_search_refs_invalid_type(self):
        response = self.client.get("/search-refs?type=invalid&q=test")
        self.assertEqual(response.status_code, 400)

    def test_search_refs_post_not_allowed(self):
        response = self.client.post("/search-refs")
        self.assertEqual(response.status_code, 405)


class ExecuteViewTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_execute_no_code(self):
        response = self.client.post(
            "/execute",
            data=json.dumps({"database": "sqlite"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)

    def test_execute_invalid_json(self):
        response = self.client.post(
            "/execute",
            data="not json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_execute_get_not_allowed(self):
        response = self.client.get("/execute")
        self.assertEqual(response.status_code, 405)

    @patch("dryorm.views.tasks.run_django_sync")
    def test_execute_calls_task(self, mock_run):
        mock_run.return_value = {"event": "complete", "data": {}}

        response = self.client.post(
            "/execute",
            data=json.dumps({
                "code": "from django.db import models",
                "database": "sqlite",
                "orm_version": "django-5.2.8",
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        mock_run.assert_called_once()


class FetchRefViewTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_fetch_ref_no_id(self):
        response = self.client.post(
            "/fetch-pr",
            data=json.dumps({"ref_type": "pr"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_fetch_ref_invalid_pr_id(self):
        response = self.client.post(
            "/fetch-pr",
            data=json.dumps({"ref_type": "pr", "ref_id": "not-a-number"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_fetch_ref_get_not_allowed(self):
        response = self.client.get("/fetch-pr")
        self.assertEqual(response.status_code, 405)


class JourneysAPITest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_journeys_api_returns_json(self):
        response = self.client.get("/api/journeys")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")

    def test_journeys_api_post_not_allowed(self):
        response = self.client.post("/api/journeys")
        self.assertEqual(response.status_code, 405)
