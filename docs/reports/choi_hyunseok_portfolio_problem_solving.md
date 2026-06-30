# 최현석 커밋 기반 포트폴리오용 문제 해결 기여 정리

## 0. 문서 목적

이 문서는 `dev` 브랜치에 포함된 최현석의 전체 커밋을 기준으로, 나중에 포트폴리오/면접/자기소개서에서 활용할 수 있는 문제 해결형 기여 자료를 정리한다.

단순히 "무엇을 만들었다"가 아니라, Git 변경사항 관점에서 다음 질문에 답하는 것을 목표로 한다.

- 어떤 문제를 발견했는가?
- frontend/backend/협업/보안 관점에서 어떤 변경을 했는가?
- 어떤 파일과 커밋이 근거인가?
- 포트폴리오에서는 어떤 문장으로 표현할 수 있는가?

## 1. 분석 기준

분석 기준은 `dev` 브랜치이며, 최현석 작성자 이메일은 `testwelltest01@gmail.com`으로 통합했다.

| 항목 | 값 |
|---|---:|
| 기준 브랜치 | `dev` |
| 기준 HEAD | `51b633a` |
| 최현석 전체 커밋 | 71 |
| 최현석 non-merge 커밋 | 46 |
| 최현석 merge 커밋 | 25 |
| 활동 기간 | 2026-03-18 ~ 2026-06-21 |

Git 변경 범위 요약은 다음과 같다.

| 관점 | 관련 커밋 수 | 고유 파일 수 | 추가/삭제 라인 | 해석 |
|---|---:|---:|---:|---|
| Frontend | 32 | 60 | +9,195 / -8,153 | React Native 화면, 내비게이션, 공통 컴포넌트, 스타일 구조 |
| Backend | 14 | 9 | +397 / -57 | FastAPI, Supabase 연동, CSV 업로드, AI 이미지/API 연결 |
| Security/Config | 7 | 2 | +12 / -12 | `.gitignore`, `.env`, 민감 키 제거 |
| Docs/Process | 5 | 2 | +245 / -2 | PR 템플릿, README, 협업 문서 |
| Dependency | 2 | 2 | +8,315 / -435 | `package-lock.json`, `package.json` 기반 의존성 반영 |
| Other/Test | 8 | 23 | +13 / -22 | 초기 테스트 파일, 브랜치/병합 실험 |

주의할 점:

- 위 라인 수는 Git `numstat` 기준이므로 lockfile, 생성물, `__pycache__` 흔적이 포함될 수 있다.
- merge 커밋은 대부분 diff 통계가 0으로 보인다. 대신 브랜치 통합, 충돌 해결, 기능 반영의 근거로 해석했다.
- 아래 포트폴리오 문장은 Git 기록에서 확인 가능한 범위만 바탕으로 작성했다.

## 2. 한 문장 요약

최현석은 BTS 프로젝트에서 **FastAPI-Supabase 백엔드 연동, Supabase 기반 로그인/권한 분기, React Native 내비게이션 구조 통합, 선수 상세/AI 카드 기능, 공통 UI 컴포넌트화, 팀원 브랜치 통합, 민감정보 제거와 README 문서화**를 담당한 통합형 풀스택 기여자다.

포트폴리오용 핵심 문장:

> 사회인 야구팀 운영 앱에서 React Native 화면 구조와 FastAPI-Supabase API를 연결하고, 로그인/권한 분기, 선수 상세 통계, AI 기반 PR 카드, 공통 내비게이션을 구현했다. 개발 후반에는 팀원 기능 브랜치를 `dev`에 통합하고, revert/cleanup/security/docs 작업을 수행해 제출 가능한 저장소 상태로 정리했다.

## 3. 관점별 상세 기여

### 3.1 Frontend 관점

#### 문제 1. 화면 전환이 커질수록 상태 기반 분기가 복잡해짐

초기 화면 흐름은 `App.js`와 개별 화면 상태에 의존하는 부분이 컸고, 선수/감독/기록원 역할이 늘어나면서 화면 전환과 하단 탭 연결이 복잡해질 가능성이 컸다.

해결 접근:

- `useState` 기반 화면 전환을 React Navigation 중심 구조로 바꿨다.
- `MainTabNavigator`를 중심으로 역할별 탭과 stack을 구성했다.
- 선수, 감독, 기록원 role에 따라 보이는 탭을 다르게 분기했다.
- 공통 footer/header를 만들어 선수용/감독용 footer 중복을 줄였다.

Git 근거:

| 커밋 | 변경 파일 | 기여 해석 |
|---|---|---|
| `488eea4` | `app/App.js`, `app/screen/*`, `app/utils/scheduleUtils.js` | 화면 전환을 navigation 방식으로 전환하고 styles/utils/constants 분리 |
| `86ddfbf` | `app/components/PlayerFooter.js`, `app/App.js`, 여러 screen | footer navigation 생성 |
| `6b41ce2` | `app/components/DirectorFooter.js`, `app/screen/DirectorScheduleScreen.js` | 감독 footer navigation 연동 |
| `9a3e9b8` | `app/components/CommonFooter.js`, `app/components/CommonHeader.js` | 감독/선수 footer를 공통 footer로 통합 |
| `903f517` | `app/navigation/MainTabNavigator.js`, `app/App.js`, `app/components/CommonFooter.js` | stack 구조를 MainTabNavigator 중심으로 통합 |

포트폴리오 문장:

> 역할별로 분기되는 모바일 앱 화면 구조가 복잡해지는 문제를 해결하기 위해 React Navigation 기반의 `MainTabNavigator`를 도입하고, 선수/감독/기록원 탭 구성을 역할별로 분기했다. 또한 중복된 footer 컴포넌트를 `CommonFooter`로 통합해 화면 추가와 유지보수가 쉬운 구조로 개선했다.

