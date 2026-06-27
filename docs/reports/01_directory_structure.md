# BTS 프로젝트 디렉터리 구조 분석

## 0. 한눈에 보기

이 저장소는 **모바일 앱(Expo React Native)**, **백엔드 API(FastAPI)**, **기획 문서(Markdown)** 가 한 저장소 안에 같이 들어 있는 형태다.  
현재 구조를 한 문장으로 요약하면 다음과 같다.

- 프론트엔드: `app/`
- 백엔드: `backend/`
- 기획/협업 문서: 루트 `.md`
- 저장소 성격: **모바일 클라이언트 + Python API + 문서가 공존하는 단일 저장소**

---

## 1. 전체 트리(의미 있는 파일 중심)

```text
main/
├─ .env
├─ .git/
├─ .gitignore
├─ BTS_project_overview.md
├─ BTS_user_stories.md
├─ README.md
├─ implementation_plan.md
├─ pull_request_template.md
├─ package.json
├─ package-lock.json
├─ app/
│  ├─ .gitignore
│  ├─ App.js
│  ├─ app.json
│  ├─ babel.config.js
│  ├─ index.js
│  ├─ metro.config.js
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ assets/
│  │  ├─ adaptive-icon.png
│  │  ├─ baseballStadium.jpg
│  │  ├─ favicon.png
│  │  ├─ icon.png
│  │  └─ splash-icon.png
│  ├─ components/
│  │  ├─ CommonFooter.js
│  │  └─ CommonHeader.js
│  ├─ constants/
│  │  ├─ commonConstants.js
│  │  └─ scheduleConstants.js
│  ├─ designReference/
│  │  └─ DESIGN.md
│  ├─ lib/
│  │  └─ supabase.js
│  ├─ navigation/
│  │  └─ MainTabNavigator.js
│  ├─ screen/
│  │  ├─ BestMemberScreen.js
│  │  ├─ bestMemberScreen.styles.js
│  │  ├─ directorScheduleScreen.js
│  │  ├─ directorScheduleScreen.styles.js
│  │  ├─ leagueGameScheduleScreen.js
│  │  ├─ leagueGameScheduleScreen.styles.js
│  │  ├─ lineupScreen.js
│  │  ├─ lineupScreen.styles.js
│  │  ├─ loginScreen.js
│  │  ├─ loginScreen.styles.js
│  │  ├─ managerScheduleScreen.js
│  │  ├─ managerScheduleScreen.styles.js
│  │  ├─ myGameScreen.js
│  │  ├─ myGameScreen.styles.js
│  │  ├─ playerDetailScreen.js
│  │  ├─ playerDetailScreen.styles.js
│  │  ├─ playerScheduleScreen.js
│  │  ├─ playerScheduleScreen.styles.js
│  │  ├─ teamInfoScreen.js
│  │  └─ teamInfoScreen.styles.js
│  ├─ supabaseDataReference/
│  │  └─ review_table.sql
│  └─ utils/
│     ├─ dataCall.js
│     └─ scheduleUtils.js
└─ backend/
   ├─ .env
   ├─ main.py
   ├─ requirements.txt
   ├─ review/
   │  ├─ __init__.py
   │  ├─ prompts.py
   │  ├─ rules.py
   │  └─ service.py
   └─ review_logic.py
```

---

## 2. 루트 디렉터리 해설

### `BTS_project_overview.md`
프로젝트 기획서다.  
문제 정의, 사용자(감독/선수/기록원), MVP 범위, MoSCoW, AI 관련 아이디어가 정리되어 있다.

### `BTS_user_stories.md`
유저스토리와 스토리포인트가 정리된 문서다.  
스프린트 단위로 작업을 쪼개려는 흔적이 보인다.

### `implementation_plan.md`
CSV 업로드 → FastAPI → Supabase 반영 흐름을 설계한 문서다.  
현재 코드 기준으로는 **백엔드 업로드 endpoint는 존재**하지만, **앱 화면에서 CSV 업로드 UI는 현재 브랜치에서 직접 확인되지 않는다**는 점을 같이 기억해야 한다.

