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
from review_logic import generate_all_reviews, generate_player_review
from google import genai
from google.genai import types
import base64
import httpx
import re
from PIL import Image, ImageDraw, ImageFont

load_dotenv()

app = FastAPI()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai_client = genai.Client(api_key=GOOGLE_API_KEY)
else:
    genai_client = None

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


@app.get("/api/team/{team_id}")
def get_team_by_id(team_id: int):
    try:
        response = (
            supabase.table("team").select("*").eq("id", team_id).execute()
        )
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/team/{team_id}/best_member")
def update_best_member(team_id: int, best_member: dict):
    try:
        response = (
            supabase.table("team")
            .update({"best_member": best_member})
            .eq("id", team_id)
            .execute()
        )
        return {"message": "베스트 멤버가 저장되었습니다.", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


@app.get("/api/review/{member_id}")
def get_player_review(member_id: int):
    try:
        return generate_player_review(supabase, member_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/api/review/generate-all")
def generate_all_player_reviews():
    try:
        return generate_all_reviews(supabase)
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))

@app.get("/api/gemini")
async def ask_gemini(prompt: str):
    print(f"[backend/main.py] /api/gemini 시작. Prompt: {prompt[:100]}...")
    if not genai_client:
        print("[backend/main.py] Gemini 클라이언트 없음")
        raise HTTPException(status_code=500, detail="Google API Key is not configured")
    
    try:
        # 아바타 URL 추출 (선수 아바타: https://...)
        avatar_url = None
        url_match = re.search(r"선수 아바타:\s*(https?://[^\s,]+)", prompt)
        if url_match:
            avatar_url = url_match.group(1)
            print(f"[backend/main.py] 아바타 URL 감지: {avatar_url}")

        contents_parts = []
        
        # https://ai.google.dev/gemini-api/docs/gemini-3?hl=ko
        # https://ai.google.dev/gemini-api/docs/imagen?hl=ko
        # [Imagen Prompt Basics 적용] 
        # 1. Subject (주체): 선수 이름과 아바타 외형 묘사
        # 2. Medium/Style (매체/스타일): Digital art, stunning cinematic concept art
        # 3. Setting (배경): Professional baseball stadium with vibrant crowd
        # 4. Color/Lighting (색상/조명): Dramatic golden hour lighting, vibrant colors
        # 5. Composition (구도): Action shot of a baseball player
        
        system_instruction = (
            "너는 Google Imagen의 최고의 프롬프트 엔지니어다. "
            "함께 제공된 선수의 아바타 이미지(PNG)를 분석하고, 이 캐릭터가 '실제 사람' 야구 선수라고 상상하여 "
            "박진감 넘치는 경기 장면을 묘사하는 고퀄리티 Imagen 프롬프트를 작성해줘.\n\n"
            "프롬프트 구성 가이드:\n"
            "1. Subject: 이미지 속 아바타의 외형 특징(머리 모양, 색상, 얼굴형 등)을 그대로 가진 실제 인간 야구 선수.\n"
            "2. Action: 배트를 힘껏 휘두르거나 역동적인 투구 폼을 잡는 등 실제 경기 중인 모습.\n"
            "3. Medium/Style: Stunning cinematic photography, hyper-realistic, 8k resolution.\n"
            "4. Setting: 대형 야구 스타디움, 열광하는 관중, 조명탄이 터지는 역동적인 분위기.\n"
            "5. Lighting: Dramatic stadium floodlights, lens flare, high contrast.\n"
            "- 주의: 절대 프롬프트에 URL 주소를 포함하지 말 것.\n"
            "- 응답은 오직 상세한 영어 프롬프트(줄글 6문장)만 출력할 것."
        )
        contents_parts.append(f"{system_instruction}\n\n입력 데이터: {prompt}")

        # 2. 이미지 데이터 추가 (있을 경우)
        if avatar_url:
            async with httpx.AsyncClient() as client:
                resp = await client.get(avatar_url)
                if resp.status_code == 200:
                    image_part = types.Part.from_bytes(
                        data=resp.content,
                        mime_type="image/png"
                    )
                    contents_parts.append(image_part)
                    print("[backend/main.py] Gemini에게 아바타 이미지 전달 완료")

        response = genai_client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=contents_parts
        )
        print("[backend/main.py] Gemini 멀티모달 응답 성공")
        return {"result": response.text}
    except Exception as e:
        import traceback
        print(f"[backend/main.py] Gemini 에러!!!: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/banana")
async def pic_banana(banana: str):
    print(f"[backend/main.py] /api/banana 시작. Input: {banana[:50]}...")
    if not genai_client:
        print("[backend/main.py] Imagen 클라이언트 없음")
        raise HTTPException(status_code=500, detail="Google API Key is not configured")
    try:
        result = genai_client.models.generate_images(
            model='imagen-4.0-fast-generate-001',
            prompt=banana,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
            )
        )
        
        # [NoneType 에러 방지] 
        # Imagen API가 안전 필터링 등의 이유로 이미지를 생성하지 못하면 generated_images가 없을 수 있습니다.
        if not hasattr(result, 'generated_images') or not result.generated_images:
            print(f"[backend/main.py] Imagen 이미지 생성 실패: 결과가 비어있습니다. (Safety Filter 의심)")
            # 필요 시 result 객체 전체를 출력하여 상세 이유 확인 가능
            raise HTTPException(status_code=500, detail="안전 필터링이나 API 오류로 이미지를 생성할 수 없습니다. 프롬프트를 조정해 보세요.")

        generated_image = result.generated_images[0]
        image_bytes = generated_image.image.image_bytes
        base64_encoded = base64.b64encode(image_bytes).decode('utf-8')
        print(f"[backend/main.py] Imagen 이미지 생성 성공 (Base64 길이: {len(base64_encoded)})")
        return {"result": base64_encoded}
    except Exception as e:
        import traceback
        print(f"[backend/main.py] Imagen 에러!!!: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/make_card")
