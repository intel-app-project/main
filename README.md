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
├─ apps/
│  ├─ mobile/                   # Expo React Native 모바일 앱 실행 루트
│  │  ├─ index.js               # Expo root component 등록
│  │  ├─ app.json               # Expo 앱 설정
│  │  ├─ package.json           # 앱 실행 스크립트와 프론트엔드 의존성
│  │  ├─ assets/                # 앱 아이콘, 스플래시, 이미지 리소스
│  │  └─ src/                   # 모바일 앱 소스
│  │     ├─ app/                # 앱 최상위 컴포넌트
│  │     ├─ components/         # 공통 컴포넌트
│  │     ├─ config/             # 모바일 공개 환경 설정
│  │     ├─ constants/          # 일정/라인업 공통 상수
│  │     ├─ features/           # 기능 도메인별 화면과 유틸
│  │     ├─ navigation/         # 역할별 탭/스택 내비게이션
│  │     └─ services/           # Supabase 등 외부 서비스 클라이언트
│  └─ api/                      # FastAPI 백엔드 실행 루트
│     ├─ main.py                # API 엔드포인트, Supabase/AI 연동
│     ├─ requirements.txt       # Python 의존성
│     ├─ review_logic.py        # 선수 리뷰 생성 로직
│     └─ review/                # 리뷰 규칙, 프롬프트, 서비스 모듈
├─ database/
│  └─ supabase/migrations/      # Supabase SQL migration 참고 파일
├─ docs/
│  ├─ planning/                 # 기획서, 유저스토리
│  └─ reports/                  # 발표/보고서, 시연 영상, 와이어프레임
│     ├─ capture/               # 역할별 UI 시연 mp4
│     └─ wireframe/             # 화면 기획 이미지
├─ .env.example                 # 전체 환경 변수 예시
├─ pull_request_template.md     # PR 템플릿
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

`apps/mobile/src/features` 디렉터리는 기능 도메인별로 화면 파일과 스타일 파일을 나누어 둔 구조입니다.

- `features/auth/screens/LoginScreen.js`: ID/PW 로그인과 역할별 진입 처리
- `features/schedules/screens/MyGameScreen.js`: 내 경기, 라인업, 참석자/벤치 확인
- `features/schedules/screens/PlayerScheduleScreen.js`: 선수 참석 여부 관리
- `features/schedules/screens/DirectorScheduleScreen.js`: 감독 전용 일정 및 리뷰 생성 흐름
- `features/schedules/screens/ManagerScheduleScreen.js`: 기록원 일정 CRUD
- `features/schedules/screens/LeagueGameScheduleScreen.js`: 리그 전체 경기 일정/결과 조회
- `features/lineups/screens/LineupScreen.js`: 경기별 라인업 편성
- `features/lineups/screens/BestMemberScreen.js`: 감독의 베스트 멤버 설정
- `features/teams/screens/TeamInfoScreen.js`: 팀 정보, 로스터, 베스트 멤버 조회
- `features/players/screens/PlayerDetailScreen.js`: 선수 상세 기록, 리뷰, AI 카드 생성

## 시연 영상

`docs/reports/capture/`에는 역할별 UI 흐름을 확인할 수 있는 mp4 시연 영상이 정리되어 있습니다.

| 구분 | 영상 | 확인 가능한 흐름 |
| --- | --- | --- |
| 선수 전체 | [선수UI-전체.mp4](<docs/reports/capture/선수UI-전체.mp4>) | 선수 로그인 이후 주요 탭과 전체 사용 흐름 |
| 선수 내 경기 | [선수UI-내경기.mp4](<docs/reports/capture/선수UI-내경기.mp4>) | 내 팀 경기, 라인업, 참석자/벤치 확인 |
| 선수 일정 관리 | [선수UI-일정관리.mp4](<docs/reports/capture/선수UI-일정관리.mp4>) | 경기 일정 확인과 참석/불참/미응답 상태 관리 |
| 선수 팀 정보 | [선수UI-팀정보.mp4](<docs/reports/capture/선수UI-팀정보.mp4>) | 팀 정보, 베스트 멤버, 로스터 조회 |
| 선수 리그 일정 | [선수UI-리그일정.mp4](<docs/reports/capture/선수UI-리그일정.mp4>) | 리그 전체 경기 일정과 결과 조회 |
| 감독 전체 | [감독UI-전체.mp4](<docs/reports/capture/감독UI-전체.mp4>) | 감독 일정 확인, 라인업 구성, 베스트 멤버 관리, 리뷰 생성 흐름 |
| 기록원 전체 | [기록원(manager)UI-전체.mp4](<docs/reports/capture/기록원(manager)UI-전체.mp4>) | 경기 일정 등록, 수정, 삭제 중심의 기록원 관리 흐름 |

