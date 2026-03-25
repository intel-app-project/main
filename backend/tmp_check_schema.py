import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

try:
    response = supabase.table("schedule").select("*").limit(1).execute()
    print("Schema Check - First Row Data:")
    print(response.data)
except Exception as e:
    print(f"Error: {e}")