async def generate_baseball_card(payload: dict):
    """
    AI로 생성된 이미지 위에 선수 정보를 오버레이하여 '야구 카드' 형태로 합성합니다.
    """
    try:
        image_b64 = payload.get("image")
        member = payload.get("member")
        team = payload.get("team")
        stats = payload.get("stats")
        active_mode = payload.get("active_mode", "HITTER")

        # 1. 베이스 이미지 로드 (AI 생성물)
        img_data = base64.b64decode(image_b64)
        base_img = Image.open(io.BytesIO(img_data)).convert("RGBA")
        
        # 1024x1024로 리사이즈 (표준화)
        base_img = base_img.resize((1000, 1000), Image.Resampling.LANCZOS)
        
        # 2. 카드 전체 캔버스 생성 (1000x1400: 야구 카드 비율)
        card = Image.new("RGBA", (1000, 1400), (255, 255, 255, 255))
        card.paste(base_img, (0, 0))
        
        draw = ImageDraw.Draw(card)
        
        # 3. 하단 정보 영역 (Forest Green)
        main_color = (74, 124, 89, 255) # #4a7c59
        draw.rectangle([0, 1000, 1000, 1400], fill=main_color)
        
        # 4. 폰트 로드 (Windows 시스템 폰트: 맑은 고딕)
        font_path = "C:\\Windows\\Fonts\\malgunbd.ttf" # Bold
        try:
            font_title = ImageFont.truetype(font_path, 80)
            font_sub = ImageFont.truetype(font_path, 40)
            font_stat_val = ImageFont.truetype(font_path, 60)
            font_stat_label = ImageFont.truetype(font_path, 30)
        except:
            print("폰트 로드 실패, 기본 폰트 사용")
            font_title = ImageFont.load_default()
            font_sub = ImageFont.load_default()
            font_stat_val = ImageFont.load_default()
            font_stat_label = ImageFont.load_default()

        # 5. 선수 정보 그리기
        # 이름 및 번호
        name = member.get("Name", "PLAYER")
        num = member.get("Num", "00")
        pos = member.get("Primary_Position", "-")
        team_name = team.get("name", "TERRA")
        
        draw.text((50, 1030), f"#{num} {name}", font=font_title, fill=(255, 255, 255, 255))
        draw.text((50, 1130), f"{team_name} | {pos}", font=font_sub, fill=(230, 230, 230, 255))
        
        # 6. 성적 지표 (3개 컬럼)
        draw.line([50, 1190, 950, 1190], fill=(255, 255, 255, 80), width=2)
        
        if active_mode == "HITTER":
            stat_items = [
                ("타율 (AVG)", stats.get("avg", ".000")),
                ("홈런 (HR)", str(stats.get("hr", "0"))),
                ("타점 (RBI)", str(stats.get("rbi", "0")))
            ]
        else:
            stat_items = [
                ("방어율 (ERA)", stats.get("era", "0.00")),
                ("탈삼진 (K)", str(stats.get("kSum", "0"))),
                ("이닝 (IP)", stats.get("ip", "0.0"))
            ]
            
        for i, (label, val) in enumerate(stat_items):
            x_pos = 100 + (i * 300)
            draw.text((x_pos, 1220), label, font=font_stat_label, fill=(200, 200, 200, 255))
            draw.text((x_pos, 1270), val, font=font_stat_val, fill=(255, 255, 255, 255))
            
        # 7. 꾸미기 요소 (상단 뱃지)
        badge_text = "Baseball Team System"
        try:
            # 텍스트 길이에 맞춰 배경 사각형 크기 조절
            text_bbox = draw.textbbox((50, 40), badge_text, font=ImageFont.truetype(font_path, 30))
            # 여백 추가
            rect_end_x = text_bbox[2] + 20
            draw.rectangle([30, 30, rect_end_x, 90], fill=(0, 0, 0, 150))
        except:
            draw.rectangle([30, 30, 350, 90], fill=(0, 0, 0, 150))
            
        draw.text((50, 40), badge_text, font=ImageFont.truetype(font_path, 30), fill=(255, 255, 255, 255))

        # 8. 바이트로 변환하여 반환
        output = io.BytesIO()
        card = card.convert("RGB") # JPEG 저장을 위해 RGB로 변환
        card.save(output, format="JPEG", quality=95)
        base64_card = base64.b64encode(output.getvalue()).decode('utf-8')
        
        print(f"[backend/main.py] PR 야구 카드 합성 성공 (성수: {name})")
        return {"result": base64_card}
    except Exception as e:
        import traceback
        print(f"[backend/main.py] 카드 합성 에러!!!: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



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
