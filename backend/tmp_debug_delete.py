import requests

API_BASE_URL = "http://127.0.0.1:8000"

def test_delete():
    # 1. Get schedules to find a valid ID
    response = requests.get(f"{API_BASE_URL}/api/schedule")
    schedules = response.json()
    if not schedules:
        print("No schedules found to test delete.")
        return
    
    first_id = schedules[0].get('id')
    print(f"Found schedule ID: {first_id} (Type: {type(first_id)})")
    
    # 2. Try to delete
    del_response = requests.delete(f"{API_BASE_URL}/api/schedule/{first_id}")
    print(f"Delete Response Status: {del_response.status_code}")
    print(f"Delete Response Body: {del_response.text}")

if __name__ == "__main__":
    test_delete()
