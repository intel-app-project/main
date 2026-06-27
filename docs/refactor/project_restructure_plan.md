# BTS 프로젝트 폴더 구조 개선 제안 및 리팩토링 계획

작성 기준: 2026-06-27 현재 `/Users/company/Desktop/main` 작업트리 기준.  
선행 문서: `docs/refactor/project_structure.md`

진행 상태: Phase 1~4, Phase 7의 1차 구조 이동은 적용됨. 남은 큰 작업은 백엔드 라우트/서비스 분리, 모바일 도메인 로직 분리, 테스트 도입이다.

이 문서는 프로젝트를 깔끔하게 재정리하기 위한 목표 폴더 구조와 실행 계획이다. 나중에 Codex에게 이 파일을 읽히면, 단순 제안서가 아니라 실제 리팩토링 작업 계획서로 사용할 수 있도록 작성했다.

## 0. 이 문서를 사용하는 방법

리팩토링을 시작할 때는 다음 순서로 진행한다.

1. 먼저 `docs/refactor/project_structure.md`를 읽어 리팩토링 전 구조와 파일별 역할을 확인한다.
2. 그 다음 이 문서의 `목표 구조`, `파일 이동 매핑`, `단계별 실행 계획`을 기준으로 작업한다.
3. 한 번에 전체 구조를 바꾸지 말고, 단계별로 이동/검증/커밋 가능한 단위로 나눈다.
4. 기능 변경과 폴더 이동을 같은 커밋에 섞지 않는다.
5. import 경로 변경 후 반드시 앱/백엔드 최소 실행 검증을 한다.

이 문서의 핵심 원칙은 다음과 같다.

- 먼저 실행 가능한 구조를 보존한다.
- 그 다음 폴더를 정리한다.
- 마지막에 중복 로직과 책임 분리를 진행한다.

## 1. 현재 구조의 핵심 문제

현재 프로젝트는 MVP 구현에는 충분하지만, 전체 리팩토링을 진행하기에는 책임 경계가 흐릿하다.

### 1.1 실행 단위가 루트에서 명확히 드러나지 않음

현재 실행 단위:

```text
app/      # Expo React Native 앱
backend/  # FastAPI 백엔드
```

문제:

- 루트만 보면 앱과 API가 동등한 실행 단위인지 바로 보이지 않는다.
- 문서, 앱, 백엔드, DB 참고 SQL이 같은 레벨 또는 애매한 위치에 흩어져 있다.
- 배포나 CI 구성을 만들 때 root directory 선택이 불명확해진다.

### 1.2 프론트엔드 내부가 화면 중심으로만 쌓여 있음

현재 구조:

```text
app/
├─ components/
├─ constants/
├─ lib/
├─ navigation/
├─ screen/
└─ utils/
```

문제:

- `screen/`에 UI, API 호출, 데이터 정규화, 비즈니스 규칙이 같이 들어 있다.
- 일정/캘린더 로직이 여러 화면에 반복된다.
- 라인업 규칙이 `lineupScreen.js`와 `BestMemberScreen.js`에 중복된다.
- 화면 수가 늘어나면 `screen/` 폴더가 거대한 평면 구조가 된다.

### 1.3 백엔드가 `main.py`에 과도하게 집중됨

현재 `backend/main.py`는 다음 책임을 모두 갖고 있다.

- FastAPI 앱 생성
- CORS 설정
- Supabase client 생성
- Google GenAI client 생성
- 요청 모델 정의
- 일정 API
- 멤버 API
- 팀 API
- 라인업 API
- 참석 API
- 리뷰 API
- AI 이미지 API
- 카드 합성 API
- CSV 업로드 API

문제:

- 기능별 수정 범위를 예측하기 어렵다.
- API 테스트를 기능별로 나누기 어렵다.
- import 중복, 라우트 중복, 미사용 모델이 생기기 쉽다.

### 1.4 DB/문서/참고 파일 위치가 도메인과 맞지 않음

현재:

```text
app/supabaseDataReference/review_table.sql
report_md/
BTS_project_overview.md
BTS_user_stories.md
```

문제:

- DB SQL이 앱 폴더 안에 있어 백엔드/DB 책임으로 보이지 않는다.
- 발표 문서와 프로젝트 운영 문서가 루트와 `report_md/`에 나뉘어 있다.
- 리팩토링 문서가 늘어나면 루트가 문서로 더 복잡해질 가능성이 있다.

## 2. 목표 구조 설계 원칙

### 2.1 실행 단위는 `apps/` 아래로 모은다

권장 구조:

```text
apps/
├─ mobile/  # Expo React Native 앱
└─ api/     # FastAPI 백엔드
```

이 방식의 장점:

- 프론트와 백엔드가 같은 저장소 안에서 명확히 분리된다.
- Vercel, Expo EAS, CI 설정에서 root directory를 지정하기 쉽다.
- 나중에 `admin`, `web`, `worker` 같은 실행 단위가 추가되어도 확장 가능하다.

### 2.2 앱 소스는 `src/` 아래로 모은다

Expo 설정 파일과 앱 소스 코드를 분리한다.

권장 구조:

```text
apps/mobile/
├─ app.json
├─ package.json
├─ index.js
├─ assets/
└─ src/
   ├─ app/
   ├─ navigation/
   ├─ features/
   ├─ components/
   ├─ services/
   ├─ config/
   ├─ constants/
   ├─ utils/
   └─ theme/
```

이 방식의 장점:

- Expo/Metro 설정 파일과 실제 앱 코드가 분리된다.
- 화면/도메인/공통 컴포넌트의 책임을 구분할 수 있다.
- 대규모 리팩토링 후 import 경로를 일관되게 관리할 수 있다.

### 2.3 화면은 기능 도메인 기준으로 묶는다

현재는 모든 화면이 `screen/` 하나에 있다. 목표는 도메인별 feature 폴더로 묶는 것이다.

권장 feature:

