from sqlalchemy import Column, Integer, String, BigInteger
from database import Base

class Game(Base):
    __tablename__ = "game"
    
    id = Column(BigInteger, primary_key=True, index=True)
    date = Column(Integer)
    inning = Column(Integer)
    half = Column(Integer)
    seq = Column(Integer)
    batting_team = Column(Integer)
    fielding_team = Column(Integer)
    batter_id = Column(Integer)
    pitcher_id = Column(Integer)
    result = Column(String)
    outs_before = Column(Integer)
    outs_after = Column(Integer)
    bases_before = Column(Integer)
    bases_after = Column(Integer)
    runs_scored_on_play = Column(Integer)
    error_on_play = Column(Integer)