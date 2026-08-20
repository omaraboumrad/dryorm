import builtins
import inspect
import io


class LineAwarePrintCapture:
    """Captures print statements with their line numbers from user code"""

    def __init__(self):
        self.outputs = []
        self.user_code_lines = []
        self.original_print = builtins.print
        self.output_buffer = io.StringIO()

    def set_user_code(self, code):
        """Store user code lines for line number tracking"""
        self.user_code_lines = code.splitlines()

    def get_user_code_line(self):
        """Extract line number from user code in the stack trace"""
        try:
            stack = inspect.stack()
            for frame_info in stack:
                if frame_info.filename == "/app/app/models.py":
                    line_number = frame_info.lineno
                    if self.user_code_lines and 1 <= line_number <= len(
                        self.user_code_lines
                    ):
                        return {
                            "line_number": line_number,
                            "source_context": self.user_code_lines[
                                line_number - 1
                            ].strip(),
                        }
        except Exception:
            pass
        return {}

    def tracked_print(self, *args, **kwargs):
        """Replacement print function that tracks line numbers"""
        line_info = self.get_user_code_line()

        # Capture the output
        output = io.StringIO()
        self.original_print(
            *args, file=output, **{k: v for k, v in kwargs.items() if k != "file"}
        )
        output_text = output.getvalue().rstrip("\n")

        # Store with line info
        self.outputs.append(
            {
                "line_number": line_info.get("line_number"),
                "output": output_text,
            }
        )

        # Also write to the buffer for combined output
        self.original_print(
            *args,
            file=self.output_buffer,
            **{k: v for k, v in kwargs.items() if k != "file"}
        )

    def patch(self):
        """Install the tracked print function"""
        builtins.print = self.tracked_print

    def restore(self):
        """Restore the original print function"""
        builtins.print = self.original_print

    def get_combined_output(self):
        """Get all output as a single string"""
        return self.output_buffer.getvalue()