#### 문제 2. 로그인 이후 사용자 역할에 맞는 화면 진입이 필요함

BTS 앱은 선수, 감독, 기록원 역할에 따라 접근해야 하는 화면이 다르다. 단순 로그인만으로는 사용자가 어떤 기능을 사용할 수 있는지 구분할 수 없었다.

해결 접근:

- Supabase `member` 테이블 조회를 통해 사용자의 ID/비밀번호를 검증했다.
- `Primary_Position` 값을 기준으로 역할별 화면 진입을 분기했다.
- 테스트 편의성을 위해 테스트 로그인 버튼을 추가했다.
- 로그아웃 기능이 특정 페이지에서 동작하지 않는 문제를 고쳤다.

Git 근거:

| 커밋 | 변경 파일 | 기여 해석 |
|---|---|---|
| `9dc6131` | `app/screen/loginScreen.js`, `app/App.js`, `package-lock.json` | Supabase 로그인과 초기 권한 분기 구현 |
| `7d3ba22` | `app/lib/supabase.js`, `app/screen/loginScreen.js`, `app/screen/DirectorScreen.js`, `app/screen/PlayerScreen.js` | Supabase client 설정과 역할별 화면 기반 확장 |
| `f4b4768` | `app/screen/loginScreen.js`, `app/screen/loginScreen.styles.js` | 테스트 로그인 버튼 추가 |
| `2a722b6` | `app/components/CommonHeader.js`, `app/constants/commonConstants.js` | 로그아웃 기능 수정 |
| `4cc1e2d` | `app/components/CommonHeader.js` | 기록원 페이지에서도 로그아웃 가능하도록 수정 |

포트폴리오 문장:

> Supabase `member` 테이블 기반 로그인 흐름을 구현하고, 사용자 포지션에 따라 선수/감독/기록원 화면으로 진입하도록 권한 분기 로직을 구성했다. 이후 테스트 로그인 버튼과 공통 header 로그아웃 처리를 추가해 개발/검증 효율과 사용자 흐름의 안정성을 높였다.

#### 문제 3. 선수 상세 화면에서 기록, 리뷰, AI 이미지가 한 화면에 통합되어야 함

선수 상세 화면은 단순 프로필이 아니라 타자/투수 기록, 최근 경기, AI 리뷰, PR 이미지 생성까지 포함해야 했다. 데이터 계산과 UI 표현, 백엔드 API 호출이 한 화면에 모이므로 상태 관리와 오류 처리의 난도가 높았다.

해결 접근:

- `playerDetailScreen`에서 Supabase `member`, `team`, `game` 데이터를 조회했다.
- 타자/투수 데이터를 분리해 타율, 출루율, 장타율, ERA, WHIP, K/9 등 지표를 계산했다.
- AI review와 AI 이미지 생성 API를 연동했다.
- PR 이미지 미리보기와 저장 흐름을 추가했다.
- UI 수정이 충돌하거나 품질 기준에 맞지 않을 때 revert를 수행했다.

Git 근거:

| 커밋 | 변경 파일 | 기여 해석 |
|---|---|---|
| `a0c3e07` | `app/screen/playerDetailScreen.js`, `app/screen/playerDetailScreen.styles.js` | 선수 프로필/상세 화면 대규모 구현 |
| `bca5bf6` | `app/screen/playerDetailScreen.js`, `app/screen/loginScreen.js` | 타자/투수 UI 수정과 테스트 로그인 추가 |
| `35e7c67` | `app/screen/playerDetailScreen.js` 등 | playerDetail UI 변경 revert로 안정성 회복 |
| `9b33d11` | `app/screen/playerDetailScreen.js`, `backend/main.py` | 선수 상세와 backend/API 연결 대규모 보강 |
| `2daceb6` | `app/screen/playerDetailScreen.js`, `backend/main.py` | AI 사진 생성 관련 기능 개선 |

포트폴리오 문장:

> 선수 상세 화면에서 Supabase 경기 데이터를 기반으로 타자/투수 지표를 계산하고, AI 리뷰와 PR 카드 이미지 생성 API를 연결했다. 단순 조회 화면을 넘어 "기록 분석 -> 리뷰 확인 -> 이미지 생성 -> 카드 미리보기/저장"으로 이어지는 사용자 흐름을 구현했다.

#### 문제 4. Android 화면 겹침, calendar UX, 화면 중복 정리가 필요함

기능이 늘어나면서 화면 겹침, 중복 화면, 오래된 상세 화면이 남아 유지보수 부담을 만들었다.

해결 접근:

- Android 버튼과 화면 겹침 문제를 수정했다.
- 캘린더에 오늘 버튼을 추가했다.
- 중복된 `gameDetailScreen1.js`와 이전 화면을 제거했다.
- screen별 styles 파일을 분리하고 화면 구조를 정리했다.

Git 근거:

| 커밋 | 변경 파일 | 기여 해석 |
|---|---|---|
| `52b5626` | `app/components/*Footer*`, `app/screen/*` | Android UI 겹침 수정, calendar today 버튼 추가 |
| `129b668` | `app/screen/gameDetailScreen1.js` | 중복 상세 화면 삭제 |
| `099be16` | `app/screen/gameDetailScreen.js`, `app/screen/playerDetailScreen.js` | 화면 정리와 중복 화면 제거 |
| `488eea4` | 여러 screen/styles/utils | styles와 schedule 유틸 분리 |

포트폴리오 문장:

> 화면 수가 늘어나며 발생한 UI 겹침과 중복 파일 문제를 정리했다. Android 환경의 버튼 겹침 문제와 캘린더 사용성을 개선하고, 중복 상세 화면을 제거해 유지보수 가능한 화면 구조로 다듬었다.

