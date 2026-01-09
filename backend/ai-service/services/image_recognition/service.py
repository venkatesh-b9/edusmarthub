import cv2
import face_recognition
import numpy as np
from PIL import Image
import os
import logging

logger = logging.getLogger(__name__)

class ImageRecognitionService:
    def __init__(self):
        self.known_faces = {}
        self.known_encodings = []
        self.known_ids = []
    
    def register_face(self, student_id, image_path):
        """Register a face for recognition"""
        try:
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)
            
            if not encodings:
                raise ValueError("No face detected in image")
            
            encoding = encodings[0]
            self.known_faces[student_id] = encoding
            self.known_encodings.append(encoding)
            self.known_ids.append(student_id)
            
            logger.info(f"Registered face for student {student_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error registering face: {str(e)}")
            raise
    
    def recognize_face(self, image_path, tolerance=0.6):
        """Recognize face in image"""
        try:
            image = face_recognition.load_image_file(image_path)
            face_locations = face_recognition.face_locations(image)
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if not face_encodings:
                return {
                    'faces_detected': 0,
                    'recognitions': []
                }
            
            recognitions = []
            for face_encoding, face_location in zip(face_encodings, face_locations):
                # Compare with known faces
                matches = face_recognition.compare_faces(
                    self.known_encodings,
                    face_encoding,
                    tolerance=tolerance
                )
                face_distances = face_recognition.face_distance(
                    self.known_encodings,
                    face_encoding
                )
                
                best_match_index = np.argmin(face_distances) if matches else None
                
                if best_match_index is not None and matches[best_match_index]:
                    recognitions.append({
                        'student_id': self.known_ids[best_match_index],
                        'confidence': float(1 - face_distances[best_match_index]),
                        'location': {
                            'top': int(face_location[0]),
                            'right': int(face_location[1]),
                            'bottom': int(face_location[2]),
                            'left': int(face_location[3])
                        }
                    })
                else:
                    recognitions.append({
                        'student_id': None,
                        'confidence': 0,
                        'location': {
                            'top': int(face_location[0]),
                            'right': int(face_location[1]),
                            'bottom': int(face_location[2]),
                            'left': int(face_location[3])
                        }
                    })
            
            return {
                'faces_detected': len(face_locations),
                'recognitions': recognitions
            }
            
        except Exception as e:
            logger.error(f"Error recognizing face: {str(e)}")
            raise
    
    def detect_objects(self, image_path):
        """Detect objects in image (for security/attendance)"""
        try:
            # Load pre-trained YOLO or similar model
            # For now, use OpenCV for basic detection
            image = cv2.imread(image_path)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Face detection
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            # Person detection (simplified)
            hog = cv2.HOGDescriptor()
            hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
            people, _ = hog.detectMultiScale(gray)
            
            return {
                'faces_detected': len(faces),
                'people_detected': len(people),
                'face_locations': [{'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)} for (x, y, w, h) in faces],
                'person_locations': [{'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)} for (x, y, w, h) in people]
            }
            
        except Exception as e:
            logger.error(f"Error detecting objects: {str(e)}")
            raise
    
    def process_attendance_image(self, image_path, class_id):
        """Process image for attendance marking"""
        try:
            recognition_result = self.recognize_face(image_path)
            
            attendance_records = []
            for recognition in recognition_result['recognitions']:
                if recognition['student_id'] and recognition['confidence'] > 0.7:
                    attendance_records.append({
                        'student_id': recognition['student_id'],
                        'class_id': class_id,
                        'method': 'facial_recognition',
                        'confidence': recognition['confidence'],
                        'timestamp': str(logger.handlers[0].formatter.formatTime(logger.makeRecord('', 0, '', 0, '', (), None)) if logger.handlers else '')
                    })
            
            return {
                'total_faces': recognition_result['faces_detected'],
                'recognized_students': len(attendance_records),
                'attendance_records': attendance_records
            }
            
        except Exception as e:
            logger.error(f"Error processing attendance image: {str(e)}")
            raise
