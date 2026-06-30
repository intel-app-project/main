# dev 브랜치 전체 커밋 기반 상세 기여 정리

## 0. 문서 목적

이 문서는 `dev` 브랜치에 포함된 전체 커밋 기록을 기준으로 프로젝트 진행 흐름과 기여자별 작업 내용을 정리한다.

기준 커밋은 `dev` 브랜치 HEAD인 `51b633a`이며, 분석 대상 기간은 `2026-03-18`부터 `2026-06-21`까지다.

## 1. 분석 기준과 주의사항

사용한 Git 근거는 다음과 같다.

- `git shortlog -sne dev`
- `git log dev --reverse --date=short`
- `git log dev --numstat`
- 커밋 작성자, 작성일, 커밋 메시지
- 커밋별 변경 파일 수와 추가/삭제 라인 수
- 현재 저장소의 `app/`, `backend/`, `report_md/` 구조

주의할 점은 다음과 같다.

- 라인 수는 Git `numstat` 기준이므로 `package-lock.json`, 생성 파일, `__pycache__`, 이미지 같은 바이너리/생성물이 포함될 수 있다.
- merge 커밋은 기본 `git log --numstat` 출력에서 변경량이 0으로 보이는 경우가 많다. 따라서 merge 커밋은 라인 수보다 통합/병합 흐름의 증거로 보는 것이 적절하다.
- 작성자명이 여러 형태로 섞여 있어 이메일 기준으로 같은 사람을 통합했다.
- 커밋 메시지가 짧거나 테스트성인 경우에는 파일 변경 대상과 인접 커밋을 함께 보고 보수적으로 해석했다.
- 이 문서는 Git 기록에서 확인 가능한 작업만 다룬다. 회의, 설계 논의, 발표 준비처럼 Git에 남지 않은 기여는 반영되지 않을 수 있다.

## 2. 작성자 ID 통합

| 통합 기여자 | Git 작성자 표기 | 이메일 | 커밋 수 |
|---|---|---|---:|
| 최현석 | `Choi Hyunseok`, `CHOI HYUN SEOK` | `testwelltest01@gmail.com` | 71 |
| 최대산 | `Tester` | `cds0220@naver.com` | 36 |
| 최대산 | `DSanyC` | `cdsan0220@gmail.com` | 1 |
| 송형철 | `totsong2_max`, `Hyung Cheol Song` | `totsong2@gmail.com` | 11 |

## 3. 전체 커밋 통계

| 항목 | 값 |
|---|---:|
| 전체 커밋 수 | 119 |
| non-merge 커밋 수 | 88 |
| merge 커밋 수 | 31 |
| 첫 커밋 | `2026-03-18` |
| 마지막 커밋 | `2026-06-21` |
| 주요 개발 집중 기간 | `2026-03-24` ~ `2026-03-31` |

| 기여자 | 전체 커밋 | non-merge | merge | 추가 라인 | 삭제 라인 | 바이너리/생성물 변경 | 활동 기간 |
|---|---:|---:|---:|---:|---:|---:|---|
| 최현석 | 71 | 46 | 25 | 18,177 | 8,681 | 27 | 2026-03-18 ~ 2026-06-21 |
| 최대산 | 37 | 32 | 5 | 23,612 | 3,774 | 24 | 2026-03-18 ~ 2026-04-01 |
| 송형철 | 11 | 10 | 1 | 4,399 | 8,183 | 14 | 2026-03-24 ~ 2026-03-31 |

## 4. 날짜별 진행 흐름

| 날짜 | 커밋 수 | 주요 흐름 |
|---|---:|---|
| 2026-03-18 | 9 | 저장소 초기화, 테스트 파일, 초기 branch/merge 실험 |
| 2026-03-19 | 8 | PR 템플릿, 브랜치 생성, 병합 테스트, 계산기 테스트 기능 |
| 2026-03-20 | 1 | 테스트성 커밋 |
| 2026-03-24 | 12 | Expo 앱 생성, 로그인/기록자 화면, FastAPI/Supabase 연결, 프로젝트 문서 생성 |
| 2026-03-25 | 10 | Supabase 로그인/권한 분기, 선수 일정 화면, 감독 일정 CRUD, DB 연동 확인 |
| 2026-03-26 | 15 | 내비게이션/스타일 분리, 선수 상세/경기 상세/리그 일정, 라인업 기능, footer 구조 |
| 2026-03-27 | 14 | 공통 footer/header, playerSchedule 분리, 팀 정보/라인업 저장, UI 수정과 revert |
| 2026-03-29 | 1 | myGameScreen과 playerScheduleScreen 병합 및 코드 리뷰 |
| 2026-03-30 | 21 | MainTabNavigator 통합, UI/UX 수정, Supabase 리팩터링, directorSchedule UI, dev 병합 |
| 2026-03-31 | 23 | AI review, 리뷰 메시지, logout 수정, managerSchedule UI/검증, AI 사진 기능, 최종 병합 |
| 2026-04-01 | 2 | myGameScreen useFocusEffect 적용, Google API key 문제 해결 |
| 2026-06-05 | 2 | `.env`, `backend/.env` 민감 키 제거 |
| 2026-06-21 | 1 | 루트 README 프로젝트 설명/설정 문서화 |

## 5. 기여자별 상세 정리

### 5.1 최현석

#### 커밋상 역할 요약

최현석은 전체 119개 커밋 중 71개를 작성했고, 그중 25개가 merge 커밋이다. 기능 구현뿐 아니라 브랜치 병합, 충돌 정리, 구조 통합, 보안 정리, README 작성까지 저장소 전체를 묶는 역할이 강하게 드러난다.

#### 주요 작업 영역