### 3.2 Backend 관점

#### 문제 1. 앱에서 Supabase 데이터를 안정적으로 가져올 API 계층이 필요함

초기 앱은 화면과 데이터가 연결되기 전이라 Supabase 연동 확인과 API 계층 구축이 필요했다.

해결 접근:

- FastAPI에서 Supabase client를 사용해 데이터를 조회하는 기초 API를 만들었다.
- `.env` 기반 설정을 추가했다.
- `requirements.txt`에 backend 의존성을 반영했다.
- 이후 `/api/member`, `/api/team`, `/api/game`, schedule 관련 API 흐름으로 확장되는 기반을 마련했다.

Git 근거:

| 커밋 | 변경 파일 | 기여 해석 |
|---|---|---|
| `924f1c1` | `backend/main.py`, `backend/requirements.txt`, `backend/.env` | FastAPI에서 Supabase data get 확인 |
| `03f32cc` | `backend/.env => .env`, `app/*` | backend와 app 기초 구조 정리 |
| `49e5e71` | `backend/main.py`, `app/navigation/MainTabNavigator.js`, screen files | FastAPI-Supabase 통합과 frontend 화면 연결 재구성 |
| `9b33d11` | `backend/main.py`, `backend/requirements.txt`, `app/screen/*` | React Native 앱 구조와 FastAPI backend 연동 보강 |

포트폴리오 문장:

> FastAPI와 Supabase를 연결하는 API 계층을 구축해 React Native 앱이 팀, 선수, 경기 데이터를 조회할 수 있는 기반을 만들었다. 이후 화면 기능이 늘어나도 같은 API 기반에서 데이터를 연결할 수 있도록 backend 구조를 확장했다.

#### 문제 2. 기록원이 CSV 경기 기록을 업로드하고 DB에 반영해야 함

야구 기록은 수기로 입력하기보다 CSV로 정리된 데이터를 업로드하는 흐름이 필요했다. 단순 파일 업로드를 넘어 Supabase DB에 반영되는 backend 처리까지 필요했다.

해결 접근:

- FastAPI upload endpoint와 CSV 처리 흐름을 추가했다.
- `pandas`, `supabase`, `UploadFile` 기반으로 파일 데이터를 읽고 DB에 반영하는 구조를 만들었다.
- frontend 기록자 화면에서 업로드 흐름을 연결했다.

Git 근거:

| 커밋 | 변경 파일 | 기여 해석 |
|---|---|---|
| `3ad18d9` | `backend/main.py`, `app/screen/recorderScreen.js`, `package-lock.json` | CSV 업로드와 Supabase DB 반영 |
| `8966556` | `app/screen/recorderScreen.js` | recorderScreen syntax error와 button 복구 |
| `e678d26` | `app/screen/recorderScreen.js`, `backend/requirements.txt` 등 | 병합 후 테스트 파일/기록자 화면 정리 |

포트폴리오 문장:

> 기록원이 CSV 경기 기록을 업로드하면 FastAPI가 파일을 파싱하고 Supabase DB에 반영하는 흐름을 구현했다. 업로드 화면과 backend endpoint를 함께 수정해 "파일 입력 -> 서버 처리 -> DB 저장"으로 이어지는 데이터 파이프라인을 만들었다.

#### 문제 3. AI 이미지 생성 기능은 외부 API, prompt, DB 저장이 모두 연결되어야 함

AI PR 카드 기능은 단순 API 호출이 아니라 선수 정보, AI prompt 생성, 이미지 생성 API, DB 저장, 모바일 미리보기/저장 흐름을 연결해야 했다.

해결 접근:

- `/api/gemini`, `/api/banana`, `/api/make_card` 성격의 AI/이미지 endpoint를 backend에 추가/개선했다.
- frontend에서 선수명, avatar URL, review issue를 조합해 prompt를 만들었다.
- 생성된 이미지를 member 데이터에 저장하거나 화면에 표시하도록 연결했다.
- 오류 상황에서 alert와 fallback 메시지를 처리했다.

Git 근거:

| 커밋 | 변경 파일 | 기여 해석 |
|---|---|---|
| `2daceb6` | `backend/main.py`, `app/screen/playerDetailScreen.js` | AI 사진 생성 관련 기능 개선 |
| `9b33d11` | `backend/main.py`, `playerDetailScreen.js` | AI/API 연결을 포함한 선수 상세 기능 보강 |
| `a0c3e07` | `playerDetailScreen.js`, styles | 선수 상세 UI 기반 구축 |

포트폴리오 문장:

> 선수 데이터를 기반으로 AI prompt를 생성하고, backend 이미지 생성 API를 호출해 PR 카드 이미지를 만들어 저장/미리보기까지 이어지는 기능을 구현했다. 외부 AI API 호출, backend 중계, DB 업데이트, 모바일 UI 상태 처리를 하나의 사용자 흐름으로 연결했다.

### 3.3 협업/통합 관점

#### 문제 1. 여러 명의 feature branch가 동시에 개발되어 통합 비용이 커짐

프로젝트 후반에는 `DaesanChoi`, `cheol`, `DS_*`, `song_*`, `choihyunseok-*` 같은 브랜치가 동시에 병합되었다. 기능이 겹치는 화면도 많아 충돌, revert, 대소문자 파일명 정리, navigation 연결 문제가 발생할 가능성이 높았다.

해결 접근:

- 팀원 PR/branch를 `dev`에 지속적으로 병합했다.
- 병합 이후 깨진 화면과 syntax error를 수정했다.
- 문제가 있는 UI 변경은 revert한 뒤 필요한 부분만 재적용했다.
- 공통 navigation/footer 구조로 팀원 기능을 연결했다.

Git 근거:

