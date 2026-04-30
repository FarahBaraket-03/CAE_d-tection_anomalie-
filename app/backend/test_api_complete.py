"""
Script de test complet pour l'API de détection d'anomalies
Usage: python test_api_complete.py [chemin_image]
"""
import requests
import json
import os
import sys

# Configuration
API_BASE_URL = 'http://localhost:5000/api'

def print_section(title):
    """Affiche un titre de section"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_health():
    """Test 1: Vérification de santé de l'API"""
    print_section("TEST 1: Health Check")
    
    try:
        response = requests.get(f'{API_BASE_URL}/health')
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get('status') == 'healthy':
            print("✅ API is healthy")
            return True
        else:
            print("❌ API is not healthy")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_models():
    """Test 2: Liste des modèles disponibles"""
    print_section("TEST 2: Get Models")
    
    try:
        response = requests.get(f'{API_BASE_URL}/models')
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")
        
        models = data.get('models', [])
        loaded_models = [m for m in models if m.get('loaded')]
        
        print(f"\n✅ {len(loaded_models)}/{len(models)} models loaded")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict(image_path, model_id='best_cae', threshold=0.02):
    """Test 3: Prédiction sur une image"""
    print_section(f"TEST 3: Predict with {model_id}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        print("Please provide a valid image path")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            data = {
                'model_id': model_id,
                'threshold': threshold
            }
            
            response = requests.post(f'{API_BASE_URL}/predict', files=files, data=data)
            result = response.json()
        
        print(f"Status Code: {response.status_code}")
        
        if result.get('success'):
            print(f"✅ Prediction successful")
            print(f"Model Used: {result.get('model_used')}")
            print(f"Reconstruction Error: {result.get('reconstruction_error'):.6f}")
            print(f"Threshold: {result.get('threshold')}")
            print(f"Is Anomaly: {result.get('is_anomaly')}")
            print(f"Confidence: {result.get('confidence'):.2f}")
            return True
        else:
            print(f"❌ Prediction failed: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_compare_models(image_path, threshold=0.02):
    """Test 4: Comparaison des modèles"""
    print_section("TEST 4: Compare Models")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            data = {'threshold': threshold}
            
            response = requests.post(f'{API_BASE_URL}/compare-models', files=files, data=data)
            result = response.json()
        
        print(f"Status Code: {response.status_code}")
        
        if result.get('success'):
            print(f"✅ Comparison successful")
            print(f"Threshold: {result.get('threshold')}")
            
            for comp in result.get('comparisons', []):
                print(f"\nModel: {comp.get('model_id')}")
                print(f"  Reconstruction Error: {comp.get('reconstruction_error'):.6f}")
                print(f"  Is Anomaly: {comp.get('is_anomaly')}")
                print(f"  Confidence: {comp.get('confidence'):.2f}")
            
            return True
        else:
            print(f"❌ Comparison failed: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def run_all_tests(image_path=None):
    """Exécute tous les tests"""
    print("\n" + "🚀"*30)
    print("  ANOMALY DETECTION API - TEST SUITE")
    print("🚀"*30)
    
    results = []
    
    # Test 1: Health Check
    results.append(("Health Check", test_health()))
    
    # Test 2: Get Models
    results.append(("Get Models", test_models()))
    
    # Tests avec images (si disponible)
    if image_path and os.path.exists(image_path):
        # Test 3: Predict with Model 1
        results.append(("Predict (best_cae)", test_predict(image_path, 'best_cae')))
        
        # Test 4: Predict with Model 2
        results.append(("Predict (cae_optuna)", test_predict(image_path, 'cae_optuna')))
        
        # Test 5: Compare Models
        results.append(("Compare Models", test_compare_models(image_path)))
    else:
        print("\n⚠️  No test image provided. Skipping image-based tests.")
        print(f"   To run all tests, provide an image path:")
        print(f"   python test_api_complete.py <path_to_image>")
    
    # Résumé
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    return passed == total

if __name__ == '__main__':
    # Vérifier si un chemin d'image est fourni
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = None
    
    # Exécuter les tests
    success = run_all_tests(image_path)
    
    # Exit code
    sys.exit(0 if success else 1)