- `auth`: 로그인/권한 진입
- `schedules`: 선수/감독/기록원 일정 화면, 캘린더, 일정 API
- `lineups`: 경기별 라인업, 팀 베스트 멤버, 라인업 규칙
- `teams`: 팀 정보, 팀원 목록
- `players`: 선수 상세, 기록 계산, 레이더 차트
- `reviews`: 리뷰 조회/생성 표시
- `aiCards`: PR 이미지 생성, 카드 미리보기, 갤러리 저장

단, 첫 리팩토링에서 모든 화면을 완벽히 feature 구조로 쪼개려고 하면 위험하다. 1차 목표는 안전한 이동과 import 정리이고, 2차 목표가 로직 분리다.

### 2.4 백엔드는 라우트, 스키마, 서비스, 저장소 계층으로 분리한다

권장 계층:

- `api/routes`: HTTP endpoint만 담당
- `schemas`: Pydantic request/response 모델
- `services`: 비즈니스 로직
- `repositories`: Supabase table 접근
- `domain`: 순수 계산/규칙 함수
- `core`: 환경 변수, client, middleware, 공통 예외

이 방식의 장점:

- API별 수정 범위가 작아진다.
- Supabase 접근을 한 계층에 모을 수 있다.
- 순수 함수와 외부 I/O를 분리해 테스트가 쉬워진다.

### 2.5 문서와 DB 스키마는 별도 최상위 폴더로 분리한다

권장 구조:

```text
docs/
database/
```

문서와 DB 산출물은 실행 코드와 분리해야 한다.

## 3. 최종 목표 폴더 구조

아래 구조가 리팩토링 후 목표 상태다.

```text
main/
├─ README.md
├─ .gitignore
├─ .env.example
├─ pull_request_template.md
├─ apps/
│  ├─ mobile/
│  │  ├─ .gitignore
│  │  ├─ app.json
│  │  ├─ babel.config.js
│  │  ├─ index.js
│  │  ├─ metro.config.js
│  │  ├─ package-lock.json
│  │  ├─ package.json
│  │  ├─ assets/
│  │  │  ├─ adaptive-icon.png
│  │  │  ├─ baseballStadium.jpg
│  │  │  ├─ favicon.png
│  │  │  ├─ icon.png
│  │  │  └─ splash-icon.png
│  │  └─ src/
│  │     ├─ app/
│  │     │  └─ AppRoot.js
│  │     ├─ navigation/
│  │     │  ├─ MainTabNavigator.js
│  │     │  └─ routeNames.js
│  │     ├─ components/
│  │     │  └─ common/
│  │     │     ├─ CommonFooter.js
│  │     │     └─ CommonHeader.js
│  │     ├─ config/
│  │     │  └─ env.js
│  │     ├─ constants/
│  │     │  ├─ apiEndpoints.js
│  │     │  ├─ attendance.js
│  │     │  └─ lineup.js
│  │     ├─ features/
│  │     │  ├─ auth/
│  │     │  │  └─ screens/
│  │     │  │     ├─ LoginScreen.js
│  │     │  │     └─ LoginScreen.styles.js
│  │     │  ├─ schedules/
│  │     │  │  ├─ screens/
│  │     │  │  │  ├─ MyGameScreen.js
│  │     │  │  │  ├─ MyGameScreen.styles.js
│  │     │  │  │  ├─ PlayerScheduleScreen.js
│  │     │  │  │  ├─ PlayerScheduleScreen.styles.js
│  │     │  │  │  ├─ DirectorScheduleScreen.js
│  │     │  │  │  ├─ DirectorScheduleScreen.styles.js
│  │     │  │  │  ├─ LeagueGameScheduleScreen.js
│  │     │  │  │  ├─ LeagueGameScheduleScreen.styles.js
│  │     │  │  │  ├─ ManagerScheduleScreen.js
│  │     │  │  │  └─ ManagerScheduleScreen.styles.js
│  │     │  │  ├─ components/
│  │     │  │  ├─ services/
│  │     │  │  │  └─ scheduleApi.js
│  │     │  │  └─ utils/
│  │     │  │     ├─ calendarUtils.js
│  │     │  │     └─ scheduleMappers.js
│  │     │  ├─ lineups/
│  │     │  │  ├─ screens/
│  │     │  │  │  ├─ LineupScreen.js
│  │     │  │  │  ├─ LineupScreen.styles.js
│  │     │  │  │  ├─ BestMemberScreen.js
│  │     │  │  │  └─ BestMemberScreen.styles.js
│  │     │  │  ├─ services/
│  │     │  │  │  └─ lineupApi.js
│  │     │  │  └─ utils/
│  │     │  │     └─ lineupRules.js
│  │     │  ├─ teams/
│  │     │  │  ├─ screens/
│  │     │  │  │  ├─ TeamInfoScreen.js
│  │     │  │  │  └─ TeamInfoScreen.styles.js
│  │     │  │  └─ services/
│  │     │  │     └─ teamApi.js
│  │     │  ├─ players/
│  │     │  │  ├─ screens/
│  │     │  │  │  ├─ PlayerDetailScreen.js
│  │     │  │  │  └─ PlayerDetailScreen.styles.js
│  │     │  │  ├─ components/
│  │     │  │  ├─ services/
│  │     │  │  │  └─ playerApi.js
│  │     │  │  └─ utils/
│  │     │  │     └─ playerStats.js
│  │     │  ├─ reviews/
│  │     │  │  └─ services/
│  │     │  │     └─ reviewApi.js
│  │     │  └─ aiCards/
│  │     │     ├─ services/
│  │     │     │  └─ aiCardApi.js
│  │     │     └─ utils/
│  │     │        └─ cardImageStorage.js
│  │     ├─ services/
│  │     │  ├─ apiClient.js
│  │     │  └─ supabaseClient.js
│  │     ├─ theme/
│  │     │  ├─ colors.js
│  │     │  ├─ spacing.js
│  │     │  └─ typography.js
│  │     └─ utils/
│  │        ├─ dateUtils.js
│  │        └─ jsonUtils.js
│  └─ api/
│     ├─ .env.example
│     ├─ main.py
│     ├─ requirements.txt
│     ├─ app/
│     │  ├─ __init__.py
│     │  ├─ main.py
│     │  ├─ api/
│     │  │  ├─ __init__.py
│     │  │  └─ routes/
│     │  │     ├─ __init__.py
│     │  │     ├─ schedules.py
│     │  │     ├─ members.py
│     │  │     ├─ teams.py
│     │  │     ├─ games.py
│     │  │     ├─ reviews.py
│     │  │     ├─ ai_cards.py
│     │  │     └─ uploads.py
│     │  ├─ core/
│     │  │  ├─ __init__.py
│     │  │  ├─ clients.py
│     │  │  ├─ config.py
│     │  │  ├─ cors.py
│     │  │  └─ errors.py
│     │  ├─ domain/
│     │  │  ├─ __init__.py
│     │  │  ├─ attendance.py
│     │  │  ├─ lineup_rules.py
│     │  │  └─ review_metrics.py
│     │  ├─ repositories/
│     │  │  ├─ __init__.py
│     │  │  ├─ schedule_repository.py
│     │  │  ├─ member_repository.py
│     │  │  ├─ team_repository.py
│     │  │  ├─ game_repository.py
│     │  │  └─ review_repository.py
│     │  ├─ schemas/
│     │  │  ├─ __init__.py
│     │  │  ├─ schedule.py
│     │  │  ├─ member.py
│     │  │  ├─ team.py
│     │  │  ├─ review.py
│     │  │  └─ upload.py
│     │  ├─ services/
│     │  │  ├─ __init__.py
│     │  │  ├─ schedule_service.py
│     │  │  ├─ member_service.py
│     │  │  ├─ team_service.py
│     │  │  ├─ review_service.py
│     │  │  ├─ ai_card_service.py
│     │  │  └─ csv_upload_service.py
│     │  └─ assets/
│     │     └─ fonts/
│     └─ tests/
│        ├─ test_review_metrics.py
│        ├─ test_lineup_rules.py
│        └─ test_schedules_api.py
├─ database/
│  └─ supabase/
│     ├─ README.md
│     └─ migrations/
│        └─ 0001_create_review_table.sql
├─ docs/
│  ├─ planning/
│  │  ├─ BTS_project_overview.md
│  │  └─ BTS_user_stories.md
│  ├─ reports/
│  │  ├─ 01_directory_structure.md
│  │  ├─ 02_user_flow_mermaid.md
│  │  ├─ 03_README.md
│  │  ├─ 05_technical_presentation_topics.md
│  │  ├─ 06_presentation_suggestions.md
│  │  └─ 07_contributor_work_summary.md
│  ├─ deployment/
│  │  └─ 04_deployment_guide.md
│  └─ refactor/
│     ├─ project_structure.md
│     └─ project_restructure_plan.md
└─ scripts/
   ├─ dev_api.sh
   └─ dev_mobile.sh
```