| 커밋 | 병합 대상/의미 |
|---|---|
| `ea59876` | `DaesanChoi` PR 병합 |
| `f57ae15` | `frontend-test01` PR 병합 |
| `e0c3ed0` | `Choihyunseok` PR 병합 |
| `04254ef` | `DaesanChoi` PR 병합 |
| `b0a014a` | CSV 업로드 관련 PR 병합 |
| `dc82053` | `main` 변경분을 feature branch에 병합 |
| `0ba82f4` | 로그인/권한 브랜치 병합 |
| `3530575` | 송형철 `cheol` 브랜치 병합 |
| `d76a305` | `origin/US-04` 병합 |
| `f7eb88a` | 선수 상세 브랜치 병합 |
| `13e1e04` | 최대산 리그 일정 브랜치 병합 |
| `5f6c42d` | 송형철 라인업 브랜치 병합 |
| `177a436` | 송형철 3/27 작업 병합 |
| `3535d3a` | myGame/playerSchedule 병합 PR |
| `ac1cd7c` | UI/UX 수정 브랜치 병합 |
| `7d3da76` | Supabase data update 리팩터링 병합 |
| `decfc35` | AI model 1차 브랜치 병합 |
| `7056164` | Supabase 리팩터링 병합 |
| `9910aa0` | 송형철 directorSchedule UI PR 병합 |
| `5fd20e5` | 송형철 UI 브랜치를 `dev`에 병합 |
| `721fa31` | `dev` 병합 |
| `2a57afa` | 최대산 AI review PR 병합 |

포트폴리오 문장:

> 여러 명이 동시에 개발한 feature branch를 `dev`에 통합하면서 충돌과 화면 연결 문제를 해결했다. 단순 merge에 그치지 않고 syntax error 수정, revert, 공통 navigation 연결, 중복 화면 정리를 수행해 팀 기능이 하나의 앱 흐름으로 동작하도록 조정했다.

#### 문제 2. 잘못 들어간 UI 변경은 빠르게 되돌리고 안정 상태를 회복해야 함

프로젝트 후반에는 UI 변경이 잦았고, 일부 변경은 전체 화면 구조와 맞지 않아 되돌려야 했다.

해결 접근:

- `playerDetailScreen` UI 변경 PR을 revert했다.
- `directorScheduleScreen` UI 개선 작업도 revert했다.
- revert 후에도 필요한 공통 구조는 유지하도록 navigation/footer와 screen 파일을 정리했다.

Git 근거:

| 커밋 | 변경 파일 | 기여 해석 |
|---|---|---|
| `35e7c67` | `playerDetailScreen.js`, `loginScreen.js`, `CommonHeader.js` | playerDetail UI 변경 revert |
| `27419f0` | `CommonFooter.js`, `MainTabNavigator.js`, `LineupScreen.js`, `leagueGameScheduleScreen.js` 등 | directorSchedule UI 변경 revert |

포트폴리오 문장:

> 기능 마감 단계에서 품질이나 구조와 맞지 않는 UI 변경은 revert로 되돌리고, 필요한 기능만 다시 안정적으로 연결했다. 이를 통해 단기적으로는 앱을 정상 상태로 복구하고, 장기적으로는 공통 navigation 구조를 유지했다.

### 3.4 Security/Config/Docs 관점

#### 문제 1. API key와 환경 설정이 저장소에 남으면 공개/제출 리스크가 생김

프로젝트가 제출/공개 단계로 넘어가면 `.env`에 남은 민감정보가 가장 큰 위험이 된다.

해결 접근:

- `.gitignore`를 여러 차례 조정했다.
- 루트 `.env`와 `backend/.env`에서 민감 키를 제거했다.
- README를 작성해 프로젝트 구조, 실행 방법, 기술 스택을 문서화했다.

Git 근거:

| 커밋 | 변경 파일 | 기여 해석 |
|---|---|---|
| `929cfa8` | backend `__pycache__` 추적 제거 성격 | 생성물/gitignore 정리 |
| `16a2439` | `.gitignore` | gitignore 후속 정리 |
| `34440f0` | `.gitignore` | gitignore 추가 정리 |
| `bc72656` | `.env` | 루트 환경 파일 민감 키 제거 |
| `af9737f` | `backend/.env` | backend 환경 파일 민감 키 제거 |
| `51b633a` | `README.md` | 프로젝트 설명/설정 문서화 |

포트폴리오 문장:

> 제출 전 저장소 보안 점검을 수행해 `.env`와 backend 환경 파일의 민감 키를 제거하고 `.gitignore`를 정리했다. 이후 README에 프로젝트 구조, 기술 스택, 실행 방법을 문서화해 재현 가능성과 공개 안정성을 높였다.

## 4. 포트폴리오용 문제 해결 사례

### 사례 1. 역할 기반 모바일 내비게이션 재구성

문제:

- 선수, 감독, 기록원마다 접근해야 하는 화면이 달랐다.
- 화면이 늘어나면서 `App.js` 중심 분기만으로는 복잡도가 커졌다.
- footer가 역할별로 분리되어 중복 코드가 생겼다.

행동:

- `MainTabNavigator`를 도입해 tab/stack 구조를 명확히 분리했다.
- Supabase에서 `Primary_Position`을 조회해 역할별 탭 구성을 다르게 했다.
- `DirectorFooter`, `PlayerFooter`를 `CommonFooter`로 통합했다.

결과:

- 기능 화면이 늘어나도 탭/스택 구조 안에서 연결할 수 있게 되었다.
- footer 중복을 줄이고, 팀원 기능을 공통 navigation에 붙이기 쉬워졌다.

Git 근거:

- `488eea4`, `86ddfbf`, `6b41ce2`, `9a3e9b8`, `903f517`
- `app/navigation/MainTabNavigator.js`
- `app/components/CommonFooter.js`
- `app/components/CommonHeader.js`