### `pull_request_template.md`
협업 체계를 갖추려 했던 흔적이다.  
스크럼/PR 기반 작업 흐름을 문서화하려는 방향이 보인다.

### 루트 `package.json`
현재 실제 프런트 실행 중심 파일은 `app/package.json`이다.  
즉, 루트 `package.json`은 저장소 전체를 대표하는 런타임 설정 파일이라기보다 잔존 설정에 가깝다.

---

## 3. 프론트엔드(`app/`) 구조 상세

## 3-1. 진입점과 앱 골격

### `app/App.js`
앱의 최상위 진입점이다.

역할:
- `NavigationContainer` 설정
- `SafeAreaProvider` 적용
- 스택 네비게이터 구성
- `Login` → `MainTab` 흐름 연결

즉, **앱 시작 시 무조건 로그인 화면으로 진입**하고, 로그인 성공 이후 역할에 맞는 메인 탭으로 이동한다.

### `app/index.js`
Expo 앱 엔트리 등록 파일이다.

### `app/app.json`
Expo 앱 메타데이터 설정 파일이다.  
앱 이름, 아이콘, 스플래시 등의 설정이 들어간다.

### `babel.config.js`, `metro.config.js`
Expo/React Native 빌드 도구 설정이다.

---

## 3-2. 공통 UI 계층

### `components/CommonHeader.js`
여러 화면 상단 헤더를 공통화한 컴포넌트다.

### `components/CommonFooter.js`
역할별 하단 탭/푸터 UI를 렌더링한다.

특징:
- 감독과 선수의 하단 메뉴 구성이 다르다.
- 현재 로그인 사용자의 `Primary_Position`을 다시 조회해서 푸터를 분기한다.

해석:
- 장점 점수: `7/10` — 공통 컴포넌트화 시도
- 아쉬움 점수: `5/10` — 역할 정보가 네비게이션에도 있는데 푸터에서 다시 조회함

---

## 3-3. 상수 / 환경값 계층

### `constants/commonConstants.js`
현재 백엔드 서버 주소가 들어 있다.

현재 구조의 의미:
- `API_BASE_URL = "http://172.30.1.19:8000"` 처럼 **로컬 IP가 하드코딩**되어 있다.
- 배포 전 수정 우선순위 점수: `10/10`

### `constants/scheduleConstants.js`
일정/라인업/출석 상태에서 공통으로 사용하는 상수 모음이다.

대표 내용:
- API endpoint 상수
- 출석 옵션(`attending`, `pending`, `absent`)
- 포지션 목록(`P, C, 1B, ...`)
- 초기 라인업 구조

해석:
- 화면 로직 곳곳에 흩어질 값을 한 곳으로 모았다는 점에서 유지보수 점수 `8/10`

---

## 3-4. 외부 서비스 연결 계층

### `lib/supabase.js`
Supabase 클라이언트 생성 파일이다.

현재 구조의 의미:
- 앱이 FastAPI를 거치지 않고도 직접 Supabase에 접근한다.
- 로그인, 역할 조회, 팀/멤버 일부 조회에서 직접 사용한다.

구조 해석:
- 개발 속도 점수: `8/10`
- 보안/운영 일관성 점수: `4/10`

즉, **빠르게 만들기에는 좋지만**, 나중에 인증 정책/권한/감사 로그를 정리하려면 백엔드 경유 방식과 충돌할 수 있다.

---

## 3-5. 네비게이션 계층

### `navigation/MainTabNavigator.js`
이 프로젝트 프론트 구조의 핵심 파일이다.

주요 역할:
- 로그인한 사용자의 역할(`감독`, `기록원`, 일반 선수)을 조회
- 역할에 따라 탭 구성을 다르게 렌더링
- 각 탭을 다시 Stack Navigator로 감싼 뒤 화면 이동 처리

현재 역할별 구조:
- 감독
  - `MyGame`
  - `DirectorSchedule`
  - `TeamInfo`
  - `PlayerDetail`
- 선수
  - `MyGame`
  - `PlayerSchedule`
  - `LeagueGameSchedule`
  - `TeamInfo`
  - `PlayerDetail`
- 기록원
  - 푸터 숨김
  - 사실상 `ManagerScheduleScreen` 중심 진입

