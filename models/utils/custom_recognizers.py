from typing import List, Optional
from presidio_analyzer import Pattern, PatternRecognizer


class VietnameseDateRecognizer(PatternRecognizer):
    """
    Recognize Vietnamese date using regex.

    Supported formats:
    - 04/04/2003 or 4/4/2003
    - 04-04-2003 or 4-4-2003
    - 4 tháng 4 năm 2003
    - ngày 4 tháng 4 năm 2003
    """

    PATTERNS = [
        Pattern(
            "dd/mm/yyyy",
            r"\b([1-9]|0[1-9]|[1-2][0-9]|3[0-1])/([1-9]|0[1-9]|1[0-2])/(\d{4})\b",
            0.6
        ),
        Pattern(
            "dd-mm-yyyy",
            r"\b([1-9]|0[1-9]|[1-2][0-9]|3[0-1])-([1-9]|0[1-9]|1[0-2])-(\d{4})\b",
            0.6
        ),
        Pattern(
            "Ngày X tháng Y năm Z",
            r"(ngày\s*)?([1-9]|0[1-9]|[1-2][0-9]|3[0-1])\s*tháng\s*([1-9]|0[1-9]|1[0-2])\s*năm\s*\d{4}",
            0.7
        ),
    ]

    CONTEXT = ["ngày", "tháng", "năm", "sinh", "sinh nhật"]

    def __init__(
        self,
        patterns: Optional[List[Pattern]] = None,
        context: Optional[List[str]] = None,
        supported_language: str = "en",
        supported_entity: str = "DATE_TIME",
    ):
        patterns = patterns if patterns else self.PATTERNS
        context = context if context else self.CONTEXT
        super().__init__(
            supported_entity=supported_entity,
            patterns=patterns,
            context=context,
            supported_language=supported_language,
        )