포트폴리오 bullet:

- React Native 앱의 역할 기반 화면 구조를 React Navigation 중심으로 재설계하고, 중복 footer를 공통 컴포넌트로 통합해 화면 추가 비용을 낮춤.

### 사례 2. FastAPI-Supabase 데이터 연결과 CSV 업로드 파이프라인

문제:

- 앱 화면은 Supabase의 팀/선수/경기 데이터와 연결되어야 했다.
- 경기 기록은 CSV로 들어오는 형태라 backend에서 파싱하고 DB에 반영해야 했다.

행동:

- FastAPI에서 Supabase client를 연결했다.
- CSV 업로드 API를 만들고, 파일 데이터를 Supabase DB로 반영하는 흐름을 구현했다.
- 기록자 화면의 업로드 UI와 backend endpoint를 함께 맞췄다.

결과:

- 앱이 backend API를 통해 경기/선수 데이터를 사용할 수 있는 기반이 생겼다.
- 기록원이 CSV를 통해 경기 기록을 반영할 수 있는 데이터 입력 흐름이 만들어졌다.

Git 근거:

- `924f1c1`, `03f32cc`, `3ad18d9`, `8966556`, `49e5e71`
- `backend/main.py`
- `backend/requirements.txt`
- `app/screen/recorderScreen.js`

포트폴리오 bullet:

- FastAPI-Supabase 연동 계층과 CSV 업로드 API를 구현해 경기 기록 파일을 DB에 반영하는 데이터 파이프라인을 구축함.

### 사례 3. 선수 상세 통계와 AI PR 카드 흐름 구현

문제:

- 선수 상세 페이지는 단순 개인정보가 아니라 타자/투수 기록, 리뷰, 이미지 생성까지 제공해야 했다.
- AI API 호출은 실패 가능성이 있어 frontend/backend 양쪽에서 상태와 오류 처리가 필요했다.

행동:

- Supabase에서 선수/팀/경기 데이터를 조회하고 타자/투수 지표를 계산했다.
- AI review와 image generation endpoint를 호출하는 흐름을 연결했다.
- 생성된 이미지를 미리보기/저장할 수 있도록 화면 상태를 구성했다.

결과:

- 선수 상세 화면이 기록 분석과 AI 기반 자기 PR 기능을 함께 제공하는 핵심 화면이 되었다.
- 앱의 차별화 기능인 AI 카드 생성 흐름을 사용자 동작 기준으로 완성했다.

Git 근거:

- `a0c3e07`, `bca5bf6`, `9b33d11`, `2daceb6`
- `app/screen/playerDetailScreen.js`
- `app/screen/playerDetailScreen.styles.js`
- `backend/main.py`

포트폴리오 bullet:

- 선수 경기 데이터를 기반으로 타자/투수 지표를 계산하고, AI prompt/API/이미지 저장 흐름을 연결해 개인 PR 카드 생성 기능을 구현함.

### 사례 4. 팀 개발 후반부 통합과 품질 회복

문제:

- 팀원별 브랜치가 여러 갈래로 나뉘어 있었고, 화면/파일명이 겹치거나 대소문자가 섞였다.
- 일부 UI 변경은 앱 구조와 충돌해 되돌려야 했다.

행동:

- 여러 feature branch와 PR을 `dev`에 병합했다.
- syntax error, 깨진 button, 로그아웃 문제, 화면 겹침을 수정했다.
- 문제가 된 UI 변경은 revert했다.
- 중복/구버전 화면과 테스트 파일을 정리했다.

결과:

- 각자 만든 기능이 하나의 앱 흐름으로 연결되었다.
- 제출 전 앱 구조와 저장소 상태가 정리되었다.

Git 근거:

- merge 커밋 다수: `0ba82f4`, `3530575`, `13e1e04`, `5f6c42d`, `3535d3a`, `2a57afa`
- 안정화 커밋: `8966556`, `35e7c67`, `27419f0`, `099be16`, `2a722b6`, `4cc1e2d`

포트폴리오 bullet:

- 팀원 feature branch를 `dev`에 통합하며 충돌, 깨진 화면, 잘못된 UI 변경을 수정/revert해 기능 마감 단계의 앱 안정성을 회복함.

### 사례 5. 공개 전 보안/문서 정리

문제:

- `.env` 파일에 민감 키가 남으면 저장소 공개나 제출 시 보안 문제가 된다.
- 프로젝트 구조와 실행 방법이 문서화되지 않으면 재현성이 떨어진다.

행동:

- `.gitignore`를 보강했다.
- 루트와 backend `.env`에서 민감정보를 제거했다.
- README에 프로젝트 개요, 기술 스택, 구조, 실행 방법을 정리했다.

결과:

- 공개/제출 리스크를 낮췄다.
- 프로젝트를 처음 보는 사람이 구조와 실행 방법을 파악할 수 있게 되었다.

Git 근거:

- `16a2439`, `34440f0`, `bc72656`, `af9737f`, `51b633a`
- `.gitignore`
- `.env`
- `backend/.env`
- `README.md`

포트폴리오 bullet:

- 프로젝트 제출 전 `.env` 민감정보 제거, `.gitignore` 보강, README 문서화를 수행해 저장소의 보안성과 재현성을 개선함.

## 5. 기술 키워드로 재정리