## 4. 목표 구조의 폴더별 책임

### 4.1 루트

루트는 저장소 전체를 설명하고 연결하는 최소 파일만 둔다.

유지할 파일:

- `README.md`
- `.gitignore`
- `.env.example`
- `pull_request_template.md`

루트에 두지 않는 것이 좋은 것:

- 상세 발표 문서
- Supabase SQL
- 앱 내부 소스
- 백엔드 내부 소스
- 로컬 `.env`
- `.DS_Store`
- `__pycache__`
- `.pyc`

### 4.2 `apps/mobile/`

Expo React Native 앱의 실행 루트다.

역할:

- Expo 설정 관리
- 모바일 앱 소스 포함
- 모바일 앱 의존성 관리
- 모바일 앱 assets 관리

중요 규칙:

- `apps/mobile/package.json`이 모바일 앱의 기준 package 파일이다.
- `apps/mobile/index.js`는 `src/app/AppRoot.js`를 등록한다.
- 화면 코드는 `src/features/*/screens`에 둔다.
- 공통 컴포넌트는 `src/components/common`에 둔다.
- API 호출은 화면 안에 직접 쓰지 말고 feature별 service로 이동한다.

### 4.3 `apps/api/`

FastAPI 백엔드의 실행 루트다.

역할:

- API 서버 실행
- Supabase 접근
- Google AI 접근
- 카드 이미지 합성
- CSV 업로드 처리
- 서버측 권한/검증 책임

중요 규칙:

- `apps/api/main.py`는 배포/실행용 얇은 entrypoint로 둔다.
- 실제 FastAPI 앱 조립은 `apps/api/app/main.py`에서 한다.
- 라우트는 `app/api/routes/*.py`에 둔다.
- Supabase table 접근은 `repositories/`로 모은다.
- 지표 계산과 라인업 규칙 같은 순수 로직은 `domain/`에 둔다.

### 4.4 `database/`

DB 스키마, migration, seed, SQL 참고 파일을 둔다.

역할:

- Supabase 테이블 생성 SQL 관리
- 인덱스/제약 조건 기록
- 나중에 schema migration 흐름을 만들 기반 제공

현재 이동 대상:

- `app/supabaseDataReference/review_table.sql`

### 4.5 `docs/`

기획, 발표, 배포, 리팩토링 문서를 둔다.

권장 분류:

- `docs/planning`: 기획서, 유저스토리
- `docs/reports`: 발표/보고서/흐름 문서
- `docs/deployment`: 배포 문서
- `docs/refactor`: 구조 분석/리팩토링 계획 문서

### 4.6 `scripts/`

반복 실행 명령을 스크립트로 둔다.

예시:

- `scripts/dev_mobile.sh`
- `scripts/dev_api.sh`

단, 스크립트 추가는 필수 1순위가 아니다. 먼저 구조 이동이 안정화된 뒤 추가한다.

## 5. 현재 파일 이동 매핑

이 섹션은 실제 `git mv` 작업 기준으로 사용한다.

### 5.1 루트 문서 이동

