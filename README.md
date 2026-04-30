# 🧠 Système de Détection d'Anomalies avec Autoencodeurs

Application web complète pour tester et comparer deux modèles d'autoencodeurs convolutifs (CAE) pour la détection d'anomalies dans les images.

## 📋 Fonctionnalités

### Backend (Flask API)
- ✅ Chargement de 2 modèles autoencoder (best_cae.pth et cae_optuna_final.pth)
- ✅ API REST complète avec endpoints:
  - `/api/health` - Vérification de l'état du serveur
  - `/api/models` - Liste des modèles disponibles
  - `/api/predict` - Analyse d'une seule image
  - `/api/batch-predict` - Analyse par lot
  - `/api/compare-models` - Comparaison des deux modèles
- ✅ Calcul de l'erreur de reconstruction (MSE)
- ✅ Classification anomalie/normal avec seuil ajustable
- ✅ Génération de visualisations (image originale, reconstruction, carte de différence)

### Frontend (HTML/CSS/JavaScript)
- ✅ Interface moderne et responsive avec Tailwind CSS
- ✅ Design glassmorphism avec animations fluides
- ✅ Upload d'images par glisser-déposer ou sélection
- ✅ Sélection du modèle (Best CAE ou CAE Optuna)
- ✅ Ajustement du seuil de détection avec slider
- ✅ Visualisations interactives:
  - Comparaison image originale / reconstruction / différence
  - Métriques détaillées (erreur, confiance, classification)
  - Graphiques pour analyse par lot (Chart.js)
  - Tableau récapitulatif pour les lots
- ✅ Statistiques en temps réel (images analysées, anomalies, normales, erreur moyenne)
- ✅ Mode comparaison des deux modèles côte à côte

## 🚀 Installation

### Prérequis
- Python 3.8+
- pip

### 1. Installation des dépendances Python

```bash
cd app/backend
pip install -r requirements.txt
```

### 2. Vérifier les modèles

Assurez-vous que les fichiers de modèles sont présents dans `app/backend/model_ai/`:
- `best_cae.pth`
- `cae_optuna_final.pth`

## 🎯 Utilisation

### Démarrer le Backend

```bash
cd app/backend
python app.py
```

Le serveur démarre sur `http://localhost:5000`

### Ouvrir le Frontend

Ouvrez simplement le fichier `app/frontend/index.html` dans votre navigateur web.

Ou utilisez un serveur HTTP local:

```bash
cd app/frontend
python -m http.server 8000
```

Puis accédez à `http://localhost:8000`

## 📖 Guide d'utilisation

### 1. Analyse d'une seule image

1. Sélectionnez un modèle (Best CAE ou CAE Optuna)
2. Ajustez le seuil de détection si nécessaire (par défaut: 0.020)
3. Glissez-déposez une image ou cliquez pour sélectionner
4. Cliquez sur "Analyser"
5. Visualisez les résultats:
   - Image originale
   - Reconstruction par le modèle
   - Carte de différence (heatmap)
   - Classification (Anomalie ou Normal)
   - Métriques détaillées

### 2. Analyse par lot

1. Sélectionnez plusieurs images
2. Choisissez le modèle
3. Cliquez sur "Analyser"
4. Consultez:
   - Graphique des erreurs de reconstruction
   - Tableau récapitulatif avec classification
   - Statistiques globales

### 3. Comparaison des modèles

1. Sélectionnez UNE SEULE image
2. Cliquez sur "Comparer les Modèles"
3. Visualisez côte à côte:
   - Image originale
   - Reconstruction par Best CAE
   - Reconstruction par CAE Optuna
   - Métriques comparatives

## 🏗️ Architecture

### Backend (Flask)

```
app/backend/
├── app.py                 # API Flask principale
├── requirements.txt       # Dépendances Python
└── model_ai/
    ├── best_cae.pth      # Modèle 1
    └── cae_optuna_final.pth  # Modèle 2
```

