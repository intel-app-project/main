# BTS (Baseball Team System)

사회인 야구팀 운영에서 반복되는 **경기 일정 공유, 참석 여부 확인, 라인업 구성, 선수 기록 확인** 흐름을 하나의 모바일 앱으로 관리하기 위한 프로젝트입니다.

이 저장소는 Expo React Native 모바일 앱, FastAPI 백엔드, Supabase 기반 데이터 연동, 프로젝트 기획/발표 문서를 함께 포함합니다.

## 프로젝트 개요

BTS는 감독, 선수, 기록원 역할을 기준으로 야구팀 운영 기능을 나누어 제공합니다.

- 선수는 경기 일정을 확인하고 참석/불참 상태를 제출합니다.
- 감독은 참석 가능한 선수를 바탕으로 라인업과 베스트 멤버를 관리합니다.
- 기록원은 경기 일정을 등록, 수정, 삭제하고 기록 반영 흐름을 관리합니다.
- 백엔드는 일정/라인업/리뷰/AI 이미지 생성 API를 제공합니다.

## 기술 스택

### Frontend

- Expo 54
- React Native 0.81
- React 19
- React Navigation
- Supabase JavaScript Client
- Expo File System / Media Library / Asset

### Backend

- FastAPI
- Uvicorn
- Supabase Python SDK
- Pandas
- Google GenAI
- Pillow
- HTTPX

### Data

- Supabase
- 주요 테이블로 `member`, `team`, `schedule`, `game`, `review`를 사용합니다.

## 프로젝트 구조

```text
.
├─ app/                         # Expo React Native 모바일 앱
│  ├─ App.js                    # 앱 최상위 내비게이션 진입점
│  ├─ index.js                  # Expo root component 등록
│  ├─ app.json                  # Expo 앱 설정
│  ├─ package.json              # 앱 실행 스크립트와 프론트엔드 의존성
│  ├─ assets/                   # 앱 아이콘, 스플래시, 이미지 리소스
│  ├─ components/               # 공통 헤더/푸터 컴포넌트
│  ├─ constants/                # API 주소, 일정/라인업 공통 상수
│  ├─ designReference/          # 디자인 참고 문서
│  ├─ lib/                      # Supabase 클라이언트 설정
│  ├─ navigation/               # 역할별 탭/스택 내비게이션
│  ├─ screen/                   # 화면별 UI와 화면 로직
│  ├─ supabaseDataReference/    # Supabase 테이블 참고 SQL
│  └─ utils/                    # 일정, 날짜, API 호출 보조 함수
├─ backend/                     # FastAPI 백엔드
│  ├─ main.py                   # API 엔드포인트, Supabase/AI 연동
│  ├─ requirements.txt          # Python 의존성
│  ├─ review_logic.py           # 선수 리뷰 생성 로직
│  └─ review/                   # 리뷰 규칙, 프롬프트, 서비스 모듈
├─ report_md/                   # 발표/보고서용 정리 문서
├─ BTS_project_overview.md      # 프로젝트 기획서
├─ BTS_user_stories.md          # 사용자 스토리
├─ implementation_plan.md       # CSV 업로드 구현 계획
├─ pull_request_template.md     # PR 템플릿
├─ package.json                 # 루트 의존성 정보
└─ README.md                    # 프로젝트 안내 문서
```

## 주요 기능

### 선수

- 로그인 후 역할 기반 메인 화면 진입
- 내 팀 경기와 리그 경기 일정 확인
- 경기별 참석, 불참, 미응답 상태 관리
- 확정 라인업과 벤치 멤버 확인
- 팀 정보와 팀원 목록 확인
- 개인 성적, 최근 경기, 리뷰 확인
- Gemini/Imagen 기반 AI PR 카드 생성

### 감독

- 소속 팀 경기 중심 일정 확인
- 참석 가능한 선수 기반 라인업 구성
- 포지션, 타순, 벤치, DH 포함 라인업 저장
- 팀 베스트 멤버 관리
- 경기 종료 후 선수별 리뷰 메시지 생성

### 기록원

- 경기 일정 등록
- 경기 일정 수정
- 경기 일정 삭제
- 홈팀/원정팀, 날짜 기준 일정 관리
- 백엔드 CSV 업로드 엔드포인트 사용 가능

## 앱 화면 구성

`app/screen` 디렉터리는 화면 파일과 스타일 파일을 함께 둔 구조입니다.

- `loginScreen.js`: ID/PW 로그인과 역할별 진입 처리
- `myGameScreen.js`: 내 경기, 라인업, 참석자/벤치 확인
- `playerScheduleScreen.js`: 선수 참석 여부 관리
- `directorScheduleScreen.js`: 감독 전용 일정 및 리뷰 생성 흐름
- `lineupScreen.js`: 경기별 라인업 편성
- `managerScheduleScreen.js`: 기록원 일정 CRUD
- `leagueGameScheduleScreen.js`: 리그 전체 경기 일정/결과 조회
- `teamInfoScreen.js`: 팀 정보, 로스터, 베스트 멤버 조회
- `BestMemberScreen.js`: 감독의 베스트 멤버 설정
- `playerDetailScreen.js`: 선수 상세 기록, 리뷰, AI 카드 생성

