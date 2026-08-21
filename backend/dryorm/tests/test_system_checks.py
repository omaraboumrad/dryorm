"""Django's system check framework, as the user experiences it.

run_snippet keeps BaseCommand's default requires_system_checks, so checks run
before the snippet's models are migrated. A check *error* aborts the run and
the report is what the user gets instead of a result; a check *warning* does
not. The message matters as much as the failure here: these are the mistakes a
learner makes, and the check output is the teaching.
"""

import pytest

from dryorm import constants

pytestmark = [pytest.mark.integration, pytest.mark.cross_backend]

CLASHING_ACCESSORS = """
    from django.db import models

    class Author(models.Model):
        name = models.CharField(max_length=50)

    class Post(models.Model):
        writer = models.ForeignKey(Author, on_delete=models.CASCADE)
        editor = models.ForeignKey(Author, on_delete=models.CASCADE)
"""


class TestCheckErrorsAbortTheRun:
    def test_clashing_reverse_accessors(self, run_raw):
        reply = run_raw(CLASHING_ACCESSORS)
        assert reply["event"] == constants.JOB_CODE_ERROR_EVENT
        assert "fields.E304" in reply["error"]

    def test_decimal_field_missing_its_arguments_on_django_6_0(self, run_raw):
        reply = run_raw(
            """
            from django.db import models

            class Product(models.Model):
                price = models.DecimalField()
            """,
            orm_version="django-6.0",
        )
        assert reply["event"] == constants.JOB_CODE_ERROR_EVENT
        assert "fields.E130" in reply["error"]
        assert "fields.E132" in reply["error"]

    def test_ordering_referring_to_an_unknown_field(self, run_raw):
        reply = run_raw(
            """
            from django.db import models

            class Thing(models.Model):
                name = models.CharField(max_length=10)

                class Meta:
                    ordering = ["nope"]
            """
        )
        assert reply["event"] == constants.JOB_CODE_ERROR_EVENT
        assert "models.E015" in reply["error"]


class TestCheckErrorsAreLegible:
    def test_the_hint_reaches_the_user(self, run_raw):
        reply = run_raw(CLASHING_ACCESSORS)
        assert "HINT" in reply["error"]
        assert "related_name" in reply["error"]

    def test_the_offending_field_is_named(self, run_raw):
        reply = run_raw(CLASHING_ACCESSORS)
        assert "app.Post.writer" in reply["error"]
        assert "app.Post.editor" in reply["error"]

    def test_the_report_is_not_truncated_to_the_first_problem(self, run_raw):
        # Both halves of a clash are reported, not just the one Django hits first.
        reply = run_raw(CLASHING_ACCESSORS)
        assert reply["error"].count("fields.E304") == 2


class TestChecksThatShouldNotAbort:
    def test_a_warning_still_lets_the_snippet_run(self, run):
        # null=True on ManyToManyField raises W340, a warning rather than an error.
        result = run(
            """
            from django.db import models

            class Tag(models.Model):
                label = models.CharField(max_length=10)

            class Post(models.Model):
                tags = models.ManyToManyField(Tag, null=True)

            def run():
                return {"ok": True}
            """
        )
        assert result["returned"] == {"ok": True}

    def test_decimal_field_arguments_are_optional_except_on_mysql(
        self, run_raw, default_database
    ):
        # Django 6.0 rejected this everywhere; 6.1 accepts it wherever the
        # backend can express an unbounded NUMERIC. MySQL cannot, so the check
        # still fires there.
        reply = run_raw(
            """
            from django.db import models

            class Product(models.Model):
                price = models.DecimalField()

            def run():
                return {"ok": True}
            """
        )
        if default_database == "mariadb":
            assert reply["event"] == constants.JOB_CODE_ERROR_EVENT
            assert "fields.E130" in reply["error"]
            assert "fields.E132" in reply["error"]
        else:
            assert reply["result"]["returned"] == {"ok": True}

    def test_charfield_without_max_length_except_on_mysql(
        self, run_raw, default_database
    ):
        # max_length stopped being required, but only where VARCHAR can be
        # unbounded. MySQL needs a length, so fields.E120 still fires there.
        reply = run_raw(
            """
            from django.db import models

            class Thing(models.Model):
                name = models.CharField()

            def run():
                Thing.objects.create(name="x")
                return {"n": Thing.objects.count()}
            """
        )
        if default_database == "mariadb":
            assert reply["event"] == constants.JOB_CODE_ERROR_EVENT
            assert "fields.E120" in reply["error"]
        else:
            assert reply["result"]["returned"] == {"n": 1}
