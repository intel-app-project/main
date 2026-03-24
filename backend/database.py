from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚠️ [비밀번호] 부분만 실제 Supabase 비밀번호로 정확히 바꿔주세요!
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:zjvl3051930519@db.uivcagilliqjdqawlfiq.supabase.co:5432/postgres"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()