## 백엔드 API 요약

`backend/main.py`에서 FastAPI 앱과 주요 API를 제공합니다.

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/api/schedule` | 전체 일정 조회 |
| `POST` | `/api/schedule` | 일정 등록 |
| `PUT` | `/api/schedule/{date}` | 일정 수정 |
| `DELETE` | `/api/schedule/{date}` | 일정 삭제 표시 |
| `GET` | `/api/schedule/team/{team_id}` | 팀별 일정 조회 |
| `GET` | `/api/schedule/date/{date}` | 날짜별 일정 조회 |
| `POST` | `/api/schedule/{date}/lineup` | 홈/원정 라인업 저장 |
| `PATCH` | `/api/schedule/attendance` | 선수 참석 상태 수정 |
| `GET` | `/api/member` | 멤버 목록 조회 |
| `POST` | `/api/member` | 멤버 정보 수정 |
| `GET` | `/api/member/{user_id}` | 사용자 ID 기준 멤버 조회 |
| `GET` | `/api/team` | 팀 목록 조회 |
| `GET` | `/api/team/{team_id}` | 팀 상세 조회 |
| `POST` | `/api/team/{team_id}/best_member` | 팀 베스트 멤버 저장 |
| `GET` | `/api/game` | 경기 기록 조회 |
| `GET` | `/api/review/{member_id}` | 선수 리뷰 조회/생성 |
| `POST` | `/api/review/generate-all` | 전체 선수 리뷰 생성 |
| `POST` | `/api/review/generate-by-date` | 특정 날짜/팀 리뷰 생성 |
| `GET` | `/api/gemini` | AI 이미지 프롬프트 생성 |
| `GET` | `/api/banana` | Imagen 이미지 생성 |
| `POST` | `/api/make_card` | 야구 카드 이미지 합성 |
| `POST` | `/upload-csv` | CSV 파일 업로드 후 Supabase 저장 |

## 실행 방법

### 1. 백엔드 실행

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

백엔드 실행에 필요한 환경 변수:

```env
SUPABASE_URL=...
SUPABASE_KEY=...
GOOGLE_API_KEY=...
```

### 2. 프론트엔드 실행

```bash
cd app
npm install
npm run start
```

Expo에서 제공하는 QR 코드 또는 시뮬레이터 실행 옵션을 사용해 앱을 확인할 수 있습니다.

사용 가능한 앱 스크립트:

```bash
npm run start
npm run android
npm run ios
npm run web
```

## 설정 시 주의사항

- `app/constants/commonConstants.js`의 `API_BASE_URL`은 현재 로컬 네트워크 IP를 직접 가리킵니다. 백엔드 실행 환경에 맞게 수정해야 합니다.
- 앱은 일부 기능에서 Supabase를 직접 조회하고, 일부 기능은 FastAPI를 거쳐 Supabase에 접근합니다.
- 백엔드는 `SUPABASE_URL`, `SUPABASE_KEY`, `GOOGLE_API_KEY` 환경 변수를 필요로 합니다.
- AI PR 카드 기능은 Google GenAI/Imagen API 설정이 없으면 동작하지 않습니다.
- CSV 업로드는 백엔드 엔드포인트가 준비되어 있지만, 현재 파일 구조 기준으로 앱 내부 업로드 전용 화면은 별도로 확인되지 않습니다.

## 문서 파일

- `BTS_project_overview.md`: 프로젝트 목적, 문제 정의, MVP 범위
- `BTS_user_stories.md`: 역할별 유저 스토리와 스토리포인트
- `implementation_plan.md`: CSV 업로드 기능 설계
- `report_md/01_directory_structure.md`: 디렉터리 구조 분석
- `report_md/03_README.md`: 발표/보고서용 README 초안
- `report_md/04_deployment_guide.md`: 배포 가이드
- `report_md/07_contributor_work_summary.md`: 기여 내역 정리

## 현재 구조의 특징

- 모바일 앱과 백엔드가 같은 저장소에 들어 있는 단일 저장소 구조입니다.
- 화면은 `screen/*.js`와 `screen/*.styles.js` 페어로 분리되어 있습니다.
- `MainTabNavigator.js`에서 사용자 역할에 따라 탭 구성을 다르게 렌더링합니다.
- 일정/라인업/리뷰/AI 기능은 FastAPI를 통해 처리합니다.
- 로그인과 일부 데이터 조회는 앱에서 Supabase에 직접 접근합니다.
- `backend/main.py`에 API 라우팅, 데이터 접근, AI 연동, 이미지 합성 기능이 많이 모여 있습니다.

## 향후 개선 제안

- `API_BASE_URL`과 Supabase 설정을 환경 변수 기반으로 정리
- 앱의 Supabase 직접 접근과 FastAPI 경유 방식을 일관된 인증/권한 정책으로 통합
- `backend/main.py`를 `routes`, `schemas`, `services` 계층으로 분리
- CSV 업로드 UI 연결
- AI 라인업 추천 기능의 실제 화면/백엔드 연동 보강
- 테스트 코드와 CI/CD 추가
