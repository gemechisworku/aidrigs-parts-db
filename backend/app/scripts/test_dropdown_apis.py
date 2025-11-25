import requests
import json

base_url = "http://localhost:8000/api/v1"

print("Testing dropdown data endpoints...\n")

# Test manufacturers
try:
    response = requests.get(f"{base_url}/manufacturers/")
    print(f"✅ Manufacturers: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Found {len(data)} manufacturers")
        for mfg in data[:3]:
            print(f"   - {mfg.get('mfg_name', mfg.get('name', 'N/A'))}")
except Exception as e:
    print(f"❌ Manufacturers error: {e}")

print()

# Test positions
try:
    response = requests.get(f"{base_url}/positions/")
    print(f"✅ Positions: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Found {len(data)} positions")
        for pos in data[:3]:
            print(f"   - {pos.get('position_en', 'N/A')}")
except Exception as e:
    print(f"❌ Positions error: {e}")

print()

# Test translations
try:
    response = requests.get(f"{base_url}/translations/?page=1&page_size=5")
    print(f"✅ Translations: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Found {data.get('total', 0)} total translations")
        for trans in data.get('items', [])[:3]:
            print(f"   - {trans.get('part_name_en', 'N/A')}")
except Exception as e:
    print(f"❌ Translations error: {e}")
