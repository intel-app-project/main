import requests
import sys

def main():
    try:
        r = requests.get('http://172.30.1.84:8000/api/game', timeout=5)
        data = r.json()
        print(f"Total fetched items: {len(data)}")
        if len(data) > 0:
            first_item = data[0]
            print(f"Keys in first item: {list(first_item.keys())}")
            import json
            total_size = len(json.dumps(first_item))
            print(f"Approximate stringified size of one item: {total_size} characters ({(total_size/1024/1024):.2f} MB)")
            for k, v in first_item.items():
                size = len(json.dumps(v))
                if size > 1000:
                    print(f"  Field '{k}' is large: {size} chars")
                else:
                    print(f"  Field '{k}' size: {size} chars")
    except Exception as e:
        print("Error fetching locally:", e)

if __name__ == "__main__":
    main()
