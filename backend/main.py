import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# .env 파일의 환경 변수 로드
load_dotenv()

app = FastAPI()

# Supabase 설정
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# CORS 설정
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/hello")
def read_hello():
    return {"message": "안녕하세요! Supabase가 준비되었습니다."}

# Schedule 데이터 조회 핸들러
@app.get("/api/Schedule") 
def get_Schedule():
    # Supabase 테이블 이름
    response = supabase.table("Schedule").select("*").execute()
    return response.data

# Member 데이터 조회 핸들러
@app.get("/api/Member") 
def get_Member():
    # Supabase 테이블 이름
    response = supabase.table("Member").select("*").execute()
    return response.data

# Game 데이터 조회 핸들러
@app.get("/api/Game") 
def get_Game():
    # Supabase 테이블 이름
    response = supabase.table("Game").select("*").execute()
    return response.data