## 백엔드 API 요약

`apps/api/main.py`에서 FastAPI 앱과 주요 API를 제공합니다.

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
cd apps/api
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

루트에서 바로 실행할 수도 있습니다.

```bash
./scripts/dev_api.sh
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
cd apps/mobile
npm install
npm run start
```

루트에서 바로 실행할 수도 있습니다.

```bash
./scripts/dev_mobile.sh
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

- 모바일 앱은 `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 환경 변수를 사용합니다.
- 앱은 일부 기능에서 Supabase를 직접 조회하고, 일부 기능은 FastAPI를 거쳐 Supabase에 접근합니다.
- 백엔드는 `SUPABASE_URL`, `SUPABASE_KEY`, `GOOGLE_API_KEY` 환경 변수를 필요로 합니다.
- AI PR 카드 기능은 Google GenAI/Imagen API 설정이 없으면 동작하지 않습니다.
- CSV 업로드는 백엔드 엔드포인트가 준비되어 있지만, 현재 파일 구조 기준으로 앱 내부 업로드 전용 화면은 별도로 확인되지 않습니다.

## 문서 파일

- `docs/planning/BTS_project_overview.md`: 프로젝트 목적, 문제 정의, MVP 범위
- `docs/planning/BTS_user_stories.md`: 역할별 유저 스토리와 스토리포인트
- `docs/reports/project_structure.md`: 현재 파일 구조와 파일별 역할 정리
- `docs/reports/02_user_flow_mermaid.md`: 역할별 사용자 흐름과 시스템 흐름 다이어그램
- `docs/reports/06_presentation_suggestions.md`: 발표 구성과 데모 순서 제안
- `docs/reports/DevLog.md`: 개발 노트와 와이어프레임 연결 자료
- `docs/reports/dev_commit_history_detail.md`: dev 브랜치 커밋 기반 기여 분석
- `docs/reports/choi_hyunseok_portfolio_problem_solving.md`: 포트폴리오용 문제 해결 기여 정리
- `docs/reports/DESIGN.md`: 앱 디자인 방향과 UI 규칙
- `docs/reports/capture/`: 역할별 UI 시연 mp4 영상
- `docs/reports/wireframe/`: 로그인, 선수, 감독, 기록원 화면 기획 이미지

## 현재 구조의 특징

- 모바일 앱과 백엔드가 같은 저장소에 들어 있는 단일 저장소 구조입니다.
- 실행 단위는 `apps/mobile`, `apps/api`로 분리되어 있습니다.
- 모바일 화면은 `apps/mobile/src/features/*/screens`에 기능 도메인별로 배치되어 있습니다.
- `MainTabNavigator.js`에서 사용자 역할에 따라 탭 구성을 다르게 렌더링합니다.
- 일정/라인업/리뷰/AI 기능은 FastAPI를 통해 처리합니다.
- 로그인과 일부 데이터 조회는 앱에서 Supabase에 직접 접근합니다.
- `apps/api/main.py`에 API 라우팅, 데이터 접근, AI 연동, 이미지 합성 기능이 아직 많이 모여 있습니다.

## 향후 개선 제안

- 앱의 Supabase 직접 접근과 FastAPI 경유 방식을 일관된 인증/권한 정책으로 통합
- `apps/api/main.py`를 `routes`, `schemas`, `services` 계층으로 분리
- 모바일 일정/라인업/선수 상세 화면 내부의 중복 유틸과 비즈니스 규칙 분리
- CSV 업로드 UI 연결
- AI 라인업 추천 기능의 실제 화면/백엔드 연동 보강
- 테스트 코드와 CI/CD 추가