| 기술/역량 | Git 근거 | 포트폴리오에서 말할 수 있는 내용 |
|---|---|---|
| React Native | `a0c3e07`, `488eea4`, `903f517`, `49e5e71` | 화면 구성, 상태 관리, 스타일 분리, 모바일 UI 개선 |
| React Navigation | `488eea4`, `86ddfbf`, `9a3e9b8`, `903f517` | role 기반 tab/stack navigation 설계 |
| Supabase JS Client | `9dc6131`, `7d3ba22`, `a0c3e07` | 로그인, member/team/game 데이터 조회 |
| FastAPI | `924f1c1`, `3ad18d9`, `49e5e71`, `9b33d11` | API endpoint, file upload, external API 중계 |
| Supabase Python SDK | `924f1c1`, `3ad18d9` | backend에서 DB 조회/저장 |
| CSV 처리 | `3ad18d9` | 경기 기록 업로드와 DB 반영 |
| AI API 연동 | `2daceb6`, `9b33d11` | Gemini/image generation/card generation 흐름 |
| 협업/버전관리 | merge 커밋 25개, `35e7c67`, `27419f0` | PR 병합, revert, 충돌 후 안정화 |
| 보안 | `bc72656`, `af9737f`, `16a2439` | 민감 키 제거, gitignore 정리 |
| 문서화 | `e9a8347`, `51b633a` | PR 템플릿, README |

## 6. 최현석 전체 커밋별 기여 해석

아래 표는 최현석의 71개 커밋 전체를 시간순으로 정리한 것이다. `관점`은 변경 파일 경로와 커밋 메시지를 기준으로 붙였다.

