from presidio_analyzer import AnalyzerEngine, RecognizerRegistry
from presidio_analyzer.nlp_engine import TransformersNlpEngine
from models.utils.custom_recognizers import VietnameseDateRecognizer


def extract_pii(text):
    # Define which transformers model to use
    model_config = [{
        "lang_code": "en", "model_name": {
            # Use a transformer-compatible spaCy model
            "spacy": "en_core_web_lg",
            "transformers": "NlpHUST/ner-vietnamese-electra-base"
        }
    }]

    nlp_engine = TransformersNlpEngine(models=model_config)

    registry = RecognizerRegistry()
    registry.load_predefined_recognizers()
    registry.add_recognizers_from_yaml(r"models\utils\recognizers.yml")
    registry.add_recognizer(VietnameseDateRecognizer())

    # Set up the engine, loads the NLP module (spaCy model by default)
    # and other PII recognizers
    analyzer = AnalyzerEngine(nlp_engine=nlp_engine, registry=registry)
    results = analyzer.analyze(text=text,
                               entities=['DATE_TIME', 'LOCATION',
                                         'VN_PHONE', 'VN_ID', 'PERSON'],
                               language='en')

    output = []
    # Call analyzer to get results
    for r in results:
        output.append({
            'entity': r.entity_type,
            'info': text[r.start:r.end],
            'score': float(r.score)
        })
    return output
