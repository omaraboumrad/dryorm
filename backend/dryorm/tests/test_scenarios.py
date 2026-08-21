"""End-to-end scenarios driven through tasks.run_django_sync.

Each test spawns a real executor container: run.sh writes the snippet, Django
migrates it, and the result comes back through the same path a request uses.
Requires the compose stack up and executor images built.
"""

import pytest

from dryorm import constants

pytestmark = [pytest.mark.integration, pytest.mark.cross_backend]


BLOG = """
    from django.db import models

    class Author(models.Model):
        name = models.CharField(max_length=100)

    class Post(models.Model):
        title = models.CharField(max_length=200)
        author = models.ForeignKey(Author, on_delete=models.CASCADE)

    def run():
        author = Author.objects.create(name="Ada")
        Post.objects.create(title="First", author=author)
        Post.objects.create(title="Second", author=author)
        return {"posts": Post.objects.count()}
"""


class TestBasicExecution:
    def test_returns_what_run_returns(self, run):
        result = run(BLOG)
        assert result["returned"] == {"posts": 2}

    def test_payload_carries_the_documented_keys(self, run):
        result = run(BLOG)
        assert set(result) >= {"output", "outputs", "erd", "queries", "returned"}

    def test_captures_printed_output(self, run):
        result = run(
            """
            def run():
                print("hello from the snippet")
                return {}
            """
        )
        assert "hello from the snippet" in result["output"]

    def test_attributes_prints_to_their_line(self, run):
        result = run(
            """
            def run():
                print("first")
                print("second")
                return {}
            """
        )
        assert [o["output"] for o in result["outputs"]] == ["first", "second"]
        assert result["outputs"][0]["line_number"] < result["outputs"][1]["line_number"]

    def test_snippet_without_run_still_succeeds(self, run):
        result = run(
            """
            from django.db import models

            class Thing(models.Model):
                name = models.CharField(max_length=10)
            """
        )
        assert result["returned"] == {}


class TestMigrationDDL:
    def test_emits_create_table_for_snippet_models(self, run):
        result = run(BLOG)
        ddl = [q["sql"] for q in result["queries"] if "CREATE TABLE" in q["sql"]]
        assert any("app_author" in sql for sql in ddl)
        assert any("app_post" in sql for sql in ddl)

    def test_ddl_precedes_the_snippet_queries(self, run):
        result = run(BLOG)
        sqls = [q["sql"] for q in result["queries"]]
        first_create = next(i for i, s in enumerate(sqls) if "CREATE TABLE" in s)
        first_insert = next(i for i, s in enumerate(sqls) if "INSERT" in s)
        assert first_create < first_insert


class TestQueryCapture:
    def test_records_the_queries_the_snippet_runs(self, run):
        result = run(BLOG)
        assert any("INSERT" in q["sql"] for q in result["queries"])
        assert any("COUNT" in q["sql"].upper() for q in result["queries"])

    def test_interpolates_values_into_sql(self, run):
        result = run(BLOG)
        assert any("Ada" in q["sql"] for q in result["queries"])

    def test_keeps_the_uninterpolated_template(self, run):
        result = run(BLOG)
        inserts = [q for q in result["queries"] if "INSERT" in q["sql"]]
        assert any("%s" in q["template"] for q in inserts)

    def test_attributes_queries_to_snippet_lines(self, run):
        result = run(BLOG)
        runtime = [q for q in result["queries"] if q.get("line_number") is not None]
        assert runtime, "no query was attributed to a line"

    def test_shows_the_n_plus_one(self, run):
        """The tool's core use case: proving a query count difference."""
        naive = run(
            BLOG.replace(
                'return {"posts": Post.objects.count()}',
                'return {"titles": [p.author.name for p in Post.objects.all()]}',
            )
        )
        joined = run(
            BLOG.replace(
                'return {"posts": Post.objects.count()}',
                'return {"titles": [p.author.name for p in'
                ' Post.objects.select_related("author")]}',
            )
        )
        assert len(naive["queries"]) > len(joined["queries"])

    def test_do_not_log_hides_queries(self, run):
        visible = run(
            """
            from django.db import models

            class Thing(models.Model):
                name = models.CharField(max_length=10)

            def run():
                Thing.objects.create(name="a")
                return {}
            """
        )
        hidden = run(
            """
            from django.db import models

            class Thing(models.Model):
                name = models.CharField(max_length=10)

            def run():
                with _do_not_log():
                    Thing.objects.create(name="a")
                return {}
            """
        )
        assert len(hidden["queries"]) < len(visible["queries"])


class TestERD:
    def test_produces_a_diagram(self, run):
        assert run(BLOG)["erd"]

    def test_diagram_changes_with_the_model_graph(self, run):
        standalone = run(
            """
            from django.db import models

            class Solo(models.Model):
                name = models.CharField(max_length=10)
            """
        )
        assert run(BLOG)["erd"] != standalone["erd"]


class TestFailureModes:
    def test_syntax_error_is_reported_as_a_code_error(self, run_raw):
        reply = run_raw("def run(:\n    pass\n")
        assert reply["event"] == constants.JOB_CODE_ERROR_EVENT
        assert reply["error"]

    def test_runtime_exception_is_reported_as_a_code_error(self, run_raw):
        reply = run_raw(
            """
            def run():
                raise ValueError("boom")
            """
        )
        assert reply["event"] == constants.JOB_CODE_ERROR_EVENT
        assert "boom" in reply["error"]

    def test_traceback_reaches_the_user(self, run_raw):
        reply = run_raw(
            """
            def run():
                return 1 / 0
            """
        )
        assert "ZeroDivisionError" in reply["error"]

    def test_infinite_loop_times_out(self, run_raw):
        reply = run_raw(
            """
            def run():
                while True:
                    pass
            """
        )
        assert reply["event"] == constants.JOB_TIMEOUT_EVENT

    def test_network_access_is_blocked(self, run_raw):
        reply = run_raw(
            """
            import urllib.request

            def run():
                urllib.request.urlopen("http://example.com", timeout=5)
                return {}
            """
        )
        assert reply["event"] == constants.JOB_NETWORK_DISABLED_EVENT

    def test_memory_hog_is_killed(self, run_raw):
        reply = run_raw(
            """
            def run():
                blob = []
                while True:
                    blob.append("x" * 10_000_000)
            """
        )
        assert reply["event"] == constants.JOB_OOM_KILLED_EVENT


class TestIsolation:
    def test_a_run_does_not_see_a_previous_run_s_rows(self, run):
        snippet = """
            from django.db import models

            class Thing(models.Model):
                name = models.CharField(max_length=10)

            def run():
                Thing.objects.create(name="a")
                return {"count": Thing.objects.count()}
        """
        assert run(snippet)["returned"] == {"count": 1}
        assert run(snippet)["returned"] == {"count": 1}
