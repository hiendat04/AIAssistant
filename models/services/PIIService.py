from presidio_analyzer import AnalyzerEngine
from models.utils.CustomRecognizers import NameRecognizer, IDRecognizer, PhoneRecognizer
from deep_translator import GoogleTranslator


def extract_speech_information(text):
    transcription = text.title()

    translation = GoogleTranslator(
        source='vi', target='en').translate(transcription)

    print(f'Translation: {translation}')

    # Init custom rule based recognizer
    name_recognizer = NameRecognizer()
    id_recognizer = IDRecognizer()
    phone_recognizer = PhoneRecognizer()

    # Init analyzer
    analyzer = AnalyzerEngine()

    # Registry recognizers
    # analyzer.registry.add_recognizers_from_yaml(r"models\utils\recognizers.yml")
    analyzer.registry.add_recognizer(name_recognizer)
    analyzer.registry.add_recognizer(id_recognizer)
    analyzer.registry.add_recognizer(phone_recognizer)

    # Processing
    results = analyzer.analyze(text=translation,
                               entities=['EMAIL_ADDRESS', 'DATE_TIME',
                                         'PERSON', 'VN_PHONE', 'VN_ID', 'LOCATION'],
                               language='en')
    output = []
    for result in results:
        if result.entity_type == "PERSON" and result.score < 0.95:
            continue
        entity_info = translation[result.start:result.end]
        output.append({
            "entity": result.entity_type,
            "info": entity_info,
            "score": result.score
        })

    return output