| No | 날짜 | 커밋 | 유형 | 관점 | 변경사항 수준의 해석 | 포트폴리오 활용 포인트 |
|---:|---|---|---|---|---|---|
| 1 | 2026-03-18 | `69ba516` | commit | Docs/Other | 초기 README/테스트 파일 정리 | 저장소 초기 정리 경험 |
| 2 | 2026-03-19 | `e9a8347` | commit | Docs/Process | `pull_request_template.md` 추가 | PR 기반 협업 프로세스 마련 |
| 3 | 2026-03-19 | `bd2898c` | commit | Docs/Process | 브랜치 생성을 위한 `readme.md` 추가 | 브랜치 협업 초기 세팅 |
| 4 | 2026-03-19 | `aa3c2d5` | commit | Test | 계산기 테스트 파일 추가 | 초기 Git/기능 실험 |
| 5 | 2026-03-19 | `ea59876` | merge | Integration | `DaesanChoi` PR 병합 | 팀원 작업 통합 |
| 6 | 2026-03-19 | `799fba4` | commit | Test | main 병합 테스트 파일 추가 | 병합 흐름 테스트 |
| 7 | 2026-03-19 | `f57ae15` | merge | Integration | `frontend-test01` PR 병합 | feature branch 통합 |
| 8 | 2026-03-20 | `bceb676` | commit | Test | `codereview.py` 테스트 코드 추가 | 실험/검증 커밋 |
| 9 | 2026-03-24 | `924f1c1` | commit | Backend | `backend/main.py`, `requirements.txt`, `.env` 수정 | FastAPI-Supabase 조회 기반 구축 |
| 10 | 2026-03-24 | `e0c3ed0` | merge | Integration | 최현석 backend 작업 PR 병합 | backend 기능 통합 |
| 11 | 2026-03-24 | `04254ef` | merge | Integration | 최대산 문서/기능 PR 병합 | 팀 문서/기능 통합 |
| 12 | 2026-03-24 | `03f32cc` | commit | Structure | `BTS-app`을 `app`으로 정리, `.env` 위치 정리 | 앱/백엔드 디렉터리 구조 확립 |
| 13 | 2026-03-24 | `3ad18d9` | commit | Backend/Frontend | CSV 업로드 backend와 recorder 화면 수정 | 파일 업로드 -> DB 반영 파이프라인 |
| 14 | 2026-03-24 | `b0a014a` | merge | Integration | CSV 업로드 관련 PR 병합 | backend 기능 병합 |
| 15 | 2026-03-24 | `dc82053` | merge | Integration | `main` 변경분을 feature branch에 병합 | 브랜치 최신화 |
| 16 | 2026-03-25 | `9dc6131` | commit | Frontend/Auth | loginScreen, App, design reference, lockfile 수정 | Supabase 로그인/권한 분기 1차 |
| 17 | 2026-03-25 | `7d3ba22` | commit | Frontend/Auth | `app/lib/supabase.js`, Director/Player 화면 추가 | Supabase client와 역할별 화면 기반 |
| 18 | 2026-03-25 | `0ba82f4` | merge | Integration | 로그인/권한 PR 병합 | 인증 기능 통합 |
| 19 | 2026-03-25 | `3530575` | merge | Integration | 송형철 `cheol` branch 병합 | 일정 CRUD/감독 기능 통합 |
| 20 | 2026-03-25 | `8966556` | commit | Frontend/Fix | `recorderScreen.js` syntax error와 button 복구 | 깨진 화면 빠른 복구 |
| 21 | 2026-03-26 | `e678d26` | commit | Cleanup | `.expo`, recorder/history/schedule 테스트 파일 정리 | 병합 후 불필요 파일 제거 |
| 22 | 2026-03-26 | `d76a305` | merge | Integration | `origin/US-04` 병합 | 선수 일정 기능 통합 |
| 23 | 2026-03-26 | `fdbf7be` | commit | Frontend/Cleanup | `PlayerScreen` 삭제/화면 전환 조정 | 화면 구조 정리 |
| 24 | 2026-03-26 | `488eea4` | commit | Frontend/Architecture | navigation 전환, styles 분리, constants/utils 분리 | 화면 구조와 유지보수성 개선 |
| 25 | 2026-03-26 | `a0c3e07` | commit | Frontend/PlayerDetail | 선수 프로필 화면과 styles 대규모 추가 | 선수 상세 핵심 기능 구현 |
| 26 | 2026-03-26 | `f7eb88a` | merge | Integration | 선수 상세 브랜치 병합 | 개인 기능 통합 |
| 27 | 2026-03-26 | `129b668` | commit | Frontend/Cleanup | `gameDetailScreen1.js` 삭제 | 중복 화면 제거 |
| 28 | 2026-03-26 | `86ddfbf` | commit | Frontend/Navigation | PlayerFooter, league/team/player 화면 연결 | footer navigation 생성 |
| 29 | 2026-03-26 | `13e1e04` | merge | Integration | 최대산 리그 일정 브랜치 병합 | 리그 일정 기능 통합 |
| 30 | 2026-03-26 | `f102903` | commit | Frontend/MergeFix | gameDetail, league, teamInfo 조정 | 병합 후 화면 연결 정리 |
| 31 | 2026-03-26 | `5f6c42d` | merge | Integration | 송형철 라인업 브랜치 병합 | 감독 라인업 기능 통합 |
| 32 | 2026-03-26 | `89a0d51` | commit | Frontend/MergeFix | DirectorSchedule/Lineup styles 대규모 조정 | 병합 후 감독 화면 안정화 |
| 33 | 2026-03-27 | `6b41ce2` | commit | Frontend/Navigation | DirectorFooter, DirectorSchedule, PlayerSchedule 수정 | 감독 footer navigation 연동 |
| 34 | 2026-03-27 | `0ca23b1` | merge | Integration | `choi` PR 병합 | navigation 작업 통합 |
| 35 | 2026-03-27 | `52b5626` | commit | Frontend/UX | Android 겹침 수정, calendar today 버튼 추가 | 모바일 UX 문제 해결 |
| 36 | 2026-03-27 | `30fecb0` | commit | Frontend/Navigation | footer 팀 정보 링크 수정 | 잘못된 navigation 경로 수정 |
| 37 | 2026-03-27 | `bca5bf6` | commit | Frontend/PlayerDetail | 테스트 로그인, playerDetail 타자/투수 UI 수정 | 개발 편의성과 선수 상세 UI 개선 |
| 38 | 2026-03-27 | `c9248d1` | merge | Integration | playerDetail UI PR 병합 | UI 변경 통합 |
| 39 | 2026-03-27 | `e8905df` | merge | Integration | 최대산 playerSchedule 분리 PR 병합 | 선수 일정 구조 통합 |
| 40 | 2026-03-27 | `35e7c67` | commit | Revert/Fix | playerDetail UI PR revert | 문제 변경 되돌림과 안정성 회복 |
| 41 | 2026-03-27 | `f4b4768` | commit | Frontend/Auth/Test | 테스트 로그인 버튼 추가 | QA/개발 속도 개선 |
| 42 | 2026-03-27 | `177a436` | merge | Integration | 송형철 3/27 작업 병합 | 팀 정보/라인업 기능 통합 |
| 43 | 2026-03-27 | `9a3e9b8` | commit | Frontend/Architecture | CommonFooter/CommonHeader 도입, 기존 footer 삭제 | 공통 컴포넌트화 |
| 44 | 2026-03-27 | `099be16` | commit | Frontend/Cleanup | gameDetail 화면 제거와 playerDetail 정리 | 중복 화면/오래된 화면 정리 |
| 45 | 2026-03-30 | `3535d3a` | merge | Integration | myGame/playerSchedule merge PR 병합 | 내 경기/선수 일정 기능 통합 |
| 46 | 2026-03-30 | `903f517` | commit | Frontend/Architecture | `MainTabNavigator.js` 153줄 추가 | stack 구조를 tab navigator 중심으로 통합 |
| 47 | 2026-03-30 | `ac1cd7c` | merge | Integration | 최대산 UI/UX 브랜치 병합 | UI/UX 변경 통합 |
| 48 | 2026-03-30 | `4abb18a` | commit | Refactor | CommonFooter, navigation, backend/main 정리 | frontend/backend 간단 리팩터링 |
| 49 | 2026-03-30 | `7d3da76` | merge | Integration | Supabase data update 리팩터링 PR 병합 | 데이터 반영 리팩터링 통합 |
| 50 | 2026-03-30 | `decfc35` | merge | Integration | AI model 1차 PR 병합 | AI 기능 통합 |
| 51 | 2026-03-30 | `cbb1a6e` | commit | Refactor/UI | lineup/myGame/playerDetail/teamInfo 리팩터링 | UI와 데이터 유틸 정리 |
| 52 | 2026-03-30 | `7056164` | merge | Integration | Supabase 리팩터링 PR 병합 | Supabase 구조 통합 |
| 53 | 2026-03-30 | `9910aa0` | merge | Integration | 송형철 directorSchedule UI PR 병합 | 감독 일정 UI 통합 |
| 54 | 2026-03-30 | `27419f0` | commit | Revert/Fix | directorSchedule UI 개선 revert | 불안정 UI 변경 되돌림 |
| 55 | 2026-03-30 | `5fd20e5` | merge | Integration | 송형철 UI 작업을 `dev`에 병합 | 후속 UI 변경 통합 |
| 56 | 2026-03-30 | `02939d3` | commit | Refactor/UI | lineup/myGame/playerDetail/teamInfo 리팩터링 | 반복 리팩터링과 avatar 관련 조정 |
| 57 | 2026-03-30 | `3aaecd1` | commit | Refactor/UI | `02939d3`와 같은 범위의 후속 리팩터링 | 리팩터링 재적용/정리 |
| 58 | 2026-03-30 | `49e5e71` | commit | Fullstack | BestMember, lineup, myGame, teamInfo, backend/main 추가 | FastAPI-Supabase와 화면 구조 통합 구현 |
| 59 | 2026-03-30 | `721fa31` | merge | Integration | `dev` branch 병합 | dev 통합 |
| 60 | 2026-03-31 | `929cfa8` | commit | Config/Cleanup | backend `__pycache__` 추적 정리 | 생성물 정리 |
| 61 | 2026-03-31 | `16a2439` | commit | Security/Config | `.gitignore` 수정 | ignore 정책 보강 |
| 62 | 2026-03-31 | `2a57afa` | merge | Integration | 최대산 AI review PR 병합 | review 기능 통합 |
| 63 | 2026-03-31 | `9b33d11` | commit | Fullstack | playerDetail, login, myGame, teamInfo, backend/main 대규모 수정 | React Native-FastAPI-Supabase 통합 보강 |
| 64 | 2026-03-31 | `34440f0` | commit | Security/Config | `.gitignore` 후속 수정 | ignore 정책 정리 |
| 65 | 2026-03-31 | `2a722b6` | commit | Frontend/Fix | CommonHeader logout 수정 | 로그아웃 UX/기능 수정 |
| 66 | 2026-03-31 | `4cc1e2d` | commit | Frontend/Fix | 기록원 페이지 logout 수정 | 역할별 logout 오류 해결 |
| 67 | 2026-03-31 | `4a58374` | commit | Frontend/Validation | managerSchedule 과거 날짜 등록 차단 | 입력 검증과 일정 등록 품질 개선 |
| 68 | 2026-03-31 | `2daceb6` | commit | Fullstack/AI | playerDetail과 backend AI 이미지 생성 개선 | AI 사진 생성 기능 안정화 |
| 69 | 2026-06-05 | `bc72656` | commit | Security | 루트 `.env` 민감 키 제거 | 공개 전 보안 정리 |
| 70 | 2026-06-05 | `af9737f` | commit | Security | `backend/.env` 민감 키 제거 | backend 환경정보 보안 정리 |
| 71 | 2026-06-21 | `51b633a` | commit | Docs | `README.md` 232줄 추가 | 프로젝트 문서화와 재현성 개선 |

