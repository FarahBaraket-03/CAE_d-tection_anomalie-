"""
Configuration du système de détection d'anomalies
"""
import os
from pathlib import Path

# Chemins
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / 'model_ai'

# Modèles disponibles
MODELS = {
    'best_cae': {
        'name': 'Best CAE Model',
        'description': 'Meilleur modèle d\'autoencoder convolutif',
        'path': MODEL_DIR / 'best_cae.pth',
        'latent_dim': 128
    },
    'cae_optuna': {
        'name': 'CAE Optuna Optimized',
        'description': 'Modèle optimisé avec Optuna',
        'path': MODEL_DIR / 'cae_optuna_final.pth',
        'latent_dim': 128
    }
}

# Configuration du serveur
SERVER_CONFIG = {
    'host': '0.0.0.0',
    'port': 5000,
    'debug': True
}

# Configuration des images
IMAGE_CONFIG = {
    'target_size': (360, 240),  # (width, height)
    'channels': 1,  # Grayscale
    'normalize': True,
    'allowed_extensions': {'.jpg', '.jpeg', '.png', '.tif', '.tiff'}
}

# Configuration de la détection
DETECTION_CONFIG = {
    'default_threshold': 0.02,
    'min_threshold': 0.005,
    'max_threshold': 0.1,
    'threshold_step': 0.005
}

# Configuration CORS
CORS_CONFIG = {
    'origins': '*',
    'methods': ['GET', 'POST'],
    'allow_headers': ['Content-Type']
}

# Limites
LIMITS = {
    'max_file_size': 10 * 1024 * 1024,  # 10 MB
    'max_batch_size': 50,  # Nombre maximum d'images par lot
    'request_timeout': 300  # 5 minutes
}

# Logging
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': 'anomaly_detection.log'
}

def get_model_config(model_id):
    """Récupère la configuration d'un modèle"""
    return MODELS.get(model_id)

def validate_file_extension(filename):
    """Vérifie si l'extension du fichier est autorisée"""
    ext = os.path.splitext(filename)[1].lower()
    return ext in IMAGE_CONFIG['allowed_extensions']

def get_all_model_ids():
    """Retourne la liste de tous les IDs de modèles"""
    return list(MODELS.keys())