| 현재 위치 | 목표 위치 | 비고 |
| --- | --- | --- |
| `BTS_project_overview.md` | `docs/planning/BTS_project_overview.md` | 기획 문서 |
| `BTS_user_stories.md` | `docs/planning/BTS_user_stories.md` | 유저스토리 |
| `report_md/01_directory_structure.md` | `docs/reports/01_directory_structure.md` | 기존 구조 분석 문서 |
| `report_md/02_user_flow_mermaid.md` | `docs/reports/02_user_flow_mermaid.md` | 사용자 흐름 문서 |
| `report_md/03_README.md` | `docs/reports/03_README.md` | 발표용 README |
| `report_md/04_deployment_guide.md` | `docs/deployment/04_deployment_guide.md` | 배포 가이드 |
| `report_md/05_technical_presentation_topics.md` | `docs/reports/05_technical_presentation_topics.md` | 기술 발표 문서 |
| `report_md/06_presentation_suggestions.md` | `docs/reports/06_presentation_suggestions.md` | 발표 구성 문서 |
| `report_md/07_contributor_work_summary.md` | `docs/reports/07_contributor_work_summary.md` | 기여 정리 문서 |
| `project_structure.md` | `docs/refactor/project_structure.md` | 현재 구조 문서 |
| `project_restructure_plan.md` | `docs/refactor/project_restructure_plan.md` | 이 계획 문서 |

루트에는 `README.md`만 대표 문서로 남기는 것이 좋다.

### 5.2 모바일 앱 이동

| 현재 위치 | 목표 위치 | 비고 |
| --- | --- | --- |
| `app/package.json` | `apps/mobile/package.json` | Expo 앱 package |
| `app/package-lock.json` | `apps/mobile/package-lock.json` | Expo 앱 lock |
| `app/app.json` | `apps/mobile/app.json` | Expo 설정 |
| `app/index.js` | `apps/mobile/index.js` | entry 등록 |
| `app/App.js` | `apps/mobile/src/app/AppRoot.js` | import 경로 업데이트 필요 |
| `app/babel.config.js` | `apps/mobile/babel.config.js` | 설정 파일 |
| `app/metro.config.js` | `apps/mobile/metro.config.js` | 설정 파일 |
| `app/.gitignore` | `apps/mobile/.gitignore` | 앱 전용 ignore |
| `app/assets/*` | `apps/mobile/assets/*` | app.json 경로 확인 필요 |

### 5.3 모바일 공통 파일 이동

| 현재 위치 | 목표 위치 | 비고 |
| --- | --- | --- |
| `app/components/CommonHeader.js` | `apps/mobile/src/components/common/CommonHeader.js` | 공통 헤더 |
| `app/components/CommonFooter.js` | `apps/mobile/src/components/common/CommonFooter.js` | 공통 푸터 |
| `app/navigation/MainTabNavigator.js` | `apps/mobile/src/navigation/MainTabNavigator.js` | import 전체 수정 필요 |
| `app/lib/supabase.js` | `apps/mobile/src/services/supabaseClient.js` | 환경 변수 기반으로 수정 권장 |
| `app/constants/commonConstants.js` | `apps/mobile/src/config/env.js` | `API_BASE_URL` 외부화 |
| `app/constants/scheduleConstants.js` | `apps/mobile/src/constants/*` | 여러 파일로 분리 |
| `app/utils/scheduleUtils.js` | `apps/mobile/src/features/schedules/utils/*` 및 `src/utils/*` | 기능별 분리 |
| `app/utils/dataCall.js` | 삭제 또는 `src/services/apiClient.js`로 대체 | 현재 주석만 있음 |
| `app/designReference/DESIGN.md` | `docs/reports/DESIGN.md` 또는 `apps/mobile/src/theme/README.md` | 디자인 문서 |

### 5.4 모바일 화면 이동

| 현재 위치 | 목표 위치 |
| --- | --- |
| `app/screen/loginScreen.js` | `apps/mobile/src/features/auth/screens/LoginScreen.js` |
| `app/screen/loginScreen.styles.js` | `apps/mobile/src/features/auth/screens/LoginScreen.styles.js` |
| `app/screen/myGameScreen.js` | `apps/mobile/src/features/schedules/screens/MyGameScreen.js` |
| `app/screen/myGameScreen.styles.js` | `apps/mobile/src/features/schedules/screens/MyGameScreen.styles.js` |
| `app/screen/playerScheduleScreen.js` | `apps/mobile/src/features/schedules/screens/PlayerScheduleScreen.js` |
| `app/screen/playerScheduleScreen.styles.js` | `apps/mobile/src/features/schedules/screens/PlayerScheduleScreen.styles.js` |
| `app/screen/directorScheduleScreen.js` | `apps/mobile/src/features/schedules/screens/DirectorScheduleScreen.js` |
| `app/screen/directorScheduleScreen.styles.js` | `apps/mobile/src/features/schedules/screens/DirectorScheduleScreen.styles.js` |
| `app/screen/leagueGameScheduleScreen.js` | `apps/mobile/src/features/schedules/screens/LeagueGameScheduleScreen.js` |
| `app/screen/leagueGameScheduleScreen.styles.js` | `apps/mobile/src/features/schedules/screens/LeagueGameScheduleScreen.styles.js` |
| `app/screen/managerScheduleScreen.js` | `apps/mobile/src/features/schedules/screens/ManagerScheduleScreen.js` |
| `app/screen/managerScheduleScreen.styles.js` | `apps/mobile/src/features/schedules/screens/ManagerScheduleScreen.styles.js` |
| `app/screen/lineupScreen.js` | `apps/mobile/src/features/lineups/screens/LineupScreen.js` |
| `app/screen/lineupScreen.styles.js` | `apps/mobile/src/features/lineups/screens/LineupScreen.styles.js` |
| `app/screen/BestMemberScreen.js` | `apps/mobile/src/features/lineups/screens/BestMemberScreen.js` |
| `app/screen/bestMemberScreen.styles.js` | `apps/mobile/src/features/lineups/screens/BestMemberScreen.styles.js` |
| `app/screen/teamInfoScreen.js` | `apps/mobile/src/features/teams/screens/TeamInfoScreen.js` |
| `app/screen/teamInfoScreen.styles.js` | `apps/mobile/src/features/teams/screens/TeamInfoScreen.styles.js` |
| `app/screen/playerDetailScreen.js` | `apps/mobile/src/features/players/screens/PlayerDetailScreen.js` |
| `app/screen/playerDetailScreen.styles.js` | `apps/mobile/src/features/players/screens/PlayerDetailScreen.styles.js` |

