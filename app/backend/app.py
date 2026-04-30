"""
Backend Flask API pour la détection d'anomalies avec autoencodeurs
"""
import os
import io
import base64
import numpy as np
import torch
import torch.nn as nn
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import cv2
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model_ai')

# Architecture 1: Dense Autoencoder (for best_cae.pth)
class DenseAutoencoder(nn.Module):
    def __init__(self):
        super(DenseAutoencoder, self).__init__()
        
        # Encoder: 1024 → 256 → 64 → 16
        self.encoder = nn.Sequential(
            nn.Linear(1024, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Linear(64, 16)
        )
        
        # Decoder: 16 → 64 → 256 → 1024
        self.decoder = nn.Sequential(
            nn.Linear(16, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Linear(64, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1024),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        batch_size = x.size(0)
        x_flat = x.view(batch_size, -1)
        encoded = self.encoder(x_flat)
        decoded = self.decoder(encoded)
        return decoded.view(batch_size, 1, 32, 32)

# Architecture 2: Convolutional Autoencoder (for cae_optuna_final.pth)
class ConvAutoencoder(nn.Module):
    def __init__(self, base_filters=48, dropout_rate=0.2):
        super(ConvAutoencoder, self).__init__()
        f = base_filters
        
        # Encoder: 1 → 48 → 96 → 192 → 384
        self.encoder = nn.Sequential(
            nn.Conv2d(1, f, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(f),
            nn.LeakyReLU(0.2, inplace=True),
            
            nn.Conv2d(f, f*2, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(f*2),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Dropout2d(dropout_rate),
            
            nn.Conv2d(f*2, f*4, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(f*4),
            nn.LeakyReLU(0.2, inplace=True),
            
            nn.Conv2d(f*4, f*8, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(f*8)
        )
        
        # Decoder: 384 → 192 → 96 → 48 → 1
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(f*8, f*4, kernel_size=3, stride=2, padding=1, output_padding=1, bias=False),
            nn.BatchNorm2d(f*4),
            nn.LeakyReLU(0.2, inplace=True),
            
            nn.ConvTranspose2d(f*4, f*2, kernel_size=3, stride=2, padding=1, output_padding=1, bias=False),
            nn.BatchNorm2d(f*2),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Dropout2d(dropout_rate),
            
            nn.ConvTranspose2d(f*2, f, kernel_size=3, stride=2, padding=1, output_padding=1, bias=False),
            nn.BatchNorm2d(f),
            nn.LeakyReLU(0.2, inplace=True),
            
            nn.ConvTranspose2d(f, 1, kernel_size=3, stride=2, padding=1, output_padding=1, bias=False)
        )
    
    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

# Charger les modèles
models = {}

def load_models():
    """Charge les deux modèles autoencoder"""
    try:
        # Modèle 1: best_cae.pth (Dense Autoencoder)
        model1 = DenseAutoencoder()
        model1.load_state_dict(torch.load(
            os.path.join(MODEL_DIR, 'best_cae.pth'),
            map_location=DEVICE
        ))
        model1.to(DEVICE)
        model1.eval()
        models['best_cae'] = model1
        
        # Modèle 2: cae_optuna_final.pth (Convolutional Autoencoder)
        model2 = ConvAutoencoder(base_filters=48, dropout_rate=0.2)
        model2.load_state_dict(torch.load(
            os.path.join(MODEL_DIR, 'cae_optuna_final.pth'),
            map_location=DEVICE
        ))
        model2.to(DEVICE)
        model2.eval()
        models['cae_optuna'] = model2
        
        print(f"✅ Modèles chargés avec succès sur {DEVICE}")
        return True
    except Exception as e:
        print(f"❌ Erreur lors du chargement des modèles: {e}")
        return False

def preprocess_image(image_data):
    """Prétraite l'image pour l'inférence"""
    # Convertir en niveaux de gris
    if len(image_data.shape) == 3:
        image_data = cv2.cvtColor(image_data, cv2.COLOR_RGB2GRAY)
    
    # Redimensionner à 32x32 (matches saved model)
    image_data = cv2.resize(image_data, (32, 32))
    
    # Normaliser [0, 255] -> [0, 1]
    image_data = image_data.astype(np.float32) / 255.0
    
    # Ajouter dimensions batch et channel
    image_tensor = torch.from_numpy(image_data).unsqueeze(0).unsqueeze(0)
    
    return image_tensor.to(DEVICE)

def calculate_reconstruction_error(original, reconstructed):
    """Calcule l'erreur de reconstruction (MSE)"""
    mse = torch.nn.functional.mse_loss(reconstructed, original, reduction='mean')
    return mse.item()

def build_error_distribution(errors, labels=None, bins=24):
    """Construit une distribution d'erreurs avec histogrammes."""
    if not errors:
        return None
    errors_np = np.array(errors, dtype=np.float32)
    min_val = float(errors_np.min())
    max_val = float(errors_np.max())
    if min_val == max_val:
        max_val = min_val + 1e-6

    counts_all, bin_edges = np.histogram(errors_np, bins=bins, range=(min_val, max_val))
    payload = {
        'bins': bin_edges.tolist(),
        'counts_all': counts_all.tolist(),
        'mean': float(errors_np.mean()),
        'std': float(errors_np.std()),
        'min': min_val,
        'max': max_val
    }

    if labels is not None:
        labels_np = np.array(labels, dtype=np.int32)
        normal = errors_np[labels_np == 0]
        anomaly = errors_np[labels_np == 1]
        counts_normal, _ = np.histogram(normal, bins=bin_edges)
        counts_anomaly, _ = np.histogram(anomaly, bins=bin_edges)
        payload['counts_normal'] = counts_normal.tolist()
        payload['counts_anomaly'] = counts_anomaly.tolist()

    return payload

def classify_anomaly(reconstruction_error, threshold=0.02):
    """Classifie comme anomalie ou normal basé sur le seuil"""
    return reconstruction_error > threshold

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de l'état de l'API"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': len(models),
        'device': str(DEVICE),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/models', methods=['GET'])
def get_models():
    """Liste des modèles disponibles"""
    return jsonify({
        'models': [
            {
                'id': 'best_cae',
                'name': 'Best CAE Model',
                'description': 'Meilleur modèle d\'autoencoder convolutif',
                'loaded': 'best_cae' in models
            },
            {
                'id': 'cae_optuna',
                'name': 'CAE Optuna Optimized',
                'description': 'Modèle optimisé avec Optuna',
                'loaded': 'cae_optuna' in models
            }
        ]
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """Prédiction d'anomalie sur une image"""
    try:
        # Récupérer l'image et le modèle sélectionné
        if 'image' not in request.files:
            return jsonify({'error': 'Aucune image fournie'}), 400
        
        image_file = request.files['image']
        model_id = request.form.get('model_id', 'best_cae')
        threshold = float(request.form.get('threshold', 0.02))
        
        if model_id not in models:
            return jsonify({'error': f'Modèle {model_id} non trouvé'}), 404
        
        # Charger et prétraiter l'image
        image = Image.open(image_file.stream)
        image_array = np.array(image)
        
        # Sauvegarder l'image originale (format affichage)
        original_img = cv2.resize(image_array, (360, 240))
        if len(original_img.shape) == 3:
            original_img = cv2.cvtColor(original_img, cv2.COLOR_RGB2GRAY)
        _, buffer = cv2.imencode('.png', original_img)
        original_b64 = base64.b64encode(buffer).decode('utf-8')
        
        # Prétraiter pour le modèle
        input_tensor = preprocess_image(image_array)
        
        # Inférence
        model = models[model_id]
        with torch.no_grad():
            reconstructed = model(input_tensor)
        
        # Calculer l'erreur de reconstruction
        reconstruction_error = calculate_reconstruction_error(input_tensor, reconstructed)
        
        # Classification
        is_anomaly = classify_anomaly(reconstruction_error, threshold)
        
        # Convertir la reconstruction en image (format affichage)
        reconstructed_img = reconstructed.squeeze().cpu().numpy()
        reconstructed_img = (reconstructed_img * 255).astype(np.uint8)
        reconstructed_display = cv2.resize(reconstructed_img, (360, 240))
        _, buffer = cv2.imencode('.png', reconstructed_display)
        reconstructed_b64 = base64.b64encode(buffer).decode('utf-8')
        
        # Carte de différence
        diff_map = np.abs(original_img.astype(float) - reconstructed_display.astype(float))
        diff_max = diff_map.max()
        if diff_max > 0:
            diff_map = (diff_map / diff_max * 255).astype(np.uint8)
        else:
            diff_map = diff_map.astype(np.uint8)
        diff_map_colored = cv2.applyColorMap(diff_map, cv2.COLORMAP_JET)
        _, buffer = cv2.imencode('.png', diff_map_colored)
        diff_b64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'success': True,
            'model_used': model_id,
            'reconstruction_error': float(reconstruction_error),
            'threshold': threshold,
            'is_anomaly': bool(is_anomaly),
            'confidence': float(min(reconstruction_error / threshold, 2.0)),
            'images': {
                'original': f'data:image/png;base64,{original_b64}',
                'reconstructed': f'data:image/png;base64,{reconstructed_b64}',
                'difference': f'data:image/png;base64,{diff_b64}'
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/batch-predict', methods=['POST'])
def batch_predict():
    """Prédiction sur plusieurs images"""
    try:
        if 'images' not in request.files:
            return jsonify({'error': 'Aucune image fournie'}), 400
        
        images = request.files.getlist('images')
        model_id = request.form.get('model_id', 'best_cae')
        threshold = float(request.form.get('threshold', 0.02))
        
        if model_id not in models:
            return jsonify({'error': f'Modèle {model_id} non trouvé'}), 404
        
        results = []
        model = models[model_id]
        
        for idx, image_file in enumerate(images):
            try:
                image = Image.open(image_file.stream)
                image_array = np.array(image)
                input_tensor = preprocess_image(image_array)
                
                with torch.no_grad():
                    reconstructed = model(input_tensor)
                
                reconstruction_error = calculate_reconstruction_error(input_tensor, reconstructed)
                is_anomaly = classify_anomaly(reconstruction_error, threshold)
                
                results.append({
                    'index': idx,
                    'filename': image_file.filename,
                    'reconstruction_error': float(reconstruction_error),
                    'is_anomaly': bool(is_anomaly),
                    'confidence': float(min(reconstruction_error / threshold, 2.0))
                })
            except Exception as e:
                results.append({
                    'index': idx,
                    'filename': image_file.filename,
                    'error': str(e)
                })
        
        # Statistiques
        anomalies = sum(1 for r in results if r.get('is_anomaly', False))
        errors = [r['reconstruction_error'] for r in results if 'reconstruction_error' in r]
        labels = [1 if r.get('is_anomaly', False) else 0 for r in results if 'reconstruction_error' in r]
        avg_error = np.mean(errors) if errors else 0.0
        error_distribution = build_error_distribution(errors, labels=labels)
        
        return jsonify({
            'success': True,
            'model_used': model_id,
            'total_images': len(images),
            'anomalies_detected': anomalies,
            'normal_detected': len(images) - anomalies,
            'average_error': float(avg_error),
            'threshold': threshold,
            'error_distribution': error_distribution,
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/compare-models', methods=['POST'])
def compare_models():
    """Compare les deux modèles sur la même image"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'Aucune image fournie'}), 400
        
        image_file = request.files['image']
        threshold = float(request.form.get('threshold', 0.02))
        
        # Charger l'image
        image = Image.open(image_file.stream)
        image_array = np.array(image)
        input_tensor = preprocess_image(image_array)
        
        comparisons = []
        
        for model_id, model in models.items():
            with torch.no_grad():
                reconstructed = model(input_tensor)
            
            reconstruction_error = calculate_reconstruction_error(input_tensor, reconstructed)
            is_anomaly = classify_anomaly(reconstruction_error, threshold)
            
            # Image reconstruite
            reconstructed_img = reconstructed.squeeze().cpu().numpy()
            reconstructed_img = (reconstructed_img * 255).astype(np.uint8)
            reconstructed_display = cv2.resize(reconstructed_img, (360, 240))
            _, buffer = cv2.imencode('.png', reconstructed_display)
            reconstructed_b64 = base64.b64encode(buffer).decode('utf-8')
            
            comparisons.append({
                'model_id': model_id,
                'reconstruction_error': float(reconstruction_error),
                'is_anomaly': bool(is_anomaly),
                'confidence': float(min(reconstruction_error / threshold, 2.0)),
                'reconstructed_image': f'data:image/png;base64,{reconstructed_b64}'
            })
        
        # Image originale
        original_img = cv2.resize(image_array, (360, 240))
        if len(original_img.shape) == 3:
            original_img = cv2.cvtColor(original_img, cv2.COLOR_RGB2GRAY)
        _, buffer = cv2.imencode('.png', original_img)
        original_b64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'success': True,
            'original_image': f'data:image/png;base64,{original_b64}',
            'threshold': threshold,
            'comparisons': comparisons,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Démarrage du serveur de détection d'anomalies...")
    print(f"📊 Device: {DEVICE}")
    
    if load_models():
        print("✅ Tous les modèles sont prêts")
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("❌ Échec du chargement des modèles")
