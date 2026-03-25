import os
import io
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd
import io
from datetime import datetime

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

# 새로운 스케줄 등록을 위한 Pydantic 모델
class ScheduleCreate(BaseModel):
    date: str
    home: int
    away: int

@app.post("/api/schedule")
def create_schedule(schedule: ScheduleCreate):
    try:
        data = {
            "date": schedule.date,
            "home": schedule.home,
            "away": schedule.away,
            "done": 0,
            "created_at": datetime.now().isoformat()
        }
        response = supabase.table("schedule").insert(data).execute()
        return {"message": "일정이 성공적으로 등록되었습니다.", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Schedule 데이터 조회 핸들러
@app.get("/api/schedule") 
def get_Schedule():
    # deleted_at이 null인 데이터만 조회 (소프트 딜리트 필터링)
    response = supabase.table("schedule").select("*").is_("deleted_at", "null").execute()
    return response.data

@app.delete("/api/schedule/{schedule_id}")
def delete_schedule(schedule_id: int):
    try:
        # 영구 삭제 대신 deleted_at에 현재 시간 기록
        now = datetime.now().isoformat()
        response = supabase.table("schedule").update({"deleted_at": now}).eq("id", schedule_id).execute()
        return {"message": "일정이 논리적으로 삭제되었습니다.", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Member 데이터 조회 핸들러
@app.get("/api/member") 
def get_Member():
    # Supabase 테이블 이름
    response = supabase.table("member").select("*").execute()
    return response.data

# Game 데이터 조회 핸들러 (최근 20건만 조회하여 로딩 속도 개선)
@app.get("/api/game") 
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
 

# Game 데이터 조회 핸들러
@app.get("/") 
def read_no():
    return {"message": "no다."}

# 404 예외 처리기 (없는 주소 처리)
@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: Exception):
    # request: 클라이언트에서 보낸 요청 정보(URL, 헤더 등)가 담겨있는 객체
    # exc: 발생한 구체적인 에러(예외) 정보가 담겨있는 객체
    return JSONResponse(
        status_code=404,
        content={"message": "없는 주소입니다"}
    )

# CSV 업로드 및 test 테이블 반영 핸들러
@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        # 파일 내용 읽기
        content = await file.read()
        
        # CSV 파일 파싱 (한글 인코딩 대응)
        try:
            df = pd.read_csv(io.BytesIO(content), encoding='cp949')
        except:
            df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
        
        # NaN 값을 None으로 변환 (Supabase 입력 호환성)
        df = df.where(pd.notnull(df), None)
        
        # 데이터를 딕셔너리 리스트 형태로 변환
        data = df.to_dict(orient='records')
        
        if not data:
            return {"message": "업로드할 데이터가 없습니다."}

        # Supabase 'test' 테이블에 데이터 삽입
        response = supabase.table("test").insert(data).execute()
        
        return {
            "info": f"'{file.filename}' 파일 업로드 및 {len(data)}건 반영 완료!",
            "data": response.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV 처리 중 오류 발생: {str(e)}")