파일명 규칙:

- 화면 컴포넌트는 PascalCase로 통일한다.
- `loginScreen.js`가 아니라 `LoginScreen.js`
- `myGameScreen.js`가 아니라 `MyGameScreen.js`
- 스타일 파일도 화면명과 대소문자를 맞춘다.

### 5.5 DB 파일 이동

| 현재 위치 | 목표 위치 | 비고 |
| --- | --- | --- |
| `app/supabaseDataReference/review_table.sql` | `database/supabase/migrations/0001_create_review_table.sql` | migration 이름으로 변경 |

### 5.6 백엔드 이동

| 현재 위치 | 목표 위치 | 비고 |
| --- | --- | --- |
| `backend/requirements.txt` | `apps/api/requirements.txt` | Python 의존성 |
| `backend/main.py` | `apps/api/main.py` 및 `apps/api/app/*` | 1차는 얇은 entrypoint 유지, 2차에 라우트 분리 |
| `backend/review_logic.py` | `apps/api/app/services/review_service.py` 또는 `app/domain/review_metrics.py` | 역할 분리 필요 |
| `backend/review/prompts.py` | `apps/api/app/domain/review_prompts.py` | 리뷰 텍스트 생성 |
| `backend/review/rules.py` | `apps/api/app/domain/review_metrics.py` | 지표 계산 |
| `backend/review/service.py` | `apps/api/app/services/review_service.py` | 기존 `review_logic.py`와 통합 |
| `backend/.env` | 이동하지 않음 | Git 추적 금지. 대신 `apps/api/.env.example` 생성 |

## 6. 단계별 실행 계획

각 단계는 별도 커밋이 가능해야 한다. 기능 변경 없이 이동만 하는 단계와 실제 로직 분리 단계를 섞지 않는다.

### Phase 0. 리팩토링 전 기준점 확보

목표:

- 현재 상태를 확인하고, 이동 전 동작 기준을 잡는다.

작업:

1. 현재 브랜치와 변경 상태 확인
   ```bash
   git status --short --branch
   ```
2. 현재 앱 실행 명령 확인
   ```bash
   cd app
   npm install
   npm run start
   ```
3. 현재 백엔드 import/문법 확인
   ```bash
   cd backend
   python -m compileall .
   ```
4. 백엔드 실행 가능 여부 확인
   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

완료 기준:

- 현재 깨져 있는 부분과 정상 동작하는 부분이 구분되어 있어야 한다.
- `.env` 값은 문서나 커밋에 포함하지 않는다.
- 기존 변경 사항이 있다면 리팩토링 범위와 분리해서 기록한다.

주의:

- 현재 작업트리에 이미 삭제/수정 상태가 있는 파일들이 있으므로, 리팩토링 시작 전에 사용자가 유지할 변경인지 확인하는 것이 좋다.

### Phase 1. 안전 정리 및 ignore 정비

목표:

- 구조 이동 전에 추적되면 안 되는 파일을 정리한다.

작업:

1. 루트 `.gitignore` 보강
   ```text
   .DS_Store
   __pycache__/
   *.pyc
   .env
   .env.*
   !.env.example
   node_modules/
   dist/
   build/
   coverage/
   ```
2. `.env.example` 생성
   ```text
   EXPO_PUBLIC_API_BASE_URL=
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_URL=
   SUPABASE_KEY=
   GOOGLE_API_KEY=
   ```
3. `.DS_Store`, `__pycache__`, `.pyc`는 Git 추적 대상에서 제거한다.

완료 기준:

- Git status에서 `.DS_Store`, pycache, pyc가 새로 추적되지 않는다.
- 실제 `.env` 값은 커밋되지 않는다.

주의:

- 사용자가 만든 변경을 되돌리지 않는다.
- pycache 삭제는 기능 변경이 아니므로 별도 커밋으로 분리하는 것이 좋다.

### Phase 2. 문서와 DB 파일 먼저 이동

목표:

- 실행 코드보다 위험이 낮은 문서/DB 참고 파일을 먼저 정리한다.

작업:

1. 문서 폴더 생성
   ```bash
   mkdir -p docs/planning docs/reports docs/deployment docs/refactor
   ```
2. 기존 문서를 `git mv`로 이동한다.
3. DB 폴더 생성
   ```bash
   mkdir -p database/supabase/migrations
   ```
4. `review_table.sql`을 migration 폴더로 이동한다.
5. `README.md`에서 문서 경로를 새 위치로 갱신한다.

완료 기준:

- 모든 Markdown 문서의 새 위치가 명확하다.
- `README.md`가 이동된 문서 경로를 가리킨다.
- 앱/백엔드 코드 import에는 영향이 없어야 한다.

### Phase 3. 모바일 앱 실행 루트 이동

목표:

- `app/`를 `apps/mobile/`로 이동하되, 내부 구조는 크게 바꾸지 않고 먼저 실행 가능성을 보존한다.

작업:

1. 폴더 생성
   ```bash
   mkdir -p apps
   git mv app apps/mobile
   ```
2. 루트 README 실행 명령 수정
   ```bash
   cd apps/mobile
   npm install
   npm run start
   ```
3. Expo 설정의 asset 상대 경로가 유지되는지 확인한다.
4. Metro/Babel 설정이 새 위치에서 정상 동작하는지 확인한다.

완료 기준:

- `cd apps/mobile && npm run start`가 실행된다.
- import 변경 없이 기존 화면이 로드된다.
- 이 단계에서는 파일명 대소문자 변경과 feature 분리를 하지 않는다.

주의:

- 이동과 내부 리팩토링을 같은 단계에 섞지 않는다.
- 이 단계의 핵심은 `app` -> `apps/mobile` 이동 자체다.

