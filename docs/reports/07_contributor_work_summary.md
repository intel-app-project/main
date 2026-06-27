# BTS 기여자별 작업 정리

## 0. 정리 기준

이 문서는 **Git 기록 기준**으로 정리했다.  
즉, 아래를 근거로 삼았다.

- `git shortlog -sne --all`
- `git log --all --no-merges`
- 커밋 메시지
- 자주 수정한 파일
- 브랜치 이름 흔적

그래서 이 문서는 **“누가 어떤 코드를 만졌는지에 대한 저장소 근거”** 에 강하고,  
반대로 **회의/구두 의사결정/화면 구상 기여 시간** 은 100% 반영하지 못할 수 있다.

---

## 1. ID 매핑

Git 작성자명이 통일되어 있지 않아서 먼저 묶어야 한다.

### 최현석
- `Choi Hyunseok <testwelltest01@gmail.com>`
- `CHOI HYUN SEOK <testwelltest01@gmail.com>`

### 송형철
- `totsong2_max <totsong2@gmail.com>`
- `Hyung Cheol Song <totsong2@gmail.com>`
- `totsong <totsong2@gmail.com>`

### 최대산
- `Tester <cds0220@naver.com>`
- `DSanyC <cdsan0220@gmail.com>`

이 문서에서는 위 ID를 각각 한 사람으로 통합해 정리했다.

---

## 2. 커밋 요약

| 기여자 | GitHub / Git ID | 역할 | 전체 커밋 수 | non-merge 커밋 수 | merge 성격 커밋 수 | 활동 기간 |
|---|---|---|---:|---:|---:|---|
| 최현석 | `testwelltest01` | Scrum Master | 70 | 45 | 25 | 2026-03-18 ~ 2026-03-31 |
| 송형철 | `totsong2-max` | 팀원 | 18 | 16 | 2 | 2026-03-19 ~ 2026-03-31 |
| 최대산 | `DSanyC` / `Tester` | 팀원 | 36 | 31 | 5 | 2026-03-18 ~ 2026-03-31 |

### 해석
- **최현석**: 통합/머지 비중이 높다. Scrum Master 역할과 잘 맞는다.
- **송형철**: 일정 관리 / 라인업 / 팀 정보 쪽 구현 흔적이 뚜렷하다.
- **최대산**: 선수 일정 / 리그 일정 / MyGame / 리뷰 기능 / UI 수정 쪽 흔적이 크다.

---

## 3. 전체 역할 해석

| 기여자 | 핵심 작업군 | 근거 강도 |
|---|---|---:|
| 최현석 | 초기 세팅, FastAPI+Supabase 연동, 로그인/권한 분기, 공통 네비게이션, 선수 상세, 일부 리팩터링, 머지/충돌 해결 | 10 |
| 송형철 | 일정 CRUD, 감독 일정, 라인업 저장 구조, 홈/원정 분리, 팀 정보/로고, managerSchedule UI | 9 |
| 최대산 | playerSchedule, leagueGameSchedule, myGame, UI/UX, review 기능, directorSchedule review flow | 9 |

근거 강도 점수 의미:
- `10` = 커밋 메시지와 파일 수정 대상이 거의 직접 일치
- `9` = 커밋 메시지 + 파일 흔적이 매우 강함
- `7~8` = 간접 추정이 일부 포함

---

## 4. 최현석(testwelltest01) 작업 정리

## 4-1. 역할 요약
- Scrum Master
- 통합 담당
- 인증/권한 분기 및 공통 구조 중심
- 선수 상세/프로필/AI 카드 관련 비중 큼
- 후반부 머지 및 충돌 정리 흔적 큼

### 총평 점수
- 구현 기여 폭: `10/10`
- 통합/관리 기여: `10/10`
- 발표 적합 파트 소유권: `10/10`

---

## 4-2. 직접 확인되는 대표 커밋