구조적 의미:
- 권한별 화면 분기 점수: `9/10`
- 파일 복잡도 점수: `6/10`  
  (역할 판단, 네비게이션 분기, 초기 파라미터 설정이 한 파일에 많이 몰려 있다)

---

## 3-6. 화면(`screen/`) 계층 상세

### `loginScreen.js`
로그인 화면이다.

확인된 기능:
- `member` 테이블에서 `User_ID`, `User_PW`, `Primary_Position` 조회
- 비밀번호 직접 비교
- 역할별 메인 화면 분기
- 개발용 `Quick Login`, `Manager Login` 버튼 존재

의미:
- 테스트 편의성 점수: `9/10`
- 운영 보안 점수: `3/10`

---

### `myGameScreen.js`
사용자의 “다가오는 경기/현재 경기/라인업” 확인 화면이다.

확인된 기능:
- `/api/schedule`, `/api/team`, `/api/member` 조회
- 내 팀 기준 예정 경기 선택
- 홈/원정 여부 파악
- 라인업(`home_lineup`, `away_lineup`) 파싱
- 참석자 로스터와 벤치 표시
- 선수 카드를 누르면 `PlayerDetail`로 이동

즉, **선수/감독 모두가 경기 준비 상황을 한 화면에서 보는 허브**다.

---

### `playerScheduleScreen.js`
선수의 참석 관리 화면이다.

확인된 기능:
- 캘린더 기반 일정 표시
- 경기별 참석/불참/미응답 상태 표시
- `PATCH /api/schedule/attendance` 호출로 참석 상태 갱신

이 화면의 실질 역할:
- 기존 카카오톡 수기 연락 문제를 앱 UX로 대체하는 핵심

핵심성 점수: `10/10`

---

### `leagueGameScheduleScreen.js`
리그 전체 일정/결과 화면이다.

확인된 기능:
- `/api/schedule`, `/api/team`, `/api/game` 조회
- 과거 경기 / 미래 경기 분리
- 날짜 캘린더와 스와이프 전환
- 종료 경기 점수 집계

의미:
- 단순 “팀 일정”이 아니라 **리그 관점 조회 화면**도 별도로 존재

---

### `directorScheduleScreen.js`
감독 전용 일정 관리/라인업 진입 화면이다.

확인된 기능:
- 감독 자신의 팀을 찾음
- 해당 팀 관련 경기 강조 표시
- 예정 경기: `Lineup` 화면으로 이동
- 종료 경기: `review message` 생성 요청

즉, 감독은 이 화면에서
1. 어떤 경기에서  
2. 누구로 라인업을 짤지  
3. 종료 후 어떤 리뷰를 생성할지  
를 관리한다.

---

### `lineupScreen.js`
감독의 실제 라인업 편성 화면이다.

확인된 기능:
- 특정 경기(`targetDate`) 기준 라인업 조회
- 참석 가능한 선수만 후보로 필터링
- 수비 위치 탭 / 타순 설정 탭 분리
- 포지션 중복 방지
- DH 존재 시 투수 타순 제한
- 저장 시 `POST /api/schedule/{date}/lineup?side=...`

기술적 의미:
- 이 프로젝트에서 가장 “규칙 로직”이 많이 들어간 화면
- 발표 소재 점수: `10/10`

---

### `managerScheduleScreen.js`
기록원(또는 일정 담당자)의 일정 등록/수정/삭제 화면이다.

확인된 기능:
- 오늘 이후 경기만 표시
- 날짜 선택 캘린더
- 홈팀/원정팀 선택
- 과거 날짜 등록 차단
- 홈/원정 동일 팀 차단
- 일정 생성/수정/삭제

기능적으로는 **기록원용 일정 CRUD 대시보드**다.

---

### `teamInfoScreen.js`
소속 팀 정보 조회 화면이다.

확인된 기능:
- 내 팀 정보 조회
- 팀 로고/특성 표시
- `best_member` 라인업 조회
- 팀원 목록 표시
- 감독이면 `BestMember` 관리 가능

즉, 팀 개요 + 베스트 라인업 + 로스터를 합친 화면이다.

