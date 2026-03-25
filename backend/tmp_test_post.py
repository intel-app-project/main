import requests

payload = {
    "date": "20250310",
    "home": 1,
    "away": 2
}
try:
    response = requests.post("http://127.0.0.1:8000/api/schedule", json=payload)
    print(response.status_code)
    try:
        print(response.json())
    except:
        print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