| 날짜 | 커밋 | 메시지 | 해석 |
|---|---|---|---|
| 2026-03-18 | `69ba516` | 초기화 | 프로젝트 초기 세팅 시작 |
| 2026-03-19 | `e9a8347` | pr template 작성 | 협업 문서/PR 프로세스 세팅 |
| 2026-03-24 | `924f1c1` | fastapi에서 supabase data get 확인 | FastAPI-Supabase 연결 검증 |
| 2026-03-24 | `03f32cc` | 백엔드와 앱 기초 확립 | 앱-백엔드 초기 골격 형성 |
| 2026-03-24 | `3ad18d9` | 경기 기록 csv업로드 및 supabase db반영 | CSV 업로드 백엔드 연결 작업 |
| 2026-03-25 | `7d3ba22` | supabase 로그인 연동 및 권한별 화면 접근 기능 구현중 | 로그인/권한 분기 구축 |
| 2026-03-25 | `9dc6131` | supabase 로그인 연동 및 권한별 화면 접근 기능 구현중 | 로그인/권한 분기 후속 |
| 2026-03-26 | `ac9eed0` | 선수 경기 일정 참 불참 여부 캘린더 및 리스트, supabase 연동 | playerSchedule 핵심 기능 |
| 2026-03-26 | `a0c3e07` | 선수 프로필 페이지 완성 | playerDetail 핵심 |
| 2026-03-27 | `86ddfbf` | 푸터 네비게이션바 생성 | 공통/역할별 푸터 시작 |
| 2026-03-27 | `6b41ce2` | 감독 푸터 네비게이션 연동 완료 | 감독용 네비게이션 연결 |
| 2026-03-27 | `9a3e9b8` | 감독 푸터와 선수 푸터 를 common 푸터로 수정 후 매칭 | CommonFooter 통합 |
| 2026-03-30 | `903f517` | stack.navigator에서 MainTabNavigator로 통합해서 stack 안되도록 | 네비게이션 구조 리팩터링 |
| 2026-03-30 | `3aaecd1` | 리팩토링과 캐릭터 아바타 그림 생성 | UI/리팩터링 |
| 2026-03-31 | `4a58374` | managerScheduleScreen에서 과거날짜등록 차단 및 간단한 UI 수정 | 일정 등록 검증 강화 |
| 2026-03-31 | `2daceb6` | AI 사진 생성 관련 기능 개선 | AI 카드 기능 후반 개선 |

---

## 4-3. 많이 손댄 파일(대표)

- `app/screen/playerDetailScreen.js`
- `app/screen/playerScheduleScreen.js`
- `app/screen/lineupScreen.js`
- `app/screen/loginScreen.js`
- `app/navigation/MainTabNavigator.js`
- `app/components/CommonFooter.js`
- `app/utils/scheduleUtils.js`
- `app/screen/myGameScreen.js`
- `backend/main.py`

### 해석
이 파일 분포를 보면 최현석님의 기여는 **특정 한 화면**보다는  
**앱의 중심 구조와 공통 로직, 통합 지점**에 많이 걸쳐 있다.

---

## 4-4. 구체적으로 맡았다고 볼 수 있는 작업

### A. 인증/권한 분기 (`10/10`)
근거:
- 로그인 연동 커밋
- `loginScreen.js`
- `MainTabNavigator.js`

정리:
- `member` 테이블 기반 로그인
- 역할별 화면 진입 분기
- 테스트 로그인/매니저 로그인 지원

---

### B. 공통 네비게이션/푸터 구조 (`10/10`)
근거:
- 푸터 네비게이션 생성/통합 커밋
- `CommonFooter.js`
- `MainTabNavigator.js`

정리:
- 감독/선수 역할별 탭 구조 분리
- 공통 footer 로 UI/동작 통합
- 스택/탭 내비게이션 리팩터링

---

### C. 선수 일정 / 참석 기능의 주요 연결부 (`9/10`)
근거:
- `선수 경기 일정 참 불참 여부 캘린더 및 리스트` 커밋
- `playerScheduleScreen.js`
- `scheduleUtils.js`

정리:
- 캘린더 기반 참석 상태 UI
- status 반영 로직
- 일정 유틸 정리

---