| 작업군 | 근거 커밋 | 내용 |
|---|---|---|
| 협업/저장소 초기화 | `69ba516`, `e9a8347`, `bd2898c`, `799fba4` | 초기 파일 정리, PR 템플릿, 브랜치/병합 테스트 기반 작업 |
| FastAPI/Supabase 기반 | `924f1c1`, `03f32cc`, `3ad18d9`, `49e5e71` | FastAPI에서 Supabase 데이터 조회, 앱/백엔드 기본 구조, CSV 업로드 후 Supabase 반영 |
| 로그인/권한 분기 | `9dc6131`, `7d3ba22`, `f4b4768`, `2a722b6`, `4cc1e2d` | Supabase 로그인, 역할별 화면 분기, 테스트 로그인 버튼, 로그아웃 동작 수정 |
| 화면 전환/내비게이션 | `488eea4`, `86ddfbf`, `6b41ce2`, `9a3e9b8`, `903f517` | useState 기반 화면 전환을 navigation 구조로 변경, footer/header 공통화, MainTabNavigator 통합 |
| 선수 상세/프로필 | `a0c3e07`, `bca5bf6`, `35e7c67`, `2daceb6` | 선수 프로필 화면, 타자/투수 UI, AI 사진 생성 관련 개선, UI 변경 revert |
| 리팩터링/공통 유틸 | `488eea4`, `4abb18a`, `cbb1a6e`, `02939d3`, `3aaecd1` | 스타일 컴포넌트 분리, `scheduleUtils`, constants 정리, Supabase 데이터 반영 흐름 리팩터링 |
| 통합/병합 관리 | 다수 merge 커밋 | `DaesanChoi`, `choihyunseok`, `cheol`, `US-04`, `DS_*`, `song_*` 브랜치 병합 |
| 보안/문서 | `929cfa8`, `16a2439`, `34440f0`, `bc72656`, `af9737f`, `51b633a` | `.gitignore` 정리, 민감 키 제거, README 작성 |

#### 커밋에서 보이는 책임 범위

- 앱의 큰 뼈대인 `App.js`, `MainTabNavigator.js`, 공통 header/footer를 꾸준히 수정했다.
- `backend/main.py`를 여러 번 수정해 프론트엔드와 Supabase/API 사이 연결을 잡았다.
- `playerDetailScreen.js`, `playerScheduleScreen.js`, `loginScreen.js` 등 핵심 사용자 화면을 직접 구현하거나 통합했다.
- merge와 revert가 많아 팀원별 feature branch를 `dev`에 합치고 깨진 상태를 복구하는 작업을 맡은 흔적이 크다.
- 후반에는 `.env` 민감정보 제거와 README 정리까지 수행해 제출/공개 가능한 형태로 저장소를 정돈했다.

#### 대표 변경 파일

- `app/screen/playerDetailScreen.js`
- `app/screen/playerScheduleScreen.js`
- `app/screen/loginScreen.js`
- `app/navigation/MainTabNavigator.js`
- `app/components/CommonFooter.js`
- `app/components/CommonHeader.js`
- `app/utils/scheduleUtils.js`
- `backend/main.py`
- `.gitignore`
- `README.md`

#### 한 줄 평가

최현석은 인증, 공통 구조, 백엔드 연결, 선수 상세 기능, 병합 관리, 보안/문서 정리를 맡은 통합형 기여자로 볼 수 있다.

### 5.2 최대산

#### 커밋상 역할 요약

최대산은 전체 37개 커밋을 작성했고, playerSchedule, myGame, leagueGameSchedule, review 기능과 UI/UX 수정에서 가장 강한 흔적을 남겼다. `report_md` 문서 생성도 최대산 커밋에 포함되어 있다.

#### 주요 작업 영역

| 작업군 | 근거 커밋 | 내용 |
|---|---|---|
| 초기 브랜치/테스트 | `2c5e8c2` ~ `a29ca15`, `8669c45`, `b7e46b6` | 초기 README, 테스트 파일, 개인 브랜치 생성과 병합 테스트 |
| Expo/화면 초기 구축 | `5a13971`, `4f2669a` | Expo Native 설치, 로그인 화면, 기록자 업로드 화면, FastAPI 연결 확인 |
| 프로젝트 문서 | `bba098d`, `e90066d` | 기획/사용자 스토리 문서와 `report_md` 보고서 문서 생성 |
| 선수 일정 | `79a6570`, `eddf668`, `6465c9f`, `de8dc0d` | `playerScheduleScreen` 추가, DB 기반 이름 표시, team/member/schedule 연동, 화면 완성/분할 |
| 경기 상세/리그 일정 | `dd11be9`, `e2d8435`, `996c003`, `32b0744` | 사용자 경기 상세 페이지, 리그 경기 일정, 이전 경기/남은 경기 분리, 리그 일정 UI/UX |
| myGame | `60232aa`, `c7f43b9`, `e90066d` | `myGameScreen` 병합, 코드 리뷰, UI/UX 수정, `useFocusEffect` 적용 |
| AI review/리뷰 흐름 | `c485b4f`, `050f699`, `7720dc3`, `19cdade` | Past/Future matches 분리, AI review 기능, directorSchedule review message, playerDetail prompt 입력 형식 수정 |
| 안정화/수리 | `d31f80a`, `47b4e9c`, `fc8907e`, `a60c9b2` | 깨진 화면/상수/API 흐름 수리, Google API key 문제 해결 |

#### 커밋에서 보이는 책임 범위

