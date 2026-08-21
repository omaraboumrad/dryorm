"""The same scenario across every database and Django version we ship.

These are the combinations constants.EXECUTORS advertises to the frontend; if
one of them has no image, or its executor cannot migrate a model, users hit it
directly from the version picker.
"""

import pytest

from dryorm import constants

pytestmark = pytest.mark.integration

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
        return {
            "posts": Post.objects.count(),
            "author": Post.objects.get().author.name,
        }
"""

DATABASES = ["sqlite", "postgres", "mariadb", "postgis"]
ORM_VERSIONS = list(constants.ORM_VERSIONS)


@pytest.mark.parametrize("database", DATABASES)
class TestEveryDatabase:
    def test_runs_the_scenario(self, run, database):
        assert run(BLOG, database=database)["returned"] == {
            "posts": 1,
            "author": "Ada",
        }

    def test_creates_the_tables(self, run, database):
        result = run(BLOG, database=database)
        assert any("CREATE TABLE" in q["sql"] for q in result["queries"])

    def test_captures_the_insert(self, run, database):
        result = run(BLOG, database=database)
        assert any("INSERT" in q["sql"] for q in result["queries"])


@pytest.mark.parametrize("orm_version", ORM_VERSIONS)
class TestEveryDjangoVersion:
    def test_runs_the_scenario(self, run, orm_version):
        assert run(BLOG, orm_version=orm_version)["returned"]["posts"] == 1

    def test_reports_its_own_version(self, run, orm_version):
        result = run(
            """
            import django

            def run():
                return {"version": django.get_version()}
            """,
            orm_version=orm_version,
        )
        expected = orm_version.removeprefix("django-")
        assert result["returned"]["version"].startswith(expected)


class TestPostGIS:
    def test_supports_geometry_fields(self, run):
        result = run(
            """
            from django.contrib.gis.db import models
            from django.contrib.gis.geos import Point

            class Store(models.Model):
                name = models.CharField(max_length=50)
                location = models.PointField()

            def run():
                Store.objects.create(name="HQ", location=Point(35.5, 33.9))
                return {"lon": Store.objects.get().location.x}
            """,
            database="postgis",
        )
        assert result["returned"]["lon"] == pytest.approx(35.5)


class TestCaching:
    def test_second_identical_run_is_served_from_cache(
        self, run_cached, unique_snippet
    ):
        code = unique_snippet('return {"n": 1}')
        first = run_cached(code)
        second = run_cached(code)
        assert first == second

    def test_cache_is_scoped_per_database(self, run_cached, unique_snippet):
        code = unique_snippet(
            'from django.db import connection; return {"vendor": connection.vendor}'
        )
        sqlite = run_cached(code, database="sqlite")
        postgres = run_cached(code, database="postgres")
        assert sqlite["result"]["returned"]["vendor"] == "sqlite"
        assert postgres["result"]["returned"]["vendor"] == "postgresql"

    def test_cache_is_scoped_per_orm_version(self, run_cached, unique_snippet):
        code = unique_snippet(
            'import django; return {"version": django.get_version()}'
        )
        old = run_cached(code, orm_version="django-4.2.26")
        new = run_cached(code, orm_version="django-6.0")
        assert old["result"]["returned"] != new["result"]["returned"]