### Phase 4. 모바일 `src/` 구조 도입

목표:

- 모바일 앱 소스를 `src/` 아래로 정리한다.

작업 순서:

1. `apps/mobile/src/` 생성
2. `App.js`를 `src/app/AppRoot.js`로 이동
3. `index.js` import 수정
   ```js
   import AppRoot from "./src/app/AppRoot";
   ```
4. `components`, `navigation`, `constants`, `lib`, `utils`, `screen`을 단계적으로 이동
5. import 경로 수정
6. 화면 파일명을 PascalCase로 정리
7. `BestMemberScreen` import 대소문자 문제 해결

권장 중간 구조:

```text
apps/mobile/src/
├─ app/
├─ components/
├─ constants/
├─ features/
├─ navigation/
├─ services/
└─ utils/
```

완료 기준:

- `apps/mobile/index.js`가 `src/app/AppRoot.js`를 정상 등록한다.
- 모든 import가 새 경로를 참조한다.
- 대소문자 불일치 import가 없다.
- Expo dev server가 import error 없이 실행된다.

검증 명령:

```bash
cd apps/mobile
npm run start -- --clear
```

주의:

- 이 단계에서는 화면 내부 로직은 최대한 그대로 둔다.
- 중복 로직 제거는 Phase 5 이후로 미룬다.

### Phase 5. 모바일 공통 설정과 서비스 분리

목표:

- 하드코딩된 환경 값과 API 호출 경계를 정리한다.

작업:

1. `src/config/env.js` 생성
   - `EXPO_PUBLIC_API_BASE_URL`
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. `src/services/apiClient.js` 생성
   - 공통 base URL
   - JSON request helper
   - error handling helper
3. `src/services/supabaseClient.js` 생성
   - 기존 `lib/supabase.js` 대체
4. `scheduleConstants.js` 분리
   - `constants/apiEndpoints.js`
   - `constants/attendance.js`
   - `constants/lineup.js`
5. 화면에서 직접 `fetch`를 호출하는 부분을 feature service로 점진 이동

완료 기준:

- 앱 코드에 로컬 IP 하드코딩이 남아 있지 않다.
- Supabase URL/anon key가 코드에 직접 남아 있지 않다.
- `.env.example`만 커밋되고 실제 `.env`는 제외된다.

주의:

- `EXPO_PUBLIC_` 값은 앱 번들에 포함되는 공개값이다.
- Google API key나 Supabase service role key는 절대 모바일 앱에 넣지 않는다.

### Phase 6. 모바일 도메인 로직 분리

목표:

- 화면 파일에서 비즈니스 규칙과 데이터 정규화 로직을 분리한다.

우선순위:

1. 라인업 규칙 분리
   - 대상: `LineupScreen.js`, `BestMemberScreen.js`
   - 결과: `features/lineups/utils/lineupRules.js`
2. 날짜/캘린더 로직 분리
   - 대상: `PlayerScheduleScreen.js`, `LeagueGameScheduleScreen.js`, `DirectorScheduleScreen.js`, `ManagerScheduleScreen.js`
   - 결과: `features/schedules/utils/calendarUtils.js`
3. 일정 row 정규화 분리
   - 결과: `features/schedules/utils/scheduleMappers.js`
4. 선수 기록 계산 분리
   - 대상: `PlayerDetailScreen.js`
   - 결과: `features/players/utils/playerStats.js`
5. AI 카드 저장/생성 호출 분리
   - 대상: `PlayerDetailScreen.js`
   - 결과: `features/aiCards/services/aiCardApi.js`, `features/aiCards/utils/cardImageStorage.js`

완료 기준:

- 큰 화면 파일의 줄 수와 책임이 줄어든다.
- 순수 함수는 화면 없이도 테스트 가능하다.
- 라인업 규칙이 한 곳에서만 관리된다.

주의:

- 이 단계는 기능 변경 위험이 있으므로 작은 단위로 진행한다.
- 각 순수 함수 분리 후 기존 화면과 같은 결과를 내는지 샘플 데이터로 확인한다.

### Phase 7. 백엔드 실행 루트 이동

목표:

- `backend/`를 `apps/api/`로 이동하되, 먼저 기존 API 동작을 보존한다.

작업:

1. 이동
   ```bash
   mkdir -p apps
   git mv backend apps/api
   ```