- 선수 관점 화면인 `playerScheduleScreen.js`, `myGameScreen.js`, `leagueGameScheduleScreen.js`를 반복적으로 수정했다.
- AI review 기능은 `backend/review/`, `backend/review_logic.py`, `backend/main.py`, `app/supabaseDataReference/review_table.sql`까지 이어져 있어 프론트엔드와 백엔드 양쪽을 건드린 기능이다.
- `report_md` 문서를 한 번에 대량 추가한 커밋이 있어 발표/보고 자료 정리에도 관여했다.
- 2026-03-31 후반부에는 UI/UX 수정, review message, broken state repair가 집중되어 기능 마감/안정화 성격이 강하다.

#### 대표 변경 파일

- `app/screen/playerScheduleScreen.js`
- `app/screen/leagueGameScheduleScreen.js`
- `app/screen/myGameScreen.js`
- `app/screen/directorScheduleScreen.js`
- `app/screen/playerDetailScreen.js`
- `backend/main.py`
- `backend/review_logic.py`
- `backend/review/prompts.py`
- `backend/review/rules.py`
- `backend/review/service.py`
- `report_md/*.md`

#### 한 줄 평가

최대산은 선수 일정, 내 경기, 리그 일정, AI 리뷰, 보고서 문서를 중심으로 사용자 화면과 리뷰 기능을 밀어 올린 기능 구현형 기여자로 볼 수 있다.

### 5.3 송형철

#### 커밋상 역할 요약

송형철은 전체 11개 커밋을 작성했고, 감독/관리자 관점의 일정 CRUD, 라인업 구성, 팀 정보, managerSchedule UI 쪽에서 뚜렷한 기여가 보인다. 커밋 수는 적지만 특정 기능 단위의 변경량이 크다.

#### 주요 작업 영역

| 작업군 | 근거 커밋 | 내용 |
|---|---|---|
| 초기 파일 정리 | `2d8770b` | 불필요한 `readme.md` 삭제 |
| 경기 데이터 조회 | `174d665` | 경기 데이터 읽기 기능, 기록 화면/history, backend 조회 보조 파일 |
| 스케줄/백엔드 스키마 | `290a897` | 스케줄 화면 추가, 백엔드 스키마 수정, managerSchedule 기반 마련 |
| 일정 CRUD | `ba207bf` | 경기 일정 관리 CRUD 구현 완료 |
| 감독 라인업 | `3f6b4fe` | 예정 경기 라인업 구성 기능 |
| 라인업/팀 정보 고도화 | `587e6db` | 홈/어웨이 라인업 분리 저장, 숫자 ID 기반 식별, 팀 정보 화면 구축 |
| directorSchedule UI | `b7c5749`, `7b4c4b8`, `322ce4e` | directorSchedule UI 개선 시도, revert PR 병합 |
| 팀 로고/managerSchedule UI | `649dda1`, `44e985d` | 팀 정보 로고 입력, managerSchedule UI 개선 |

#### 커밋에서 보이는 책임 범위

- `managerScheduleScreen.js`와 `managerScheduleScreen.styles.js` 변경량이 크고, 경기 일정 CRUD와 UI 개선이 반복된다.
- `LineupScreen`, `DirectorScheduleScreen`, `TeamInfoScreen` 계열 파일에 집중되어 감독/관리자 역할 화면을 담당한 것으로 보인다.
- `backend/main.py`에도 스케줄 CRUD와 라인업 저장을 위한 API/스키마 관련 변경이 남아 있다.
- 2026-03-30의 directorSchedule UI 작업은 revert/재적용 흐름이 있어 팀 통합 과정에서 UI 변경을 조정한 흔적이 있다.

#### 대표 변경 파일

- `app/screen/managerScheduleScreen.js`
- `app/screen/managerScheduleScreen.styles.js`
- `app/screen/directorScheduleScreen.js`
- `app/screen/lineupScreen.js`
- `app/screen/teamInfoScreen.js`
- `backend/main.py`
- `app/constants/commonConstants.js`
- `app/constants/scheduleConstants.js`

#### 한 줄 평가

송형철은 감독 일정 관리, 라인업 구성, 팀 정보와 managerSchedule UI를 맡은 관리자 기능 중심 기여자로 볼 수 있다.

## 6. 기능 단위로 본 프로젝트 형성 과정

| 기능/영역 | 주 기여자 | 관련 커밋 | 정리 |
|---|---|---|---|
| 저장소/협업 기반 | 최현석, 최대산 | `69ba516`, `e9a8347`, `8669c45`, `b7e46b6` | 초기 저장소, PR 템플릿, 브랜치/병합 테스트 |
| Expo 앱 기반 | 최대산, 최현석 | `5a13971`, `4f2669a`, `03f32cc`, `49e5e71` | Expo 프로젝트 생성, 앱 디렉터리 정리, 화면 기본 구조 |
| FastAPI/Supabase | 최현석, 송형철, 최대산 | `924f1c1`, `174d665`, `3ad18d9`, `6465c9f`, `c485b4f` | Supabase 조회, CSV 업로드, 일정/리뷰 API 연결 |
| 로그인/권한 | 최현석 | `9dc6131`, `7d3ba22`, `2a722b6`, `4cc1e2d` | Supabase 로그인, 역할별 화면 분기, logout 수정 |
| 선수 일정 | 최대산, 최현석 | `79a6570`, `eddf668`, `6465c9f`, `488eea4`, `de8dc0d` | DB 기반 선수 일정, 참석/상세/화면 분리 |
| 내 경기 | 최대산 | `60232aa`, `c7f43b9`, `e90066d` | myGameScreen 병합, UI 수정, focus 시 갱신 |
| 리그 일정 | 최대산 | `e2d8435`, `996c003`, `32b0744`, `c7f43b9` | 리그 경기 일정 화면, 이전/남은 경기 분리, UI/UX |
| 감독 일정 CRUD | 송형철, 최현석 | `290a897`, `ba207bf`, `44e985d`, `4a58374` | managerSchedule CRUD, UI 개선, 과거 날짜 등록 차단 |
| 라인업/팀 정보 | 송형철, 최현석 | `3f6b4fe`, `587e6db`, `49e5e71`, `649dda1` | 라인업 구성, 홈/원정 분리, 팀 정보/로고 |
| 공통 내비게이션 | 최현석 | `86ddfbf`, `6b41ce2`, `9a3e9b8`, `903f517` | role footer, common footer/header, MainTabNavigator |
| AI review | 최대산, 최현석 | `c485b4f`, `050f699`, `7720dc3`, `2daceb6`, `19cdade` | review backend, director review message, playerDetail prompt, AI 사진 기능 |
| 보안/공개 준비 | 최현석, 최대산 | `929cfa8`, `16a2439`, `34440f0`, `a60c9b2`, `bc72656`, `af9737f` | `.gitignore`, API key 문제 처리, 민감 키 제거 |
| 문서화 | 최대산, 최현석 | `bba098d`, `e90066d`, `51b633a` | 기획 문서, 발표/보고서 문서, README |