### D. 선수 상세 / 개인 기록 / AI PR 카드 (`10/10`)
근거:
- `선수 프로필 페이지 완성`
- `AI 사진 생성 관련 기능 개선`
- `playerDetailScreen.js`

정리:
- 타자/투수 성적 계산 화면
- 리뷰 표시
- PR 이미지 생성 및 카드 생성 기능 강화

---

### E. 통합/머지/충돌 해결 (`10/10`)
근거:
- 전체 커밋 수 대비 merge 계열 비중이 높음
- Scrum Master라는 사용자 설명과 일치
- 프로젝트 후반 merge commits 다수

정리:
- 초기에는 `main` 기반 머지 충돌 해결
- 후반에는 `dev` 기반으로 브랜치 전략 전환 관리
- 저장소 상태를 합쳐 나가는 역할이 컸음

---

## 4-5. 발표에서 최현석님이 맡으면 가장 좋은 파트

| 발표 파트 | 적합도 |
|---|---:|
| 문제 정의 / 전체 구조 | 10 |
| 로그인 / 권한 / 네비게이션 | 10 |
| 통합 구조 / 혼합 아키텍처 회고 | 10 |
| 배포 / 개선 방향 | 10 |
| playerDetail / AI 카드 | 9 |

---

## 5. 송형철(totsong2-max) 작업 정리

## 5-1. 역할 요약
- 일정 관리 화면과 CRUD
- 감독 일정 화면
- 라인업 저장 구조
- 홈/원정 라인업 분리
- 팀 정보 / 팀 로고 반영
- managerScheduleScreen UI 개선

### 총평 점수
- 기능 집중도: `10/10`
- 일정/라인업 축 기여: `10/10`
- 발표 적합 파트 소유권: `9/10`

---

## 5-2. 직접 확인되는 대표 커밋

