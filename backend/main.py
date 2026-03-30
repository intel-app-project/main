import io
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

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from supabase import Client, create_client

load_dotenv()

app = FastAPI()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def first_non_empty(mapping, keys):
    if not isinstance(mapping, dict):
        return None

    for key_name in keys:
        value = mapping.get(key_name)
        if value not in (None, ""):
            return value

    return None


def parse_json_object(value):
    if value is None:
        return {}

    if isinstance(value, dict):
        return dict(value)

    if isinstance(value, str):
        import json

        try:
            parsed_value = json.loads(value)
            if isinstance(parsed_value, dict):
                return parsed_value
        except Exception:
            return {}

    return {}


class AttendanceUpdatePayload(BaseModel):
    schedule_date: str
    member_id: int
    side: str
    status: str


class ScheduleLineupUpdate(BaseModel):
    P: str | None = None
    C: str | None = None
    oneB: str | None = None # 1B is not a valid python identifier
    twoB: str | None = None
    threeB: str | None = None
    SS: str | None = None
    LF: str | None = None
    CF: str | None = None
    RF: str | None = None

    class Config:
        # To handle '1B', '2B', etc. from JSON
        populate_by_name = True
        alias_generator = lambda s: s.replace('one', '1').replace('two', '2').replace('three', '3')

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
def get_schedules():
    response = supabase.table("schedule").select("*").is_("deleted_at", "null").order("date").execute()
    return response.data

@app.get("/api/schedule/team/{team_id}")
def get_schedules_by_team(team_id: int):
    # home 팀 또는 away 팀인 모든 경기 정보를 가져옴
    response = (
        supabase.table("schedule")
        .select("*")
        .or_(f"home.eq.{team_id},away.eq.{team_id}")
        .is_("deleted_at", "null")
        .order("date")
        .execute()
    )
    return response.data

@app.delete("/api/schedule/{date}")
def delete_schedule(date: str):
    try:
        # 영구 삭제 대신 deleted_at에 현재 시간 기록
        now = datetime.now().isoformat()
        response = supabase.table("schedule").update({"deleted_at": now}).eq("date", date).execute()
        return {"message": "일정이 삭제 표기되었습니다.", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/schedule/{date}")
def update_schedule(date: str, schedule: ScheduleCreate):
    try:
        now = datetime.now().isoformat()
        data = {
            "date": schedule.date,
            "home": schedule.home,
            "away": schedule.away,
            "updated_at": now
        }
        response = supabase.table("schedule").update(data).eq("date", date).execute()
        return {"message": "일정이 성공적으로 수정되었습니다.", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schedule/date/{date}")
def get_schedule_by_date(date: str):
    try:
        response = supabase.table("schedule").select("*").eq("date", date).is_("deleted_at", "null").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/schedule/{date}/lineup")
def update_lineup(date: str, lineup: dict, side: str = "home"): # side 파라미터 추가 (기본값 home)
    try:
        # side 값에 따라 업데이트할 컬럼 결정
        column = "home_lineup" if side.lower() == "home" else "away_lineup"
        response = supabase.table("schedule").update({column: lineup}).eq("date", date).execute()
        return {"message": f"{side} 라인업이 성공적으로 저장되었습니다.", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Member 데이터 조회 핸들러
@app.get("/api/member") 
def get_Member():
    # Supabase 테이블 이름
    response = supabase.table("member").select("*").execute()
    return response.data


@app.get("/api/team")
def get_team():
    response = supabase.table("team").select("*").execute()
    return response.data


@app.get("/api/member/{user_id}")
def get_member_by_user_id(user_id: str):
    query = supabase.table("member").select("*")
    
    if user_id.isdigit():
        response = query.eq("Id", int(user_id)).execute()
    else:
        response = query.eq("User_ID", user_id).execute()
        
    member = response.data[0] if response.data else None

    if not member:
        raise HTTPException(status_code=404, detail=f"member not found: {user_id}")

    return {
        "user_id": user_id,
        "name": first_non_empty(member, ["Name", "name"]),
        "member_id": first_non_empty(member, ["Id", "id"]),
        "member": member,
    }


@app.patch("/api/schedule/attendance")
def update_schedule_attendance(payload: AttendanceUpdatePayload):
    normalized_side = payload.side.lower().strip()
    normalized_status = payload.status.lower().strip()

    if normalized_side not in {"home", "away"}:
        raise HTTPException(status_code=400, detail="side must be 'home' or 'away'")

    if normalized_status not in {"attending", "pending", "absent"}:
        raise HTTPException(
            status_code=400,
            detail="status must be one of: attending, pending, absent",
        )

    query = supabase.table("schedule").select("*").eq("date", payload.schedule_date)

    response = query.limit(1).execute()
    schedule = response.data[0] if response.data else None

    if not schedule:
        raise HTTPException(status_code=404, detail="schedule not found")

    member_column = "home_member" if normalized_side == "home" else "away_member"
    member_map = parse_json_object(schedule.get(member_column))
    member_id_key = str(payload.member_id)

    if normalized_status == "attending":
        member_map[member_id_key] = 1
    elif normalized_status == "absent":
        member_map[member_id_key] = 0
    else:
        member_map.pop(member_id_key, None)

    update_query = supabase.table("schedule").update({member_column: member_map}).eq("date", payload.schedule_date)
    update_response = update_query.execute()
    updated_schedule = update_response.data[0] if update_response.data else None

    return {
        "schedule_date": payload.schedule_date,
        "member_id": payload.member_id,
        "side": normalized_side,
        "status": normalized_status,
        "member_column": member_column,
        "member_value": member_map.get(member_id_key, None),
        "schedule": updated_schedule,
    }

@app.get("/api/game")
def get_game():
    response = supabase.table("game").select("*").execute()
    return response.data

@app.get("/")
def read_root():
    return {"message": "noop"}


@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=404, content={"message": "Not found"})


@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        content = await file.read()

        try:
            df = pd.read_csv(io.BytesIO(content), encoding="cp949")
        except Exception:
            df = pd.read_csv(io.BytesIO(content), encoding="utf-8")

        df = df.where(pd.notnull(df), None)
        data = df.to_dict(orient="records")

        if not data:
            return {"message": "No rows to upload."}

        response = supabase.table("test").insert(data).execute()
        return {
            "info": f"Uploaded '{file.filename}' with {len(data)} rows.",
            "data": response.data,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"CSV processing failed: {exc}")
