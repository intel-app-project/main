from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os
import pandas as pd
import io
import ast # 문자열 형태의 리스트를 변환하기 위해 필요

from database import get_db
from models import Team, TeamPlayerData

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "서버 정상 작동 중!"}

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        await file.seek(0)
        content = await file.read()
        
        # 1. 한글 인코딩 대응 (CP949 시도 후 실패 시 UTF-8)
        try:
            df = pd.read_csv(io.BytesIO(content), encoding='cp949')
        except:
            df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
        
        df = df.where(pd.notnull(df), None)

        for _, row in df.iterrows():
            # "['P']" 같은 문자열을 파이썬 리스트로 변환
            positions_data = row['Positions']
            if isinstance(positions_data, str) and positions_data.startswith('['):
                try:
                    positions_data = ast.literal_eval(positions_data)
                except:
                    pass

            new_player = TeamPlayerData(
                Id = str(row['Id']),
                Team = int(row['Team']),
                Num = int(row['Num']),
                Name = str(row['Name']),
                Primary_Position = str(row['Primary_Position']),
                Is_Pitcher = int(row['Is_Pitcher']) if row['Is_Pitcher'] is not None else 0,
                Batting_Order_Default = int(row['Batting_Order_Default']) if row['Batting_Order_Default'] is not None else 0,
                Positions = positions_data 
            )
            db.add(new_player)
        
        db.commit()
        return {"info": f"'{file.filename}' 저장 및 {len(df)}명 반영 완료!"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB 저장 오류: {str(e)}")