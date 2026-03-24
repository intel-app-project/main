import os
import io
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd

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
@app.get("/api/schedule") 
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
    response = supabase.table("game").select("*").execute()
    return response.data

# test 데이터 조회 핸들러
@app.get("/api/test") 
def get_Game():
    # Supabase 테이블 이름
    response = supabase.table("test").select("*").execute()
    return response.data

@app.post("/api/testpost")
async def upload_csv(file: UploadFile = File(...)):
    print(f"--- [백엔드] 업로드 요청 수신: {file.filename} ---")
    try:
        content = await file.read()
        print(f"[백엔드] 파일 읽기 완료 ({len(content)} bytes)")
        
        # CSV 시도
        df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
        print(f"[백엔드] Pandas 변환 완료 (총 {len(df)}행)")
        
        data = df.to_dict(orient="records")
        print(f"[백엔드] Supabase에 {len(data)}건 삽입 시도 중...")
        
        response = supabase.table("test").insert(data).execute()
        print("[백엔드] Supabase 서버 응답 완료")
        
        return {"message": "데이터가 성공적으로 추가되었습니다.", "count": len(data)}
        
    except Exception as e:
        print(f"!!! [백엔드 오류] !!! : {str(e)}")
        return {"error": str(e)}
