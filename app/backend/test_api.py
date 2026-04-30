"""
Script de test pour l'API de détection d'anomalies
"""
import requests
import os
from pathlib import Path

API_BASE_URL = 'http://localhost:5000/api'

def test_health():
    """Test de l'endpoint health"""
    print("🔍 Test de l'endpoint /health...")
    try:
        response = requests.get(f'{API_BASE_URL}/health')
        data = response.json()
        print(f"✅ Status: {data['status']}")
        print(f"   Modèles chargés: {data['models_loaded']}")
        print(f"   Device: {data['device']}")
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_models():
    """Test de l'endpoint models"""
    print("\n🔍 Test de l'endpoint /models...")
    try:
        response = requests.get(f'{API_BASE_URL}/models')
        data = response.json()
        print(f"✅ Modèles disponibles:")
        for model in data['models']:
            status = "✓" if model['loaded'] else "✗"
            print(f"   {status} {model['name']}: {model['description']}")
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_predict(image_path):
    """Test de l'endpoint predict"""
    print(f"\n🔍 Test de l'endpoint /predict avec {image_path}...")
    
    if not os.path.exists(image_path):
        print(f"❌ Image non trouvée: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            data = {
                'model_id': 'best_cae',
                'threshold': '0.02'
            }
            response = requests.post(f'{API_BASE_URL}/predict', files=files, data=data)
        
        result = response.json()
        
        if result['success']:
            print(f"✅ Analyse réussie:")
            print(f"   Modèle: {result['model_used']}")
            print(f"   Erreur de reconstruction: {result['reconstruction_error']:.4f}")
            print(f"   Seuil: {result['threshold']}")
            print(f"   Classification: {'ANOMALIE' if result['is_anomaly'] else 'NORMAL'}")
            print(f"   Confiance: {result['confidence']:.2f}")
            return True
        else:
            print(f"❌ Erreur: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_compare(image_path):
    """Test de l'endpoint compare-models"""
    print(f"\n🔍 Test de l'endpoint /compare-models avec {image_path}...")
    
    if not os.path.exists(image_path):
        print(f"❌ Image non trouvée: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            data = {'threshold': '0.02'}
            response = requests.post(f'{API_BASE_URL}/compare-models', files=files, data=data)
        
        result = response.json()
        
        if result['success']:
            print(f"✅ Comparaison réussie:")
            for comp in result['comparisons']:
                print(f"\n   Modèle: {comp['model_id']}")
                print(f"   Erreur: {comp['reconstruction_error']:.4f}")
                print(f"   Classification: {'ANOMALIE' if comp['is_anomaly'] else 'NORMAL'}")
            return True
        else:
            print(f"❌ Erreur: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    """Exécute tous les tests"""
    print("=" * 60)
    print("🧪 TESTS DE L'API DE DÉTECTION D'ANOMALIES")
    print("=" * 60)
    
    # Test 1: Health check
    health_ok = test_health()
    
    # Test 2: Models list
    models_ok = test_models()
    
    # Test 3: Predict (nécessite une image de test)
    # Vous pouvez remplacer ce chemin par une vraie image
    test_image = "test_image.tif"
    if os.path.exists(test_image):
        predict_ok = test_predict(test_image)
        compare_ok = test_compare(test_image)
    else:
        print(f"\n⚠️  Image de test non trouvée: {test_image}")
        print("   Créez une image de test pour tester les endpoints predict et compare")
        predict_ok = None
        compare_ok = None
    
    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    print(f"Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Models List:  {'✅ PASS' if models_ok else '❌ FAIL'}")
    print(f"Predict:      {'✅ PASS' if predict_ok else '❌ FAIL' if predict_ok is False else '⚠️  SKIP'}")
    print(f"Compare:      {'✅ PASS' if compare_ok else '❌ FAIL' if compare_ok is False else '⚠️  SKIP'}")
    print("=" * 60)

if __name__ == '__main__':
    main()
