import speech_recognition as sr
import whisper
from pydub import AudioSegment
import os
import logging

logger = logging.getLogger(__name__)

class VoiceToTextService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.whisper_model = None
        self._load_whisper_model()
    
    def _load_whisper_model(self):
        """Load Whisper model for transcription"""
        try:
            self.whisper_model = whisper.load_model("base")
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load Whisper model: {str(e)}")
    
    def transcribe_audio(self, audio_path, method='whisper', language='en'):
        """Transcribe audio to text"""
        try:
            if method == 'whisper' and self.whisper_model:
                return self._transcribe_with_whisper(audio_path, language)
            else:
                return self._transcribe_with_sr(audio_path, language)
                
        except Exception as e:
            logger.error(f"Error transcribing audio: {str(e)}")
            raise
    
    def _transcribe_with_whisper(self, audio_path, language):
        """Transcribe using Whisper"""
        result = self.whisper_model.transcribe(audio_path, language=language)
        
        return {
            'text': result['text'],
            'language': result.get('language', language),
            'segments': [
                {
                    'start': seg['start'],
                    'end': seg['end'],
                    'text': seg['text']
                } for seg in result.get('segments', [])
            ],
            'confidence': 0.9  # Whisper doesn't provide confidence scores
        }
    
    def _transcribe_with_sr(self, audio_path, language):
        """Transcribe using SpeechRecognition"""
        # Convert audio format if needed
        audio = AudioSegment.from_file(audio_path)
        wav_path = audio_path.rsplit('.', 1)[0] + '.wav'
        audio.export(wav_path, format='wav')
        
        try:
            with sr.AudioFile(wav_path) as source:
                audio_data = self.recognizer.record(source)
            
            # Try Google Speech Recognition
            try:
                text = self.recognizer.recognize_google(audio_data, language=language)
                confidence = 0.8
            except sr.UnknownValueError:
                text = "Could not understand audio"
                confidence = 0.0
            except sr.RequestError:
                # Fallback to offline recognition
                text = self.recognizer.recognize_sphinx(audio_data)
                confidence = 0.6
            
            # Clean up
            if os.path.exists(wav_path) and wav_path != audio_path:
                os.remove(wav_path)
            
            return {
                'text': text,
                'language': language,
                'confidence': confidence,
                'segments': []
            }
            
        except Exception as e:
            logger.error(f"SR transcription error: {str(e)}")
            raise
    
    def transcribe_meeting(self, audio_path, speakers=None):
        """Transcribe meeting with speaker identification"""
        try:
            transcription = self.transcribe_audio(audio_path)
            
            # Add speaker labels if provided
            if speakers and transcription.get('segments'):
                for i, segment in enumerate(transcription['segments']):
                    # Simple speaker assignment (in production, use diarization)
                    speaker_id = speakers[i % len(speakers)] if speakers else 'unknown'
                    segment['speaker'] = speaker_id
            
            return {
                'transcription': transcription,
                'summary': self._generate_meeting_summary(transcription['text']),
                'action_items': self._extract_action_items(transcription['text'])
            }
            
        except Exception as e:
            logger.error(f"Error transcribing meeting: {str(e)}")
            raise
    
    def _generate_meeting_summary(self, text):
        """Generate summary of meeting transcription"""
        # Simple extractive summary (in production, use abstractive summarization)
        sentences = text.split('.')
        if len(sentences) > 3:
            summary = '. '.join(sentences[:3]) + '.'
        else:
            summary = text
        
        return summary
    
    def _extract_action_items(self, text):
        """Extract action items from transcription"""
        # Simple keyword-based extraction
        action_keywords = ['action', 'todo', 'task', 'follow up', 'next steps']
        sentences = text.split('.')
        
        action_items = []
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in action_keywords):
                action_items.append(sentence.strip())
        
        return action_items