| 날짜 | 커밋 | 메시지 | 해석 |
|---|---|---|---|
| 2026-03-19 | `02caa59` | 첫 readme 파일 생성 | 초기 문서 작업 |
| 2026-03-24 | `9b0f43b` | 관리자가 csv 파일 업로드 한것 받을수 있도록 환경설정 | CSV 관련 환경 작업 |
| 2026-03-24 | `174d665` | 경기 데이터 읽기 기능 추가 | 백엔드/데이터 조회 기초 |
| 2026-03-25 | `290a897` | 스케줄 화면 추가 및 백엔드 스키마 수정 | schedule 기능 기반 |
| 2026-03-25 | `ba207bf` | 경기 일정 관리 CRUD 작업 완료 | managerSchedule 핵심 기능 |
| 2026-03-26 | `3f6b4fe` | 팀 감독이 예정된 경기 라인업 구성하는 기능 | lineup 기능 핵심 |
| 2026-03-27 | `587e6db` | 홈/어웨이 라인업 분리 저장, ID 기반 식별 체계 전환(숫자형) 및 팀 정보 화면 구축 | 구조 설계 강한 커밋 |
| 2026-03-30 | `b7c5749` | directorScheduleScreenUI를 playerScheduleScree과 동일화 | 감독 일정 UI |
| 2026-03-30 | `7b4c4b8` | directorScheduleScreen.js UI 작업 | 감독 일정 UI 후속 |
| 2026-03-31 | `0cf2be0` | teamInfoScreen에 로고 입력 및 managerScheduleScreen UI개선 | 팀 로고 / UI |
| 2026-03-31 | `649dda1` | teamInfoScreen에 로고 입력 및 managerScheduleScreen UI개선 (#33) | PR 반영 |
| 2026-03-31 | `f47809b` | managerScheduleScreen.js UI 개선 | 일정 관리 화면 후반 개선 |
| 2026-03-31 | `44e985d` | managerScheduleScreen.js UI 개선 (#35) | PR 반영 |

---

## 5-3. 많이 손댄 파일(대표)

- `app/screen/managerScheduleScreen.js`
- `app/screen/managerScheduleScreen.styles.js`
- `app/screen/lineupScreen.js`
- `app/screen/directorScheduleScreen.js`
- `app/screen/teamInfoScreen.js`
- `app/screen/teamInfoScreen.styles.js`
- `backend/main.py`

### 해석
송형철님의 작업은 분명하게  
**“일정 관리 / 감독 일정 / 라인업 / 팀 정보”** 축으로 모인다.

---

## 5-4. 구체적으로 맡았다고 볼 수 있는 작업

### A. 기록원 일정 CRUD (`10/10`)
근거:
- `경기 일정 관리 CRUD 작업 완료`
- `managerScheduleScreen.js` 주 수정자
- 후반 UI 개선 커밋 다수

정리:
- 일정 등록
- 일정 수정
- 일정 삭제
- 날짜/팀 선택 UX
- 유효성 검증 보강

---

### B. 감독 라인업 기능 (`10/10`)
근거:
- `팀 감독이 예정된 경기 라인업 구성하는 기능`
- `home/away 라인업 분리 저장` 커밋
- `lineupScreen.js`

정리:
- 특정 경기 라인업 편성 기능
- 홈/원정 별 라인업 저장 구조 분리
- ID 기반 식별 방식 전환

---

### C. 감독 일정 화면 (`9/10`)
근거:
- `directorScheduleScreen UI 작업`
- `directorScheduleScreenUI를 playerScheduleScree과 동일화`

정리:
- 감독 일정 화면 UI 구현 및 정리
- 일정 관리 흐름을 감독 시점에 맞게 연결

---

### D. 팀 정보 / 로고 / 베스트 멤버 기반 화면 (`9/10`)
근거:
- `teamInfoScreen에 로고 입력`
- `팀 정보 화면 구축`

정리:
- 팀 로고/정보 표시
- 팀 화면 구조 정리
- 감독이 팀 단위 데이터를 볼 수 있는 화면 기반 마련

---

## 5-5. 구조적으로 의미 있는 커밋

### `587e6db`
이 커밋은 설명력이 크다.

포함된 키워드:
- 홈/어웨이 라인업 분리 저장
- ID 기반 식별 체계 전환
- 팀 정보 화면 구축

즉, 단순 UI 수정이 아니라 **데이터 저장 구조와 식별 방식을 정리한 커밋**으로 볼 수 있다.

### 설계 영향 점수
- `10/10`

---

## 5-6. 발표에서 송형철님이 맡으면 가장 좋은 파트

| 발표 파트 | 적합도 |
|---|---:|
| 일정 CRUD | 10 |
| 감독 일정 화면 | 9 |
| 라인업 편성 / 저장 구조 | 10 |
| 팀 정보 / 로고 / 베스트 멤버 | 9 |
| 데이터 저장 구조 설명 | 9 |

---

## 6. 최대산(DSanyC / Tester) 작업 정리

## 6-1. 역할 요약
- 선수 일정 화면
- 리그 일정 화면
- MyGame 화면
- UI/UX 수정
- review 기능 추가
- directorSchedule 과 review message 연결
- playerDetail 프롬프트 관련 수정

### 총평 점수
- 화면 구현량: `10/10`
- 선수 UX 기여: `10/10`
- 리뷰/확장 기능 기여: `9/10`

---

## 6-2. 직접 확인되는 대표 커밋

| 날짜 | 커밋 | 메시지 | 해석 |
|---|---|---|---|
| 2026-03-18 | `5a13971` | Native 설치 | 초기 React Native 환경 준비 |
| 2026-03-24 | `4f2669a` | 로그인 화면, 기록자 업로드 화면, FastAPI 연결 확인 | 초기 화면/연결 검증 |
| 2026-03-24 | `bba098d` | MD 파일 생성 | 문서 작업 |
| 2026-03-25 | `79a6570` | playerScheduleScreen 페이지 추가, 페이지 상단 타이틀에 db 통한 이름 표시 | 선수 일정 화면 시작 |
| 2026-03-25 | `eddf668` | team/member/schedule 테이블 연동 확인 | 테이블 연결 확인 |
| 2026-03-25 | `6465c9f` | playerScheduleScreen 완성 | 선수 일정 핵심 |
| 2026-03-26 | `dd11be9` | 유저경기일정의 경기 상세 페이지 제작 | 경기 상세 / myGame 계열 |
| 2026-03-26 | `e2d8435` | 리그 경기 일정 페이지 제작 | leagueGameSchedule 기반 |
| 2026-03-27 | `de8dc0d` | playerScheduleScreen 분할 | 화면 정리 |
| 2026-03-29 | `1ee97c7` | myGameScreen & PlayerScheduleScreen 제작 | 두 핵심 화면 직접 구현 |
| 2026-03-29 | `60232aa` | myGameScreen & playerScheduleScreen 병합 후, 정상 작동 확인 | 통합 안정화 |
| 2026-03-30 | `996c003` | leagueGameScreen에 이전경기기록과 남은경기일정 분할 | 과거/미래 일정 분리 |
| 2026-03-30 | `32b0744` | leagueGameScheduleScreen UIUX 수정 완료 | 리그 일정 UX |
| 2026-03-31 | `c485b4f` | PastMatches_FutureMatches 분할 및 AI_review 기능 추가 | 일정 분리 + 리뷰 기능 |
| 2026-03-31 | `050f699` | directorScheduleScreen 화면에 review_message 기능 추가 | 감독 화면과 리뷰 연결 |
| 2026-03-31 | `7720dc3` | directorScheduleScreen_leagueGameScheduleScreen 화면수정 review 기능 추가 | 후속 정리 |
| 2026-03-31 | `19cdade` | Update prompt input format in playerDetailScreen | PR/프롬프트 관련 조정 |

---

## 6-3. 많이 손댄 파일(대표)

- `app/screen/playerScheduleScreen.js`
- `app/screen/leagueGameScheduleScreen.js`
- `app/screen/myGameScreen.js`
- `app/screen/playerDetailScreen.js`
- `app/screen/directorScheduleScreen.js`
- `backend/review_logic.py`
- `backend/review/service.py`
- `backend/main.py`

### 해석
최대산님의 작업은 **선수 시점 화면 + 경기 조회 화면 + 리뷰 기능**으로 집중된다.

---

## 6-4. 구체적으로 맡았다고 볼 수 있는 작업

### A. playerScheduleScreen 핵심 구현 (`10/10`)
근거:
- `playerScheduleScreen 페이지 추가`
- `playerScheduleScreen 완성`
- `playerScheduleScreen 분할`

정리:
- 선수 일정 화면 설계
- 캘린더/리스트 구성
- 상단 타이틀, 화면 흐름 정리
- 후속 분할 및 리팩터링

---

### B. MyGame / 경기 상세 계열 (`9/10`)
근거:
- `유저경기일정의 경기 상세 페이지 제작`
- `myGameScreen & PlayerScheduleScreen 제작`
- `병합 후 정상 작동 확인`

정리:
- 경기 상세 흐름
- MyGame 화면
- 일정 화면과의 연결

---

### C. LeagueGameSchedule 화면 (`10/10`)
근거:
- `리그 경기 일정 페이지 제작`
- `이전경기기록과 남은경기일정 분할`
- `UIUX 수정 완료`

정리:
- 리그 관점 일정/결과 화면
- 과거 경기 / 미래 경기 분리
- UI/UX 다듬기

---

### D. review 기능 / 감독 화면 연결 (`10/10`)
근거:
- `AI_review 기능 추가`
- `review_message 기능 추가`
- `review_logic.py`, `review/service.py` 수정 흔적

정리:
- 리뷰 기능 추가
- 종료 경기 기준 review message 생성 흐름 연결
- 감독 화면과 리뷰 생성 연동

---

### E. playerDetail 프롬프트 조정 (`8/10`)
근거:
- `Update prompt input format in playerDetailScreen`

정리:
- PR 카드/AI 프롬프트 입력 형식 보정
- playerDetail 기능 후반 수정

---

## 6-5. 발표에서 최대산님이 맡으면 가장 좋은 파트

| 발표 파트 | 적합도 |
|---|---:|
| 선수 일정 / 참석 UX | 10 |
| 리그 일정 / 과거-미래 분리 | 10 |
| MyGame 화면 | 9 |
| 리뷰 기능 / review message | 10 |
| AI PR 카드 후반 흐름 | 8 |

---

## 7. Scrum Master 관점 정리

사용자 설명 기준으로 **최현석님이 Scrum Master** 이고, Git 기록도 그 설명과 잘 맞는다.

### 근거
- 전체 커밋 수 최다
- merge 성격 커밋 비중 큼
- PR template 작성
- 공통 구조/통합/충돌 해결 흔적 다수

즉, 단순히 “코드를 많이 쓴 사람”이 아니라  
**프로젝트를 엮고 정리한 사람**으로 보는 것이 맞다.

### Scrum Master 역할 강도 점수
- `10/10`

---

## 8. 팀 단위 협업 해석

## 초반
- 각자 `main` 기반 개인 브랜치
- PR 후 Scrum Master가 conflict 해결

## 후반
- `dev` 브랜치 생성
- 개인 브랜치는 `dev` 에서 분기
- `dev` 를 개인 브랜치에 먼저 반영
- conflict 해결 후 `dev` 로 squash & merge

이 변화를 왜 같이 적느냐면,  
**개인 작업 정리와 협업 구조 정리는 분리되지 않기 때문**이다.

예를 들어:
- 최현석: 통합/머지/공통 구조
- 송형철: 일정/라인업 축 기능
- 최대산: 선수 화면/리뷰/UX 축 기능

이 세 흐름이 `dev` 체계 이후 더 잘 합쳐진 것으로 볼 수 있다.

---

## 9. 최종 정리표

| 기여자 | 한 줄 요약 | 핵심 파일 | 발표 추천 파트 |
|---|---|---|---|
| 최현석 | Scrum Master + 인증/네비게이션/통합/선수상세 중심 | `loginScreen.js`, `MainTabNavigator.js`, `CommonFooter.js`, `playerDetailScreen.js`, `backend/main.py` | 전체 구조, 권한 분기, 회고, 배포 |
| 송형철 | 일정 CRUD + 라인업 + 팀정보 축 | `managerScheduleScreen.js`, `lineupScreen.js`, `directorScheduleScreen.js`, `teamInfoScreen.js` | 일정 관리, 라인업, 팀정보 |
| 최대산 | 선수 일정 + 리그 일정 + MyGame + 리뷰 축 | `playerScheduleScreen.js`, `leagueGameScheduleScreen.js`, `myGameScreen.js`, `review_logic.py` | 선수 UX, 리그 일정, 리뷰 기능 |

---

## 10. 이 문서를 발표/보고서에 쓸 때 주의

### 1) “누가 얼마나 힘들게 했는가” 문서는 아니다
이건 Git 기록 문서다.

### 2) merge가 많다고 구현이 적은 게 아니다
특히 Scrum Master는 머지/정리 역할이 크게 잡힌다.

### 3) line-level 노동량보다 기능 ownership 중심으로 보는 편이 맞다
이번 프로젝트는 화면/기능 단위 ownership이 더 분명하게 보인다.

---

## 11. 최종 결론

### 최현석
- **프로젝트를 묶고 굴린 사람**
- 인증/네비게이션/공통 구조/선수 상세/통합/머지 담당 성격이 강함

### 송형철
- **일정과 라인업 구조를 만든 사람**
- 기록원 일정 관리, 감독 일정, 홈/원정 라인업 구조, 팀 정보 축이 강함

### 최대산
- **선수 시점 UX와 리뷰 기능을 끌고 간 사람**
- playerSchedule, myGame, leagueGameSchedule, review 흐름 기여가 큼

### 전체 평가
- 역할 분리 명확성: `9/10`
- Git 근거 일치성: `9/10`
- 발표 파트 배분 활용도: `10/10`

즉, 이 팀은 단순히 “셋이 같이 만들었다” 보다  
**각자 맡은 축이 비교적 뚜렷하게 보이는 팀**으로 정리할 수 있다.
