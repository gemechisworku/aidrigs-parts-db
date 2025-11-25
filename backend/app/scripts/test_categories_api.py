import requests
import sys

try:
    response = requests.get("http://localhost:8000/api/v1/categories/")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response JSON:")
        print(response.json())
    else:
        print(f"Error: {response.text}")
        sys.exit(1)
except Exception as e:
    print(f"Request failed: {e}")
    sys.exit(1)