2. 실행 명령 갱신
   ```bash
   cd apps/api
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
3. README 경로 갱신
4. `apps/api/.env.example` 생성

완료 기준:

- `cd apps/api && python -m compileall .` 통과
- `cd apps/api && uvicorn main:app --reload` 실행 가능
- 기존 endpoint path가 바뀌지 않는다.

주의:

- 이 단계에서는 `main.py` 분리까지 하지 않는다.
- 이동 후 import가 깨지면 최소 수정만 한다.

### Phase 8. 백엔드 패키지 구조 도입

목표:

- `main.py`의 책임을 기능별 파일로 나눈다.

작업 순서:

1. `apps/api/app/` 패키지 생성
2. `apps/api/main.py`를 얇은 entrypoint로 변경
   ```python
   from app.main import app
   ```
3. `app/main.py`에서 FastAPI 앱 조립
4. `core/config.py` 생성
   - 환경 변수 로드
   - 설정 객체 관리
5. `core/clients.py` 생성
   - Supabase client
   - Google GenAI client
6. `api/routes/*.py`로 라우트 이동
7. `schemas/*.py`로 Pydantic 모델 이동
8. `services/*.py`로 비즈니스 로직 이동
9. `repositories/*.py`로 Supabase table 접근 이동

라우트 분리 순서:

1. `schedules.py`
2. `members.py`
3. `teams.py`
4. `games.py`
5. `reviews.py`
6. `ai_cards.py`
7. `uploads.py`

완료 기준:

- 기존 endpoint URL이 유지된다.
- `python -m compileall app main.py` 통과
- FastAPI docs에서 endpoint가 정상 노출된다.
- import 중복이 줄어든다.
- `@app.post("/api/member")` 중복 정의가 제거된다.

검증 명령:

```bash
cd apps/api
python -m compileall .
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

기본 API 확인:

```bash
curl http://localhost:8000/
curl http://localhost:8000/api/schedule
curl http://localhost:8000/api/member
curl http://localhost:8000/api/team
```

### Phase 9. 리뷰 로직 단일화

목표:

- `review_logic.py`와 `review/` 모듈의 중복을 제거한다.

현재 상태:

- `backend/review_logic.py`가 실제 API에서 사용된다.
- `backend/review/prompts.py`, `rules.py`, `service.py`는 더 모듈화되어 있지만 현재 main API 흐름에서는 직접 사용되지 않는 것으로 보인다.

권장 방향:

```text
apps/api/app/domain/review_metrics.py
apps/api/app/domain/review_prompts.py
apps/api/app/services/review_service.py
apps/api/app/repositories/review_repository.py
```

작업:

1. `rules.py`의 순수 지표 계산 함수를 `domain/review_metrics.py`로 이동
2. `prompts.py`의 리뷰 텍스트 생성을 `domain/review_prompts.py`로 이동
3. `review_logic.py`의 team/date/all review 생성 기능을 `services/review_service.py`로 통합
4. Supabase 접근은 repository로 분리
5. `_needs_refresh()`가 항상 `True`인 현재 정책을 명시적으로 결정
   - 매번 재생성할 것인지
   - 기존 리뷰를 재사용할 것인지
   - 강제 재생성 옵션을 둘 것인지

완료 기준:

- 리뷰 API가 기존과 같은 response shape를 유지한다.
- 리뷰 계산 순수 함수 테스트가 가능하다.
- 중복 리뷰 서비스 파일이 사라진다.

### Phase 10. 카드 이미지/AI 기능 분리

목표:

- AI 프롬프트 생성, 이미지 생성, 카드 합성 책임을 분리한다.

권장 구조:

```text
apps/api/app/services/ai_card_service.py
apps/api/app/api/routes/ai_cards.py
apps/api/app/assets/fonts/
```

작업:

1. `/api/gemini` 로직을 service로 이동
2. `/api/banana` 로직을 service로 이동
3. `/api/make_card` 로직을 service로 이동
4. Windows 전용 폰트 경로 제거
5. 서버에서 사용할 폰트 파일 또는 OS fallback 탐색 함수 추가
6. 카드 생성 실패 메시지 정리

완료 기준:

- Google API key가 없을 때 명확한 500/설정 오류를 반환한다.
- Linux/macOS/Windows에서 폰트 fallback이 동작한다.
- route 파일은 request/response만 담당한다.

### Phase 11. 테스트와 검증 도입

목표:

- 리팩토링 후 핵심 규칙이 깨지지 않도록 최소 테스트를 추가한다.

백엔드 우선 테스트:

- `test_review_metrics.py`
  - 타자 안타/볼넷/삼진 계산
  - 투수 ERA/WHIP/K9 계산
- `test_lineup_rules.py`
  - 포지션 중복 방지
  - DH 사용 시 투수 타순 제외
- `test_schedules_api.py`
  - 일정 등록 payload 검증
  - attendance payload 검증

프론트 우선 테스트는 선택사항:

- 현재 프로젝트에 테스트 도구가 없으므로, 구조 정리 직후 바로 큰 테스트 환경을 도입하지 않는다.
- 우선 순수 함수로 분리한 `lineupRules`, `dateUtils`, `playerStats`에 테스트를 붙이는 방식이 좋다.

완료 기준:

- 백엔드 순수 함수 테스트가 실행된다.
- 최소한 `python -m compileall .`은 항상 통과한다.

## 7. 네이밍 규칙

### 7.1 폴더명

- 소문자 복수형 사용
  - `screens`
  - `components`
  - `services`
  - `utils`
  - `constants`
- 도메인 폴더는 의미 중심
  - `schedules`
  - `lineups`
  - `players`
  - `teams`
  - `reviews`
  - `aiCards`

### 7.2 React Native 파일명

- 화면 컴포넌트: PascalCase
  - `LoginScreen.js`
  - `PlayerScheduleScreen.js`
  - `BestMemberScreen.js`
- 스타일 파일: 화면명과 동일한 PascalCase
  - `LoginScreen.styles.js`
  - `BestMemberScreen.styles.js`
- 공통 컴포넌트: PascalCase
  - `CommonHeader.js`
  - `CommonFooter.js`
- 유틸/서비스: camelCase
  - `scheduleApi.js`
  - `lineupRules.js`
  - `playerStats.js`

### 7.3 Python 파일명

- snake_case 사용
  - `schedule_service.py`
  - `member_repository.py`
  - `review_metrics.py`
- 라우트 파일은 리소스 복수형
  - `schedules.py`
  - `members.py`
  - `teams.py`
  - `reviews.py`

## 8. 데이터 접근 정책 제안

리팩토링 후에는 다음 중 하나를 선택해야 한다.

### 옵션 A. FastAPI 중심

앱은 대부분 FastAPI만 호출하고, Supabase 직접 접근을 최소화한다.

장점:

- 권한 검증을 서버에서 강제하기 쉽다.
- 비즈니스 로직이 서버에 모인다.
- 운영 로그/감사 추적이 쉬워진다.

단점:

- 백엔드 endpoint가 더 많이 필요하다.
- 초기 구현량이 증가한다.

### 옵션 B. Supabase 직접 접근 유지

앱이 Supabase를 직접 읽고, 서버는 AI/카드/복잡한 쓰기 작업만 담당한다.

장점:

- 구현 속도가 빠르다.
- 단순 조회 화면이 간단하다.

단점:

- 클라이언트 권한 설계가 중요하다.
- RLS 정책을 엄격히 설계해야 한다.
- 앱 코드에 DB 구조 의존이 강해진다.

### 권장

리팩토링 목표가 “깔끔한 운영 구조”라면 옵션 A가 더 적합하다. 다만 한 번에 모두 바꾸지 말고, 먼저 쓰기 작업과 권한이 필요한 작업부터 FastAPI로 통일한다.

우선 FastAPI로 통일할 기능:

- 로그인/사용자 조회
- 일정 등록/수정/삭제
- 참석 상태 변경
- 라인업 저장
- 팀 best_member 저장
- 리뷰 생성
- AI 카드 생성

당장 Supabase 직접 접근을 유지해도 되는 후보:

- 공개 팀 목록 조회
- 단순 멤버 목록 조회

단, 이 경우에도 별도 service 파일로 감싸서 화면이 Supabase client를 직접 알지 않도록 한다.

## 9. 환경 변수 정책

### 9.1 루트 `.env.example`

루트에는 전체 프로젝트에서 필요한 변수 예시를 둔다.

```env
# Mobile public values
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# API server private values
SUPABASE_URL=
SUPABASE_KEY=
GOOGLE_API_KEY=
```

### 9.2 모바일 앱

모바일에서 접근 가능한 값만 `EXPO_PUBLIC_` 접두사를 사용한다.

허용:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

금지:

- `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY`

### 9.3 백엔드

백엔드는 private 환경 변수를 사용한다.

필수:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GOOGLE_API_KEY`

## 10. 리팩토링 중 검증 체크리스트

각 단계가 끝날 때 아래를 확인한다.

### 공통

```bash
git status --short --branch
rg "172.30.1.19|fnmhgdqvpnpyrcasnnvv|sb_publishable" .
```

하드코딩 값이 남아 있다면 환경 변수 외부화 대상이다.

### 모바일

```bash
cd apps/mobile
npm install
npm run start -- --clear
```

확인할 화면:

- Login
- MainTab
- MyGame
- PlayerSchedule
- DirectorSchedule
- ManagerSchedule
- Lineup
- TeamInfo
- BestMember
- PlayerDetail

### 백엔드

```bash
cd apps/api
python -m compileall .
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

기본 endpoint:

```bash
curl http://localhost:8000/
curl http://localhost:8000/api/schedule
curl http://localhost:8000/api/member
curl http://localhost:8000/api/team
curl http://localhost:8000/api/game
```

### 문서

- README의 실행 경로가 새 구조와 일치하는지 확인한다.
- 배포 문서에서 `backend/`, `app/` 경로가 남아 있으면 `apps/api`, `apps/mobile`로 갱신한다.
- 발표 문서는 코드 실행에는 영향이 없지만, 링크가 깨졌는지 확인한다.

## 11. 단계별 완료 정의

리팩토링 전체 완료 기준:

- 루트에는 대표 문서와 설정만 남아 있다.
- 모바일 앱은 `apps/mobile`에서 실행된다.
- 백엔드는 `apps/api`에서 실행된다.
- 모바일 소스는 `apps/mobile/src` 아래에 있다.
- 백엔드 소스는 `apps/api/app` 아래에 있다.
- DB SQL은 `database/supabase/migrations` 아래에 있다.
- 발표/기획/배포 문서는 `docs` 아래에 있다.
- 로컬 IP, Supabase URL, Supabase key가 앱 코드에 직접 하드코딩되어 있지 않다.
- `main.py`가 라우트/서비스/도메인 로직을 모두 직접 들고 있지 않다.
- `review_logic.py`와 `review/`의 중복 리뷰 구현이 하나로 정리되어 있다.
- `lineupScreen.js`와 `BestMemberScreen.js`의 중복 라인업 규칙이 공통 유틸로 분리되어 있다.
- `.DS_Store`, `__pycache__`, `.pyc`, 실제 `.env`가 Git 추적 대상이 아니다.

## 12. 나중에 Codex에게 줄 작업 지시 예시

이 문서를 기반으로 실제 작업을 맡길 때는 아래처럼 요청하면 된다.

```text
project_structure.md와 project_restructure_plan.md를 읽고,
Phase 1만 진행해줘. 기능 변경은 하지 말고 ignore 정리와 env example 생성만 해줘.
작업 후 git status와 변경 파일 요약을 알려줘.
```

다음 단계:

```text
project_restructure_plan.md 기준으로 Phase 2만 진행해줘.
문서와 DB SQL 파일만 이동하고 코드 import는 건드리지 마.
README의 문서 경로만 새 위치로 맞춰줘.
```

모바일 이동 단계:

```text
project_restructure_plan.md 기준으로 Phase 3만 진행해줘.
app 폴더를 apps/mobile로 이동하고, 실행 명령과 README 경로만 수정해줘.
내부 src 구조 도입은 아직 하지 마.
```

백엔드 이동 단계:

```text
project_restructure_plan.md 기준으로 Phase 7만 진행해줘.
backend 폴더를 apps/api로 이동하고, 기존 endpoint가 유지되도록 최소 import 수정만 해줘.
라우트 분리는 아직 하지 마.
```

이렇게 단계별로 요청해야 리스크가 작다.

## 13. 당장 결정해야 할 질문

리팩토링 전에 사용자 또는 팀이 결정해야 할 질문이다.

1. 최종 구조를 `apps/mobile`, `apps/api`로 바꿀 것인가, 아니면 기존 `app`, `backend` 이름을 유지할 것인가?
2. 앱의 Supabase 직접 접근을 유지할 것인가, FastAPI 중심으로 통일할 것인가?
3. TypeScript 전환을 이번 리팩토링에 포함할 것인가, 별도 작업으로 미룰 것인가?
4. 테스트 도구를 어느 시점에 도입할 것인가?
5. Vercel 배포 root를 `apps/api`로 잡을 것인가?
6. Expo EAS 기준 root를 `apps/mobile`로 잡을 것인가?

권장 답:

- 폴더 구조는 `apps/mobile`, `apps/api`로 바꾼다.
- TypeScript 전환은 이번 구조 리팩토링과 분리한다.
- 먼저 환경 변수와 import 경로를 안정화한다.
- 백엔드 테스트는 순수 함수부터 도입한다.
- 데이터 접근은 장기적으로 FastAPI 중심으로 통일한다.
