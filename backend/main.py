import io
import os

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/api/member/{user_id}")
def get_member_by_user_id(user_id: str):
    for lookup_column in ("User_ID", "user_id"):
        response = (
            supabase.table("member")
            .select("*")
            .eq(lookup_column, user_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        if rows:
            member = rows[0]
            return {
                "user_id": str(first_non_empty(member, ["User_ID", "user_id"]) or user_id),
                "name": str(first_non_empty(member, ["Name", "name"]) or user_id),
                "member_id": first_non_empty(member, ["id", "member_id"]),
                "member": member,
            }

    raise HTTPException(status_code=404, detail=f"member '{user_id}' not found")


@app.get("/api/game")
def get_game():
    response = supabase.table("game").select("*").execute()
    return response.data


@app.get("/api/test")
def get_test():
    response = supabase.table("test").select("*").execute()
    return response.data


@app.post("/api/testpost")
async def upload_test_csv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
        data = df.to_dict(orient="records")
        response = supabase.table("test").insert(data).execute()
        return {"message": "Data inserted successfully.", "count": len(data), "data": response.data}
    except Exception as exc:
        return {"error": str(exc)}


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