## 7. 자기소개서/면접용 답변 초안

### 7.1 풀스택 문제 해결형 답변

> BTS 프로젝트에서 저는 React Native 앱과 FastAPI-Supabase 백엔드의 연결 지점을 주로 맡았습니다. 초기에는 FastAPI에서 Supabase 데이터를 조회하는 API를 만들고, CSV 경기 기록을 업로드해 DB에 반영하는 흐름을 구현했습니다. 이후 Supabase 로그인과 역할별 화면 분기를 연결하고, React Navigation 기반의 `MainTabNavigator`로 화면 구조를 재정리했습니다. 기능이 늘어난 후반에는 선수 상세 화면에서 기록 계산, AI 리뷰, AI 이미지 생성, 카드 미리보기/저장 흐름까지 연결해 사용자 경험을 완성했습니다.

### 7.2 협업/통합형 답변

> 팀 프로젝트 후반에는 여러 명의 feature branch가 동시에 만들어져 화면 연결과 충돌 해결이 중요했습니다. 저는 25개의 merge 커밋을 통해 팀원 작업을 `dev` 브랜치에 지속적으로 통합했고, 병합 후 깨진 화면과 syntax error, 잘못된 UI 변경을 수정하거나 revert했습니다. 특히 footer/navigation을 공통 구조로 정리해 각자 만든 화면이 하나의 앱 흐름에서 동작하도록 맞췄습니다.

### 7.3 보안/마감형 답변

> 제출 전에는 저장소 공개 리스크를 줄이기 위해 `.env`와 `backend/.env`에서 민감 키를 제거하고 `.gitignore`를 정리했습니다. 마지막으로 README를 작성해 프로젝트 구조, 기술 스택, 실행 방법을 문서화했습니다. 기능 구현뿐 아니라 제출 가능한 저장소 상태를 만드는 마감 작업까지 담당했습니다.

## 8. 이력서 bullet 후보

- React Native와 React Navigation을 사용해 선수/감독/기록원 역할별 tab/stack navigation을 구성하고, 공통 footer/header 컴포넌트로 중복 UI를 통합.
- Supabase 기반 로그인과 `Primary_Position` 기준 권한 분기를 구현해 역할별 화면 진입 흐름을 구성.
- FastAPI와 Supabase를 연동해 선수/팀/경기 데이터 조회 기반을 만들고, CSV 업로드를 통한 경기 기록 DB 반영 흐름을 구현.
- 선수 상세 화면에서 타자/투수 기록 지표 계산, AI 리뷰 조회, AI PR 카드 이미지 생성/미리보기/저장 흐름을 구현.
- 팀원 feature branch를 `dev`에 통합하며 merge, revert, syntax error 수정, 중복 화면 제거를 수행해 프로젝트 마감 안정성을 확보.
- `.env` 민감정보 제거, `.gitignore` 정리, README 작성으로 공개/제출 가능한 저장소 상태를 정리.

## 9. 최종 정리

최현석의 커밋 기록은 특정 화면 하나만 맡은 형태가 아니라, 프로젝트의 연결 지점을 계속 해결한 흐름에 가깝다.

- backend에서는 FastAPI-Supabase 연결, CSV 업로드, AI 이미지 endpoint 개선에 기여했다.
- frontend에서는 로그인/권한 분기, 선수 상세, 내비게이션, 공통 footer/header, UI 오류 수정을 맡았다.
- 협업에서는 팀원 브랜치를 병합하고, 잘못된 변경을 revert하며, 기능 화면을 하나의 앱 구조로 연결했다.
- 마감 단계에서는 민감정보 제거와 README 문서화를 통해 프로젝트 제출 품질을 높였다.

포트폴리오에서는 "풀스택으로 기능을 만들었다"보다 **데이터/API/화면/팀 통합의 끊어진 지점을 찾아 연결하고 안정화한 역할**로 설명하는 것이 가장 설득력 있다.