**Architecture du modèle CAE:**
- Encoder: Conv2D (32, 64, 128 filtres) + Flatten + Linear
- Latent space: 128 dimensions
- Decoder: Linear + Unflatten + ConvTranspose2D
- Input: Images 240x360 en niveaux de gris
- Output: Reconstruction de l'image

### Frontend

```
app/frontend/
├── index.html            # Interface utilisateur
└── app.js               # Logique JavaScript
```

**Technologies:**
- Tailwind CSS - Framework CSS utilitaire
- Chart.js - Graphiques interactifs
- Font Awesome - Icônes
- Vanilla JavaScript - Pas de framework lourd

## 🎨 Design System

### Palette de couleurs
- **Primary**: Gradient violet (#667eea → #764ba2)
- **Success**: Vert (#22c55e)
- **Error**: Rouge (#ef4444)
- **Neutral**: Slate (50-900)

### Composants
- **Glass Cards**: Effet glassmorphism avec backdrop-filter
- **Gradient Buttons**: Boutons avec gradient et hover effects
- **Stat Cards**: Cartes statistiques avec icônes
- **Upload Zone**: Zone de drag & drop interactive
- **Loading Overlay**: Spinner avec fond semi-transparent

### Animations
- Slide-in pour les résultats
- Pulse pour les badges d'anomalie
- Hover effects sur les cartes
- Transitions fluides (0.3s ease)

## 📊 Métriques et Seuils

### Erreur de Reconstruction (MSE)
- Calculée entre l'image originale et la reconstruction
- Plus l'erreur est élevée, plus l'image est différente de la normale
- Seuil par défaut: 0.020

### Classification
- **Normal**: Erreur < Seuil
- **Anomalie**: Erreur ≥ Seuil

### Confiance
- Calculée comme le ratio erreur/seuil
- Plafonnée à 200% pour les anomalies extrêmes

## 🔧 Configuration

### Modifier le seuil par défaut

Dans `app/backend/app.py`:
```python
def classify_anomaly(reconstruction_error, threshold=0.02):  # Modifier ici
```

### Changer le port du backend

Dans `app/backend/app.py`:
```python
app.run(host='0.0.0.0', port=5000, debug=True)  # Modifier le port
```

Dans `app/frontend/app.js`:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';  # Mettre à jour l'URL
```

## 🐛 Dépannage

### Le backend ne démarre pas
- Vérifiez que Python 3.8+ est installé
- Installez les dépendances: `pip install -r requirements.txt`
- Vérifiez que les modèles .pth sont présents

### Les modèles ne se chargent pas
- Vérifiez les chemins des fichiers .pth
- Assurez-vous que PyTorch est correctement installé
- Vérifiez les logs du serveur pour les erreurs

### Le frontend ne se connecte pas au backend
- Vérifiez que le backend est démarré
- Vérifiez l'URL dans `app.js` (API_BASE_URL)
- Vérifiez la console du navigateur pour les erreurs CORS

### Images .tif non supportées
- Assurez-vous que Pillow est installé: `pip install pillow`
- Vérifiez que opencv-python est installé

## 📝 Format des images

### Formats supportés
- JPEG (.jpg, .jpeg)
- PNG (.png)
- TIFF (.tif, .tiff)

### Prétraitement automatique
- Conversion en niveaux de gris
- Redimensionnement à 240x360 pixels
- Normalisation [0, 255] → [0, 1]

## 🚀 Améliorations futures

- [ ] Sauvegarde de l'historique des analyses
- [ ] Export des résultats en PDF/CSV
- [ ] Visualisation 3D du latent space
- [ ] Fine-tuning des modèles via l'interface
- [ ] Support de vidéos (analyse frame par frame)
- [ ] API d'authentification
- [ ] Dashboard d'administration
- [ ] Notifications en temps réel (WebSocket)

## 📄 Licence

Ce projet est fourni à des fins éducatives et de recherche.

## 👥 Auteurs

Développé avec ❤️ pour la détection d'anomalies par autoencodeurs convolutifs.
