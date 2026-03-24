from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from database import Base

class Team(Base):
    __tablename__ = "TEAM"

    # TEAM 테이블: id(int8, PK), name(text)
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String)

    # TeamPlayerData와의 관계 설정 (선택 사항)
    players = relationship("TeamPlayerData", back_populates="team_info")


class TeamPlayerData(Base):
    __tablename__ = "TeamPlayerData"

    # TeamPlayerData 테이블 컬럼 (대소문자 주의)
    Id = Column(String, primary_key=True, index=True) # PK가 text 타입임에 유의
    Team = Column(BigInteger, ForeignKey("TEAM.id")) # TEAM 테이블의 id 참조
    Num = Column(BigInteger)
    Name = Column(String)
    Positions = Column(JSONB) # jsonb 타입 반영
    Primary_Position = Column(String)
    Is_Pitcher = Column(BigInteger)
    Batting_Order_Default = Column(BigInteger)

    # TEAM 테이블과의 연결을 위한 관계 설정 (선택 사항)
    team_info = relationship("Team", back_populates="players")