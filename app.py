from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from models.services.PIIService import extract_speech_information

app = Flask(__name__)
CORS(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/analyze-speech', methods=['POST'])
def analyze_speech():
    data = request.get_json()
    transcription = data.get('transcription')
    if transcription:
        response = extract_speech_information(transcription)
        return response
    return {"error": "No transcription received"}, 400


if __name__ == '__main__':
    app.run(debug=True)