---

### `BestMemberScreen.js`
감독이 팀의 베스트 멤버를 설정하는 화면이다.

실제 성격:
- 경기 단위 라인업이 아니라
- 팀 단위 추천/기준 라인업 관리 화면

---

### `playerDetailScreen.js`
선수 상세 프로필/기록/AI PR 카드 화면이다.

확인된 기능:
- 타자/투수 성적 계산
- 최근 경기 조회
- `/api/review/{member_id}` 기반 리뷰 조회
- `/api/gemini` + `/api/banana` + `/api/make_card` 흐름으로 AI PR 카드 생성
- 생성된 이미지를 갤러리에 저장

의미:
- 이 앱의 차별화 요소
- 단순 일정 관리 앱에서 “콘텐츠형 기능”으로 확장되는 지점

---

## 3-7. 유틸리티 계층

### `utils/scheduleUtils.js`
날짜 파싱, 캘린더 생성, 참석 상태 계산, 팀명 매핑, 일정 저장/삭제 보조 등의 공통 로직이 모여 있다.

이 파일의 의미:
- 비즈니스 로직을 화면에서 조금 떼어내기 시작한 흔적
- 재사용성 점수: `8/10`

### `utils/dataCall.js`
현재 코드 기준으로 존재감은 낮다.  
후속 정리 대상 점수: `7/10`

---

## 3-8. 참고/레퍼런스 계층

### `designReference/DESIGN.md`
디자인 참고 자료

### `supabaseDataReference/review_table.sql`
리뷰 테이블 생성/참고용 SQL 파일

---

## 4. 백엔드(`backend/`) 구조 상세

## 4-1. `main.py`

현재 백엔드의 거의 모든 로직이 이 한 파일에 들어 있다.

포함된 기능:
- FastAPI 앱 생성
- CORS 설정
- 일정 CRUD API
- 라인업 저장 API
- 멤버/팀 조회 및 수정 API
- 출석 업데이트 API
- 게임 데이터 조회 API
- 리뷰 조회/생성 API
- Gemini/Imagen 기반 이미지 생성 API
- 카드 이미지 합성 API
- CSV 업로드 API

장점:
- 개발 속도 점수: `9/10`

한계:
- 파일 응집도 점수: `4/10`
- 분리 필요도 점수: `9/10`

즉, MVP 단계에서는 빠르지만, 운영 단계에서는 `routes/`, `services/`, `schemas/` 로 분리하는 편이 낫다.

---

## 4-2. `review_logic.py`

리뷰 생성 핵심 로직이 들어 있다.

주요 역할:
- 최근 경기와 이전 경기 비교
- 타자/투수 지표 계산
- 이슈 탐지
- 리뷰 텍스트 생성
- Supabase `review` 테이블 저장

---

## 4-3. `review/` 패키지

### `review/prompts.py`
리뷰 메시지 문구 생성 관련

### `review/rules.py`
타자/투수 지표 계산, 이슈 감지 규칙

### `review/service.py`
리뷰 조회/생성 서비스 레이어

구조 해석:
- 좋은 방향 점수: `8/10`
- 아직 정리 덜 된 상태 점수: `6/10`

왜냐하면 현재 리뷰 로직이 `review_logic.py` 와 `review/` 패키지로 **이중 분산**되어 있기 때문이다.

---

## 4-4. `requirements.txt`

확인된 핵심 라이브러리:
- `fastapi`, `uvicorn`
- `supabase`
- `pandas`
- `python-multipart`
- `google-genai`
- `Pillow`
- `httpx`

즉, 이 백엔드는 단순 CRUD 서버가 아니라
1. 데이터 조회/저장  
2. CSV 파싱  
3. AI 프롬프트/이미지 생성  
4. 카드 이미지 후처리  
까지 맡고 있다.

---

## 5. 현재 구조를 기술적으로 해석하면

## 5-1. 데이터 접근이 2갈래다

### 갈래 A. 앱 → Supabase 직접 접근
예:
- 로그인
- 역할 조회
- 일부 팀/멤버 조회

