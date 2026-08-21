"""Output produced outside run().

Module-level code executes when Django imports models.py, which happens before
the execute command starts. manage.py installs a print capture up front and the
command drains it into the front of the output, so module-level lines always
precede whatever run() prints, whatever order they appear in the source.
"""

import pytest

pytestmark = pytest.mark.integration


class TestModuleLevelOrdering:
    def test_module_level_prints_come_before_run_output(self, run):
        result = run(
            """
            print(1)
            def run():
                print(2)
            print(3)
            """
        )
        assert result["output"] == "1\n3\n2\n"

    def test_module_level_prints_keep_their_own_order(self, run):
        result = run(
            """
            print("first")
            print("second")
            print("third")
            """
        )
        assert result["output"] == "first\nsecond\nthird\n"

    def test_run_output_keeps_its_own_order(self, run):
        result = run(
            """
            print("module")

            def run():
                print("a")
                print("b")
                return {}
            """
        )
        assert result["output"] == "module\na\nb\n"

    def test_interleaved_definitions_do_not_reorder_output(self, run):
        result = run(
            """
            print("before model")

            from django.db import models

            class Thing(models.Model):
                name = models.CharField(max_length=10)

            print("after model")

            def run():
                print("inside run")
                return {}
            """
        )
        assert result["output"] == "before model\nafter model\ninside run\n"

    def test_prints_from_a_class_body_are_module_level(self, run):
        result = run(
            """
            from django.db import models

            class Thing(models.Model):
                print("in class body")
                name = models.CharField(max_length=10)

            def run():
                print("in run")
                return {}
            """
        )
        assert result["output"] == "in class body\nin run\n"

    def test_module_level_loops_are_captured(self, run):
        result = run(
            """
            for i in range(3):
                print(i)
            """
        )
        assert result["output"] == "0\n1\n2\n"


class TestWithoutRun:
    def test_module_level_output_survives_a_missing_run(self, run):
        result = run(
            """
            print("only this")
            """
        )
        assert result["output"] == "only this\n"

    def test_module_level_output_survives_an_empty_run(self, run):
        result = run(
            """
            print("module")

            def run():
                pass
            """
        )
        assert result["output"] == "module\n"


class TestLineAttribution:
    def test_run_prints_are_attributed_to_their_line(self, run):
        result = run(
            """
            print(1)
            def run():
                print(2)
            print(3)
            """
        )
        assert result["outputs"] == [{"line_number": 3, "output": "2"}]

    def test_module_level_prints_are_absent_from_outputs(self, run):
        """They reach `output` but never `outputs`.

        The command takes only get_combined_output() off the manage.py capture,
        not its line-aware entries, so the editor gutter cannot annotate them.
        """
        result = run(
            """
            print("module one")
            print("module two")

            def run():
                print("from run")
                return {}
            """
        )
        assert [o["output"] for o in result["outputs"]] == ["from run"]
        assert "module one" in result["output"]

    def test_outputs_is_empty_when_only_module_level_printed(self, run):
        result = run(
            """
            print("module only")

            def run():
                return {}
            """
        )
        assert result["outputs"] == []


class TestFormatting:
    def test_multi_argument_prints_are_joined(self, run):
        result = run(
            """
            print("a", "b", "c")

            def run():
                print("x", "y")
                return {}
            """
        )
        assert result["output"] == "a b c\nx y\n"

    def test_sep_is_honoured(self, run):
        result = run(
            """
            print("a", "b", sep="-")
            """
        )
        assert result["output"] == "a-b\n"

    def test_non_string_values_are_rendered(self, run):
        result = run(
            """
            print({"a": 1}, [1, 2], None)
            """
        )
        assert result["output"] == "{'a': 1} [1, 2] None\n"


class TestBackslashEscapes:
    """Escape sequences a user types inside a string literal.

    run.sh writes the snippet with `printf '%s\\n'` rather than `echo`,
    because /bin/sh is dash and its builtin echo expands backslash escapes
    before Python ever parses the file.
    """

    def test_newline_escape_survives(self, run):
        result = run(
            """
            def run():
                print("a\\nb")
                return {}
            """
        )
        assert result["output"] == "a\nb\n"

    def test_escaped_backslash_survives(self, run):
        result = run(
            """
            def run():
                return {"s": "a\\\\b"}
            """
        )
        assert result["returned"] == {"s": "a\\b"}

    def test_a_windows_path_survives(self, run):
        result = run(
            """
            def run():
                return {"path": "C:\\\\Users\\\\new"}
            """
        )
        assert result["returned"] == {"path": "C:\\Users\\new"}