## 7. 전체 커밋 원장

아래 표는 `dev`에 포함된 119개 커밋 전체를 시간순으로 정리한 것이다. `변경량`은 텍스트 파일 기준 추가/삭제 라인이며, merge 커밋은 기본 통계상 0으로 보일 수 있다.

| No | 날짜 | 기여자 | 유형 | 커밋 | 변경량 | 파일 | 커밋 메시지 | 해석 |
|---:|---|---|---|---|---:|---:|---|---|
| 1 | 2026-03-18 | 최대산 | commit | `2c5e8c2` | +1/-0 | 1 | first commit | README 기반 최초 커밋 |
| 2 | 2026-03-18 | 최대산 | commit | `49f105c` | +0/-0 | 1 | dddd | 테스트 파일 추가로 보이는 초기 실험 |
| 3 | 2026-03-18 | 최대산 | commit | `34fe3ff` | +0/-0 | 1 | 3243242 | 테스트성 파일 변경 |
| 4 | 2026-03-18 | 최대산 | commit | `d9a51e3` | +0/-0 | 1 | ss | 테스트성 파일 변경 |
| 5 | 2026-03-18 | 최대산 | commit | `05bb337` | +0/-0 | 1 | nvnvn | 테스트성 파일 변경 |
| 6 | 2026-03-18 | 최대산 | commit | `95bf19b` | +0/-0 | 1 | safds | 테스트성 파일 변경 |
| 7 | 2026-03-18 | 최대산 | commit | `b515723` | +0/-0 | 1 | zzzzzzzzzzzzzzzzzzzz | 테스트성 파일 변경 |
| 8 | 2026-03-18 | 최대산 | merge | `a29ca15` | +0/-0 | 0 | Merge branch 'DaesanChoi' | 최대산 브랜치 병합 |
| 9 | 2026-03-18 | 최현석 | commit | `69ba516` | +0/-1 | 7 | 초기화 | 초기 파일 정리 |
| 10 | 2026-03-19 | 최현석 | commit | `e9a8347` | +12/-0 | 1 | PR(pull request) 템플릿 작성 | PR 협업 템플릿 추가 |
| 11 | 2026-03-19 | 최현석 | commit | `bd2898c` | +1/-0 | 1 | 브랜치 생성을 위한 readme파일 생성 | 브랜치 생성용 README 추가 |
| 12 | 2026-03-19 | 최대산 | commit | `8669c45` | +0/-0 | 1 | 최대산 브런치 생성 | 개인 브랜치 생성 흔적 |
| 13 | 2026-03-19 | 최현석 | commit | `aa3c2d5` | +1/-0 | 1 | feat: 계산기 기능 추가 | 테스트 기능 추가 |
| 14 | 2026-03-19 | 최현석 | merge | `ea59876` | +0/-0 | 0 | Merge pull request #2 from intel-app-project/DaesanChoi | 최대산 PR 병합 |
| 15 | 2026-03-19 | 최대산 | commit | `b7e46b6` | +2/-0 | 2 | text: 병합 관련 테스트 | merge 테스트용 텍스트 변경 |
| 16 | 2026-03-19 | 최현석 | commit | `799fba4` | +1/-0 | 1 | main병합용테스트 | main 병합 테스트 |
| 17 | 2026-03-19 | 최현석 | merge | `f57ae15` | +0/-0 | 0 | Merge pull request #4 from intel-app-project/frontend-test01 | frontend-test01 병합 |
| 18 | 2026-03-20 | 최현석 | commit | `bceb676` | +4/-0 | 1 | test | 테스트성 코드 추가 |
| 19 | 2026-03-24 | 최대산 | commit | `5a13971` | +8812/-0 | 10 | build: Native 설치 | Expo/React Native 앱 기반 생성 |
| 20 | 2026-03-24 | 최대산 | commit | `4f2669a` | +261/-9 | 7 | fead: 로그인 화면, 기록자 업로드 화면, FastAPI 연결 확인 | 로그인/기록자 화면과 FastAPI 연결 확인 |
| 21 | 2026-03-24 | 송형철 | commit | `2d8770b` | +0/-1 | 1 | Delete readme.md | 중복/불필요 README 삭제 |
| 22 | 2026-03-24 | 최현석 | commit | `924f1c1` | +58/-5 | 6 | feat: fastapi에서 supabase data get 확인 | FastAPI에서 Supabase 데이터 조회 확인 |
| 23 | 2026-03-24 | 최현석 | merge | `e0c3ed0` | +0/-0 | 0 | Merge pull request #5 from intel-app-project/Choihyunseok | 최현석 브랜치 병합 |
| 24 | 2026-03-24 | 최대산 | commit | `bba098d` | +393/-0 | 2 | MD 파일 생성 | 프로젝트 개요/사용자 스토리 문서 추가 |
| 25 | 2026-03-24 | 최현석 | merge | `04254ef` | +0/-0 | 0 | Merge pull request #6 from intel-app-project/DaesanChoi | 최대산 문서/기능 병합 |
| 26 | 2026-03-24 | 최현석 | commit | `03f32cc` | +7/-0 | 14 | 백엔드와 앱 기초 확립 | backend/app 디렉터리 구조 정리 |
| 27 | 2026-03-24 | 최현석 | commit | `3ad18d9` | +7447/-22 | 7 | 경기 기록을 CSV 업로드 및 supabase DB 로 반영 | CSV 업로드 후 Supabase 반영 기능 |
| 28 | 2026-03-24 | 최현석 | merge | `b0a014a` | +0/-0 | 0 | Merge pull request #10 from intel-app-project/#9 | CSV 업로드 관련 PR 병합 |
| 29 | 2026-03-24 | 송형철 | commit | `174d665` | +352/-19 | 14 | feat: 경기 데이터 읽기 기능 추 가 | 경기 데이터 읽기, history/recorder/backend 조회 보조 |
| 30 | 2026-03-24 | 최현석 | merge | `dc82053` | +0/-0 | 0 | Merge branch 'main' into #8 | main 변경분 통합 |
| 31 | 2026-03-25 | 최현석 | commit | `9dc6131` | +1086/-456 | 11 | feat: Supabase 로그인 연동 및 권한별 화면 분기 구현 (Terra 디자인 적용) | 로그인/권한 분기 1차 구현 |
| 32 | 2026-03-25 | 최현석 | commit | `7d3ba22` | +370/-31 | 8 | feat: Supabase 로그인 연동 및 권한별 화면 분기 구현 (Terra 디자인 적용) | 로그인/권한 분기 후속 구현 |
| 33 | 2026-03-25 | 최현석 | merge | `0ba82f4` | +0/-0 | 0 | Merge pull request #12 from intel-app-project/choihyunseok | 로그인/권한 브랜치 병합 |
| 34 | 2026-03-25 | 최대산 | commit | `79a6570` | +998/-116 | 8 | feat: playerScheduleScreen 페이지 추가, 페이지 상단 타이틀에 db 통한 이름 표시 | 선수 일정 화면과 DB 기반 이름 표시 |
| 35 | 2026-03-25 | 송형철 | commit | `290a897` | +892/-7440 | 22 | feat: 스케줄 화면 추가 및 백엔드 스키마 수정 | 스케줄 화면, backend schema, managerSchedule 기반 |
| 36 | 2026-03-25 | 송형철 | commit | `ba207bf` | +164/-24 | 4 | 경기 일정 관리 CRUD 작업 완료 | 경기 일정 CRUD 구현 |
| 37 | 2026-03-25 | 최대산 | commit | `eddf668` | +217/-204 | 3 | feat: team, member, schedule 테이블 연동 확인 | 선수 일정 관련 Supabase 테이블 연동 확인 |
| 38 | 2026-03-25 | 최대산 | commit | `6465c9f` | +738/-202 | 6 | feat: playerScheduleSreen 완성 | playerScheduleScreen 완성 |
| 39 | 2026-03-25 | 최현석 | merge | `3530575` | +0/-0 | 0 | Merge branch 'cheol' | 송형철 작업 병합 |
| 40 | 2026-03-25 | 최현석 | commit | `8966556` | +7/-13 | 1 | Fix: resolve syntax error and restore buttons in recorderScreen.js | recorderScreen syntax/button 복구 |
| 41 | 2026-03-26 | 최현석 | commit | `e678d26` | +9/-816 | 13 | 머지 완료, 테스트 파일 정리 | 병합 후 테스트 파일/화면 정리 |
| 42 | 2026-03-26 | 최현석 | merge | `d76a305` | +0/-0 | 0 | Merge remote-tracking branch 'origin/US-04' | US-04 브랜치 통합 |
| 43 | 2026-03-26 | 최현석 | commit | `fdbf7be` | +3/-44 | 3 | 임시 | 임시 화면/전환 정리 |
| 44 | 2026-03-26 | 최현석 | commit | `488eea4` | +1585/-1155 | 17 | 화면전화을 useState 에서 Navigate으로 바꾸고, styles 컴포넌트 분리하고, schedule관련한 util과 constants 분리. | navigation 전환, style/constants/utils 분리 |
| 45 | 2026-03-26 | 최대산 | commit | `dd11be9` | +1651/-40 | 7 | 1-2P 페이지 제작: 유저경기일정의 경기 상세 페이지 제작 | 사용자 경기 상세 페이지 제작 |
| 46 | 2026-03-26 | 최현석 | commit | `a0c3e07` | +1242/-34 | 11 | feat: 선수 프로필 페이지 완성 | 선수 프로필/상세 화면 완성 |
| 47 | 2026-03-26 | 최현석 | merge | `f7eb88a` | +0/-0 | 0 | Merge remote-tracking branch 'origin/choihyunseok-선수-1-5p' | 선수 상세 작업 브랜치 병합 |
| 48 | 2026-03-26 | 최현석 | commit | `129b668` | +0/-798 | 1 | gameDetailScreen1.js 파일 삭제 | 중복/구버전 상세 화면 삭제 |
| 49 | 2026-03-26 | 송형철 | commit | `3f6b4fe` | +710/-173 | 17 | 팀 감독이 예정된 경기 라인업 구성하는 기능 | 감독 라인업 구성 기능 |
| 50 | 2026-03-26 | 최대산 | commit | `e2d8435` | +590/-7 | 4 | 1-6P 페이지 제작: 리그 경기 일정 페이지 제작. | 리그 경기 일정 화면 제작 |
| 51 | 2026-03-26 | 최현석 | commit | `86ddfbf` | +403/-78 | 16 | 푸터 네비게이션바 생성 | footer navigation 생성 |
| 52 | 2026-03-26 | 최현석 | merge | `13e1e04` | +0/-0 | 0 | Merge remote-tracking branch 'origin/DS_1-6P' | 최대산 리그 일정 브랜치 병합 |
| 53 | 2026-03-26 | 최현석 | commit | `f102903` | +39/-138 | 8 | 머지 진행 완료 | 병합 후 화면/파일 조정 |
| 54 | 2026-03-26 | 최현석 | merge | `5f6c42d` | +0/-0 | 0 | Merge remote-tracking branch 'origin/hyungcheol_1-3p' | 송형철 라인업 브랜치 병합 |
| 55 | 2026-03-26 | 최현석 | commit | `89a0d51` | +388/-164 | 6 | 머지 완료 | 병합 후 Director/Lineup 정리 |
| 56 | 2026-03-27 | 최현석 | commit | `6b41ce2` | +233/-45 | 9 | 감독 푸터 네비게이션 연동 완료 | 감독 footer navigation 연동 |
| 57 | 2026-03-27 | 최현석 | merge | `0ca23b1` | +0/-0 | 0 | Merge pull request #18 from intel-app-project/choi | footer/navigation 작업 병합 |
| 58 | 2026-03-27 | 최현석 | commit | `52b5626` | +194/-281 | 20 | 안드로이드 버튼과 화면 겹치는 오류 수정, 캘린더에 오늘버튼 추가, | Android UI 겹침 수정, calendar today 버튼 |
| 59 | 2026-03-27 | 최현석 | commit | `30fecb0` | +7/-7 | 4 | 푸터 네비게이션에 팀정보 연동되는 링크 수정 | footer 팀 정보 링크 수정 |
| 60 | 2026-03-27 | 최대산 | commit | `de8dc0d` | +967/-533 | 7 | playerScheduleScreen 분할 | playerSchedule/myGame 화면 분리 |
| 61 | 2026-03-27 | 최현석 | commit | `bca5bf6` | +430/-304 | 5 | 테스트 편하도록 로그인 버튼 생성, playerDetailScreen UI 수정(타자,투수 관련) | 테스트 로그인과 선수 상세 UI 수정 |
| 62 | 2026-03-27 | 최현석 | merge | `c9248d1` | +0/-0 | 0 | Merge pull request #20 from intel-app-project/playerDetailScreen-UI-수정 | 선수 상세 UI PR 병합 |
| 63 | 2026-03-27 | 최현석 | merge | `e8905df` | +0/-0 | 0 | Merge pull request #19 from intel-app-project/DS_PSS | 최대산 playerSchedule 분리 PR 병합 |
| 64 | 2026-03-27 | 송형철 | commit | `587e6db` | +970/-212 | 20 | 홈/어웨이 라인업 분리 저장, ID 기반 식별 체계 전환(숫자형) 및 팀 정보 화면 구축 | 라인업 저장 구조와 팀 정보 화면 구축 |
| 65 | 2026-03-27 | 최현석 | commit | `35e7c67` | +304/-430 | 5 | Revert "Merge pull request #20 from intel-app-project/playerDetailScreen-UI-수정" | 선수 상세 UI 변경 revert |
| 66 | 2026-03-27 | 최현석 | commit | `f4b4768` | +132/-1 | 2 | 테스트 쉽도록 로그인 버튼 생성 | 테스트용 로그인 버튼 추가 |
| 67 | 2026-03-27 | 최현석 | merge | `177a436` | +0/-0 | 0 | Merge remote-tracking branch 'origin/song_0327' | 송형철 3/27 작업 병합 |
| 68 | 2026-03-27 | 최현석 | commit | `9a3e9b8` | +178/-283 | 15 | 감독 푸터와 선수 푸터 를 common 푸터로 수정 후 매칭 | Director/Player footer를 CommonFooter로 통합 |
| 69 | 2026-03-27 | 최현석 | commit | `099be16` | +81/-920 | 7 | 화면 정리 완료 | 중복/불필요 화면 정리 |
| 70 | 2026-03-29 | 최대산 | commit | `60232aa` | +1193/-919 | 10 | myGameScreen & playerScheduleScreen 병합 후, 정상 작동 확인 // myGameScreen 코드 리뷰 진행 | myGame과 playerSchedule 병합/리뷰 |
| 71 | 2026-03-30 | 최현석 | merge | `3535d3a` | +0/-0 | 0 | Merge pull request #22 from intel-app-project/DS_myGameScreen&PlayerScheduleScrre_merge | 최대산 myGame/playerSchedule 병합 PR |
| 72 | 2026-03-30 | 최대산 | commit | `55828a2` | +389/-132 | 5 | UI_UX_디자인_수정_1 | TeamInfo/myGame UI/UX 수정 |
| 73 | 2026-03-30 | 최현석 | commit | `903f517` | +265/-113 | 14 | stack.navigator에서 MainTabNavigator로 통합해서 stack 안되도록 | MainTabNavigator 중심 구조 통합 |
| 74 | 2026-03-30 | 최현석 | merge | `ac1cd7c` | +0/-0 | 0 | Merge remote-tracking branch 'origin/DS-UI_UX_디자인수정_1' | 최대산 UI/UX 브랜치 병합 |
| 75 | 2026-03-30 | 최대산 | commit | `996c003` | +167/-28 | 3 | leagueGameScreen에_이전경기기록과남은경기일정분할 | 리그 일정에서 이전/남은 경기 분리 |
| 76 | 2026-03-30 | 최대산 | commit | `32b0744` | +73/-18 | 3 | leagueGameScheduleScreen에대한UIUX수정완료 | 리그 일정 UI/UX 마감 |
| 77 | 2026-03-30 | 최현석 | commit | `4abb18a` | +54/-93 | 12 | 간단한 리팩토링 | frontend/backend 간단 리팩터링 |
| 78 | 2026-03-30 | 최현석 | merge | `7d3da76` | +0/-0 | 0 | Merge pull request #25 from intel-app-project/refactoring-for-supabase-data-update | Supabase 데이터 업데이트 리팩터링 병합 |
| 79 | 2026-03-30 | 최현석 | merge | `decfc35` | +0/-0 | 0 | Merge pull request #24 from intel-app-project/DS-AI_model_1 | 최대산 AI model 1차 브랜치 병합 |
| 80 | 2026-03-30 | 최현석 | commit | `cbb1a6e` | +197/-433 | 16 | 리팩토링과 캐릭터 아바타 그림 생성 | 화면/유틸 리팩터링과 아바타 생성 관련 변경 |
| 81 | 2026-03-30 | 최현석 | merge | `7056164` | +0/-0 | 0 | Merge pull request #26 from intel-app-project/refactoring-for-supabase | Supabase 리팩터링 병합 |
| 82 | 2026-03-30 | 송형철 | commit | `b7c5749` | +456/-117 | 9 | directorScheduleScreenUI를 playerScheduleScree과 동일화 | directorSchedule UI를 playerSchedule 스타일에 맞춤 |
| 83 | 2026-03-30 | 최현석 | merge | `9910aa0` | +0/-0 | 0 | Merge pull request #27 from intel-app-project/song_0330_5 | 송형철 directorSchedule UI PR 병합 |
| 84 | 2026-03-30 | 최현석 | commit | `27419f0` | +469/-427 | 20 | Revert "directorScheduleScreen.js UI 개선 작업입니다." | directorSchedule UI 변경 revert |
| 85 | 2026-03-30 | 송형철 | merge | `322ce4e` | +0/-0 | 0 | Merge pull request #28 from intel-app-project/revert-27-song_0330_5 | revert PR 병합 |
| 86 | 2026-03-30 | 송형철 | commit | `7b4c4b8` | +2/-4 | 1 | directorScheduleScreen.js UI 작업 | directorSchedule UI 후속 조정 |
| 87 | 2026-03-30 | 최현석 | merge | `5fd20e5` | +0/-0 | 0 | Merge remote-tracking branch 'origin/song_0330_5' into dev | 송형철 UI 작업을 dev에 병합 |
| 88 | 2026-03-30 | 최현석 | commit | `02939d3` | +192/-416 | 15 | 리팩토링과 캐릭터 아바타 그림 생성 | 리팩터링/아바타 관련 변경 |
| 89 | 2026-03-30 | 최현석 | commit | `3aaecd1` | +192/-416 | 15 | 리팩토링과 캐릭터 아바타 그림 생성 | 같은 성격의 리팩터링 후속 |
| 90 | 2026-03-30 | 최현석 | commit | `49e5e71` | +1451/-387 | 11 | feat: implement FastAPI backend with Supabase integration and initialize frontend screen navigation and styles | FastAPI/Supabase와 화면 navigation/style 재구성 |
| 91 | 2026-03-30 | 최현석 | merge | `721fa31` | +0/-0 | 0 | Merge branch 'dev' | dev 브랜치 병합 |
| 92 | 2026-03-31 | 최대산 | commit | `c485b4f` | +1061/-107 | 13 | PastMathes_FutureMatches분할및AI_review기능추가 | 이전/미래 경기 분리와 AI review 기능 |
| 93 | 2026-03-31 | 최현석 | commit | `929cfa8` | +0/-0 | 5 | gitignore추가 | gitignore 정리 |
| 94 | 2026-03-31 | 최현석 | commit | `16a2439` | +3/-4 | 1 | gitignore추가2 | gitignore 후속 정리 |
| 95 | 2026-03-31 | 최대산 | merge | `37ec1c9` | +0/-0 | 0 | Merge remote-tracking branch 'origin/dev' into DS-AI_model_review | dev를 AI review 브랜치에 병합 |
| 96 | 2026-03-31 | 최현석 | merge | `2a57afa` | +0/-0 | 0 | Merge pull request #32 from intel-app-project/DS-AI_model_review | 최대산 AI review PR 병합 |
| 97 | 2026-03-31 | 최대산 | commit | `d31f80a` | +175/-45 | 6 | 고장난것고침 | leagueGame/constants/backend 관련 수리 |
| 98 | 2026-03-31 | 최대산 | commit | `c7f43b9` | +867/-469 | 8 | leagueGameScheduleScreen_myGameScreen_playerScheduleScreen_UI_UX_수정 | 주요 선수/리그/내경기 화면 UI/UX 수정 |
| 99 | 2026-03-31 | 최현석 | commit | `9b33d11` | +816/-295 | 19 | feat: initialize React Native mobile app structure and implement FastAPI backend with Supabase integration (#34) | 앱 구조와 FastAPI/Supabase 통합 재정리 |
| 100 | 2026-03-31 | 송형철 | commit | `649dda1` | +87/-43 | 8 | teamInfoScreen에 로고 입력 및 managerScheduleScreen UI개선 (#33) | 팀 로고 입력과 managerSchedule UI 개선 |
| 101 | 2026-03-31 | 최현석 | commit | `34440f0` | +1/-2 | 1 | gitignore추가 | gitignore 추가 정리 |
| 102 | 2026-03-31 | 최현석 | commit | `2a722b6` | +5/-2 | 2 | fix: 로그아웃 기능 고침 | 로그아웃 기능 수정 |
| 103 | 2026-03-31 | 최현석 | commit | `4cc1e2d` | +1/-1 | 1 | fix: 기록원 페이지일때 로그아웃 가능하도록 | 기록원 페이지 logout 수정 |
| 104 | 2026-03-31 | 최대산 | commit | `050f699` | +807/-261 | 5 | directorScheduleScreen화면에_review_message_기능추가 | directorSchedule review message 기능 |
| 105 | 2026-03-31 | 최대산 | commit | `7720dc3` | +31/-148 | 4 | directorScheduleScreen_leagueGameScheduleScreen_화면수정_review기능추가 | directorSchedule/leagueGame 화면과 review 후속 수정 |
| 106 | 2026-03-31 | 최대산 | merge | `ddf4aac` | +0/-0 | 0 | Merge remote-tracking branch 'origin' into DS-code_review | DS-code_review에 origin 병합 |
| 107 | 2026-03-31 | 최대산 | merge | `c28d2a8` | +0/-0 | 0 | Merge remote-tracking branch 'origin/dev' into DS-code_review | DS-code_review에 dev 병합 |
| 108 | 2026-03-31 | 송형철 | commit | `44e985d` | +766/-150 | 4 | managerScheduleScreen.js UI 개선 (#35) | managerSchedule UI 대규모 개선 |
| 109 | 2026-03-31 | 최현석 | commit | `4a58374` | +28/-37 | 2 | feat: managerScheduleScreen에서 과거날짜등록 차단 및 간단한 UI 수정 | managerSchedule 과거 날짜 등록 차단 |
| 110 | 2026-03-31 | 최현석 | commit | `2daceb6` | +45/-23 | 3 | feat: AI 사진 생성 관련 기능 개선 | AI 사진 생성 기능 개선 |
| 111 | 2026-03-31 | 최대산 | commit | `47b4e9c` | +832/-352 | 17 | 고장난거 수리 | playerDetail/directorSchedule/backend review 등 안정화 |
| 112 | 2026-03-31 | 최대산 | merge | `39b2e99` | +0/-0 | 0 | dev 머지 완료 | dev 병합 완료 |
| 113 | 2026-03-31 | 최대산 | commit | `19cdade` | +1/-1 | 1 | Update prompt input format in playerDetailScreen | playerDetail prompt 입력 형식 수정 |
| 114 | 2026-03-31 | 최대산 | commit | `fc8907e` | +5/-10 | 1 | 진짜 머지 완료. | 최종 병합 후 playerDetail 조정 |
| 115 | 2026-04-01 | 최대산 | commit | `e90066d` | +3380/-172 | 8 | myGameScreen_usefocusEffect | myGameScreen focus 갱신과 보고서 문서 추가 |
| 116 | 2026-04-01 | 최대산 | commit | `a60c9b2` | +1/-1 | 1 | 구글API키문제해결 | Google API key 관련 설정 문제 해결 |
| 117 | 2026-06-05 | 최현석 | commit | `bc72656` | +3/-3 | 1 | Remove sensitive keys from .env file | 루트 `.env` 민감 키 제거 |
| 118 | 2026-06-05 | 최현석 | commit | `af9737f` | +1/-3 | 1 | Remove sensitive keys from .env file | `backend/.env` 민감 키 제거 |
| 119 | 2026-06-21 | 최현석 | commit | `51b633a` | +232/-0 | 1 | Initialize README with project details and setup | 프로젝트 README 작성 |

## 8. 발표/보고서용 기여 요약

### 최현석 발표 추천 파트

- 전체 시스템 구조와 브랜치 통합 과정
- FastAPI/Supabase 연동과 CSV 업로드 흐름
- 로그인/권한 분기와 공통 내비게이션 구조
- 선수 상세 화면과 AI 사진 생성 기능
- 보안 정리와 README 기반 사용 방법

### 최대산 발표 추천 파트

- 선수 일정 화면과 경기 상세 흐름
- myGameScreen과 리그 경기 일정 화면
- AI review 기능의 화면/백엔드 연결
- review message, prompt 입력 형식, UI/UX 개선
- 발표/보고용 Markdown 문서 구성

### 송형철 발표 추천 파트

- 감독 일정 CRUD와 managerSchedule 화면
- 예정 경기 라인업 구성
- 홈/어웨이 라인업 분리 저장과 ID 기반 식별
- 팀 정보 화면과 로고 입력
- managerSchedule UI 개선과 과거 날짜 등록 검증 연결부

## 9. 결론

커밋 기록 기준으로 보면 이 프로젝트는 짧은 집중 개발 기간 동안 세 명이 역할을 나눠 구현했다.

- 최현석은 저장소 통합, 백엔드 연결, 인증/권한, 공통 UI 구조, 보안/문서를 담당했다.
- 최대산은 선수 화면, 리그 일정, myGame, AI review, 보고서 문서를 담당했다.
- 송형철은 감독 일정, 라인업, 팀 정보, managerSchedule UI를 담당했다.

특히 `2026-03-24`부터 `2026-03-31`까지 기능 구현과 병합이 집중되었고, 이후 `2026-04-01`에는 기능 안정화, `2026-06-05`와 `2026-06-21`에는 공개/제출을 위한 보안 정리와 README 문서화가 진행되었다.