### 갈래 B. 앱 → FastAPI → Supabase
예:
- 일정 CRUD
- 참석 수정
- 리뷰/AI 기능
- 라인업 저장

이 구조의 평가:
- 개발 속도: `8/10`
- 구현 단순성: `6/10`
- 운영 일관성: `4/10`

즉, 현재는 **“빠르게 만드는 구조”** 에 가깝고,  
배포 이후에는 **“인증/권한/감사 로그를 한 군데서 처리하는 구조”** 로 바꿔야 한다.

---

## 5-2. 화면 단위 분리는 잘 되어 있다

`screen/*.js` + `*.styles.js` 페어 구조는 꽤 명확하다.

장점:
- UI 파일과 스타일 파일이 분리되어 가독성이 좋다.
- 한 화면씩 책임을 분리했다.

평가:
- UI 모듈화 점수: `8/10`

---

## 5-3. 하지만 화면 내부 로직은 아직 크다

예:
- `playerDetailScreen.js`
- `lineupScreen.js`
- `directorScheduleScreen.js`
- `managerScheduleScreen.js`

이 파일들은 네트워크 호출 + 상태관리 + 비즈니스 규칙 + UI 렌더링이 함께 들어 있다.

평가:
- 발표 소재로는 좋음: `9/10`
- 유지보수성은 낮음: `5/10`

---

## 6. 이 구조에서 바로 보이는 리팩터링 포인트

## 6-1. 1순위 (`10/10`)
### 환경변수 분리
- `API_BASE_URL` 하드코딩 제거
- Supabase URL / Key 분리
- `.env` Git 추적 제거

---

## 6-2. 2순위 (`9/10`)
### 백엔드 분리
`main.py` 를 아래처럼 분리하는 것이 자연스럽다.

```text
backend/
├─ main.py
├─ routes/
│  ├─ schedule.py
│  ├─ member.py
│  ├─ team.py
│  ├─ review.py
│  └─ ai.py
├─ services/
│  ├─ schedule_service.py
│  ├─ review_service.py
│  └─ image_service.py
└─ schemas/
   ├─ schedule.py
   └─ member.py
```

---

## 6-3. 3순위 (`9/10`)
### 인증/권한 정책 일원화
지금은 앱이 직접 Supabase와 이야기하고, 다른 곳은 FastAPI를 거친다.  
운영 단계에서는 로그인/권한 확인을 한 루트로 정리하는 것이 좋다.

질문:
- 로그인도 전부 백엔드에서 처리할 것인가?
- 아니면 Supabase Auth를 공식 인증으로 채택할 것인가?

---

## 6-4. 4순위 (`8/10`)
### CSV 업로드 기능의 실제 UX 정리
현재 저장소 기준으로는:
- 백엔드 endpoint: 있음
- 앱 업로드 UI: 현재 브랜치에서 직접 확인되지 않음

즉, 발표에서는 이 부분을
- “구현 완료”
가 아니라
- “백엔드 준비 + 프론트 연결 보완 필요”
로 표현하는 편이 정확하다.

---

## 6-5. 5순위 (`8/10`)
### 파일명 / import 케이스 정리
현재 `MainTabNavigator.js` 에서 `../screen/bestMemberScreen` 으로 import 하지만 실제 파일명은 `BestMemberScreen.js` 이다.  
로컬 Windows/macOS 에서는 통과할 수 있어도, **Linux 기반 배포 환경에서는 깨질 가능성**이 있다.

---

## 7. 구조 총평

항목별 점수:

- 기능 분리 점수: `8/10`
- MVP 구현 속도 점수: `9/10`
- 배포 준비도 점수: `4/10`
- 보안/환경관리 점수: `3/10`
- 발표용 설명 가능성 점수: `9/10`

핵심 해석:
1. 이 프로젝트는 **문제 정의와 화면 단위 기능 구현은 잘 되어 있다.**
2. 다만 구조는 아직 **MVP를 빠르게 완성하는 방향** 에 가깝다.
3. 그래서 발표에서는 “무엇을 만들었는가” 뿐 아니라  
   “이 구조를 운영형 구조로 바꾸려면 무엇을 정리해야 하는가” 까지 말하면 완성도가 올라간다.
