import io
import os

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
    schedule_id: int | None = None
    schedule_date: str | None = None
    member_id: int
    side: str
    status: str


@app.get("/api/hello")
def read_hello():
    return {"message": "Supabase connection is ready."}


@app.get("/api/schedule")
def get_schedule():
    response = supabase.table("schedule").select("*").execute()
    return response.data


@app.get("/api/member")
def get_member():
    response = supabase.table("member").select("*").execute()
    return response.data


@app.get("/api/team")
def get_team():
    response = supabase.table("team").select("*").execute()
    return response.data


@app.get("/api/member/{user_id}")
def get_member_by_user_id(user_id: str):
    response = supabase.table("member").select("*").eq("User_ID", user_id).limit(1).execute()
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

    query = supabase.table("schedule").select("*")
    if payload.schedule_id is not None:
        query = query.eq("id", payload.schedule_id)
    elif payload.schedule_date:
        query = query.eq("date", payload.schedule_date)
    else:
        raise HTTPException(status_code=400, detail="schedule_id or schedule_date is required")

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

    update_query = supabase.table("schedule").update({member_column: member_map})
    if payload.schedule_id is not None:
        update_query = update_query.eq("id", payload.schedule_id)
    else:
        update_query = update_query.eq("date", payload.schedule_date)

    update_response = update_query.execute()
    updated_schedule = update_response.data[0] if update_response.data else None

    return {
        "schedule_id": payload.schedule_id,
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
