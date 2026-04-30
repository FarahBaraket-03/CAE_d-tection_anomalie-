import torch

print('=== best_cae.pth ===')
c1 = torch.load('model_ai/best_cae.pth', map_location='cpu')
print(f'Keys (first 5): {list(c1.keys())[:5]}')
if 'encoder.0.weight' in c1:
    print(f'encoder.0.weight shape: {c1["encoder.0.weight"].shape}')
print(f'Total keys: {len(c1)}')

print('\n=== cae_optuna_final.pth ===')
c2 = torch.load('model_ai/cae_optuna_final.pth', map_location='cpu')
print(f'Keys (first 5): {list(c2.keys())[:5]}')
if 'encoder.0.weight' in c2:
    print(f'encoder.0.weight shape: {c2["encoder.0.weight"].shape}')
print(f'Total keys: {len(c2)}')
