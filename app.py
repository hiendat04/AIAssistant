from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from models.services.pii_service import extract_pii
from werkzeug.utils import secure_filename
import os
import whisper

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/analyze-speech', methods=['POST'])
def analyze_speech():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file sent"}), 400

    audio = request.files["audio"]
    filename = secure_filename(audio.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    audio.save(save_path)

    #  Transcribe audio whis whisper
    model = whisper.load_model("turbo")
    result = model.transcribe(save_path)
    transcription = result['text'].title()
    print(f'Transcription: {transcription}')

    # Extract PII information
    pii = extract_pii(transcription)
    return jsonify(pii), 200


if __name__ == '__main__':
    app.run(debug=True)
