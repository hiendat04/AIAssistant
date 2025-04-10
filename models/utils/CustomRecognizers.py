import re
from presidio_analyzer import EntityRecognizer, RecognizerResult
from typing import List
from presidio_analyzer.nlp_engine import NlpArtifacts


class NameRecognizer(EntityRecognizer):
    def __init__(self):
        super().__init__(supported_entities=[
            "PERSON"], name="VN Name Recognizer", context=['Name'])

    def load(self):
        pass

    def analyze(
            self, text: str, entities: List[str], nlp_artifacts: NlpArtifacts
    ) -> List[RecognizerResult]:
        results = []

        if "PERSON" not in entities:
            return results

        trigger_phrases = ["my name is", "i am", "i'm"]  # có thể mở rộng
        trigger_index = -1

        # Tìm vị trí cụm "my name is" trong văn bản
        for phrase in trigger_phrases:
            idx = text.lower().find(phrase)
            if idx != -1:
                trigger_index = idx + len(phrase)
                break

        for ent in nlp_artifacts.entities:
            if ent.label_ == "PERSON":
                entity_start = ent.start_char

                # Nếu tìm thấy trigger phrase và entity nằm sau đó (trong khoảng gần)
                if trigger_index != -1 and entity_start > trigger_index and entity_start - trigger_index < 50:
                    results.append(
                        RecognizerResult(
                            entity_type="PERSON",
                            start=ent.start_char,
                            end=ent.end_char,
                            score=0.95  # độ tin cậy cao hơn do có ngữ cảnh
                        )
                    )
        return results


class IDRecognizer(EntityRecognizer):
    def __init__(self):
        super().__init__(
            supported_entities=["VN_ID"],
            name="VN ID Recognizer",
        )
        # Hỗ trợ 9-12 chữ số, cho phép 1 dấu cách ở giữa các cụm số
        self.pattern = re.compile(
            r"\b(?:\d{3}(?:\s\d{3}){3})\b|\b(?:\d{3}\s?\d{9})\b"
        )

    def load(self):
        pass

    def analyze(self, text, entities, nlp_artifacts):
        results = []
        for match in self.pattern.finditer(text):
            raw = match.group()
            # Loại bỏ khoảng trắng để xét độ dài
            digits_only = raw.replace(" ", "")
            # CCCD Việt Nam thường có 12 chữ số
            if 9 <= len(digits_only) <= 12:
                context = text[max(0, match.start() - 30)                               :match.start()].lower()
                if any(keyword in context for keyword in ["identity", "citizenship", "id", "citizenship identity", "citizen_identity"]):
                    results.append(RecognizerResult(
                        entity_type="VN_ID",
                        start=match.start(),
                        end=match.end(),
                        score=0.9
                    ))
        return results


class PhoneRecognizer(EntityRecognizer):
    def __init__(self, **kwargs):
        super().__init__(
            supported_entities=["VN_PHONE"],
            name="VN Phone Recognizer",
            **kwargs
        )
        self.pattern = re.compile(
            r"\b(?:\+84|0)?\s?(3[2-9]|5[6|8|9]|7[06-9]|8[1-5]|9[0-9])\s?\d{3}\s?\d{4}\b")

    def load(self):
        pass

    def analyze(self, text, entities, nlp_artifacts):
        results = []
        for match in self.pattern.finditer(text):
            results.append(RecognizerResult(
                entity_type="VN_PHONE",
                start=match.start(),
                end=match.end(),
                score=0.95
            ))

        # Context-based fallback for numbers not matched above
        fallback_pattern = re.compile(r"\b\d{9,12}\b")
        for match in fallback_pattern.finditer(text):
            context = text[max(0, match.start() - 30):match.start()].lower()
            if any(word in context for word in ["phone", "mobile", "contact", "call", "my number is"]):
                results.append(RecognizerResult(
                    entity_type="VN_PHONE",
                    start=match.start(),
                    end=match.end(),
                    score=0.85
                ))

        return results
