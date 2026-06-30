# 개발노트

## 1. 프로젝트 주제 정하기

- 사회인 야구경기에서 감독이 경기에 뛸 선수들이 누구인지 확인하는 것이 아주 번거롭다.
- 현재는 카카오톡으로 투표를 올리지만 연락이 잘 안돼서 개별적으로도 연락을 돌리고 있음.
- 그래서 경기 스케줄을 미리 확인하고, 그 스케줄에 참석 여부를 체크하고, 그 현황을 감독이 볼 수 있게 하는 어플이 필요함.

## 2. 20260323

### Agile의 MoSCoW

#### Must

- 경기 일정 등록
- 경기 참석 여부 확인
- 라인업 확정
- 경기 일정 확인
- 참석 여부 제출
- 라인업 확인
- 선수 정보 등록·조회
- 경기 기록 저장·조회
- AI 라인업 추천 및 추천 이유 설명

#### Should

- 참석 마감 설정
- 참석 현황 자동 집계
- 포지션별 선수 조회
- 시즌 누적 기록 조회
- 출전 이력 조회
- 감독 수정 저장

#### Could

- 참석 알림
- 기록 시각화
- 감독 메모
- 경기 공지
- 개인 프로필 라인업 공유

#### Won't

- 영상 자동 분석
- 외부 시스템 연동
- 실시간 위치 공유
- 고급 스카우팅 분석
- 다국어 지원
- 커뮤니티 기능

### 2시 개발 방법론 수업

앞으로의 Daily Scrum 진행 방식:

- 데일리 스크럼을 위해서 간단한 보고서 작성
- 3Q: 지난 데일리 스크럼, 다음 데일리 스크럼, blocking(개인사정)
- 12시 직전 데일리 스크럼 예정
- 장애물은 따로 회의 이후 처리

## 3. 20260324

### 데일리 스크럼

| 3Q | 대산(APP) | 형철(Back) | 현석(Back, 스크럼 마스터) |
|---|---|---|---|
| Yesterday | 1. 로그인 화면 제작<br>2. `/upload-csv`에 전달되는 로직 작성 | 1. SupaBase 테이블 작성<br>2. FastApi 서버 구축 | 1. Supabase DB 구조 작성<br>2. 테스트용 시뮬레이션 데이터 제작 |
| Today | 1. 형철님 Supabase에 업로드 확인 | 1. `/upload-csv`로 데이터 받은 것을 형철님 Supabase에 업로드 로직 작성 | 1. Supabase DB 구조 작성<br>2. 테스트용 시뮬레이션 데이터 제작<br>3. 기본 백엔드에서 데이터 인풋/아웃풋 완성 |
| Blocking | 없음 | 1. Git이랑 연결이 안 되어 있다. | 없음 |

### 특이사항

#### Powershell conda 환경 문제

- Powershell에서 `conda activate fastapi` 해도 환경이 시작 안 됨.
- `cmd`에서는 되었다.

#### `.env` 파일 위치 문제

- `.env` 파일을 `backend` 폴더 안에 넣었더니 읽지 못했다.
- Root 폴더로 옮겨서 해결.

#### Git checkout 혼동

- Git에서 `origin/main`으로 checkout했는데, 이상한 파일들이 커밋해야 한다고 갑자기 생겼다.
- 방금까지 작업하던 브랜치로 다시 checkout했더니 또 원상복귀됨.
- 사실은 이전의 local main으로 갔던 것이다.

## 4. 20260325

### 데일리 스크럼

| 3Q | 대산(APP) | 형철(Back) | 현석(Back, 스크럼 마스터) |
|---|---|---|---|
| Yesterday | 1. 해당 선수 로그인하고 schedule 페이지 제작 | 1. 기록원이 경기내역 읽기/추가/삭제 기능 구현 | 1. 로그인 화면, 아이디에 따라서 감독/선수/기록원 페이지로 구분 |
| Today | 1. 하드코딩한 부분을 Supabase의 데이터를 받는 형식으로 수정 | 1. 기록원이 경기내역 수정 | 1. 선수가 일정 참석/불참석 체크<br>2. 감독이 선수 일정 종합해서 보는 페이지 |
| Blocking | 하드코딩한 부분을 Supabase로 연동하려고 하는데, 읽기가 막힘. | 머지 걱정 | 머지 걱정 |

### 점심 회고 수업

- 회고 수업을 듣고 3L(like, learned, lacked)를 작성하면서 우리 팀의 lacked를 토의하다가, 서로 코드의 merge를 걱정하는 것을 깨달았다.
- Merge를 걱정하는 이유는 서로의 기능 추가 시 UI가 겹치게 되는 것을 우려한 것이었다.
- 이러한 일이 발생하게 되는 이유는 UI 기획이 없이 선 기능 중심으로 만들다 보니 개인마다 UI를 기획해서 만들어서 충돌 나게 되었기 때문이다.
- 그래서 user UI의 전체 틀과 버튼을 눌러가며 이동하는 곳에 대한 UI 등, 유저 스토리를 생각하여 전체적인 UI를 기획하였다.

## 5. 화면 기획 및 와이어프레임

### 0p 로그인 화면

![0p 로그인 화면](<wireframe/0.PNG>)

이미지 경로: `wireframe/0.PNG`

### 선수 화면 흐름

#### 1-1p / 1-2p / 1-3p

![1-1p, 1-2p, 1-3p](<wireframe/1-1, 1-2, 1-3.PNG>)

이미지 경로: `wireframe/1-1, 1-2, 1-3.PNG`

#### 1-4p / 1-5p

![1-4p, 1-5p](<wireframe/1-4, 1-5.PNG>)

이미지 경로: `wireframe/1-4, 1-5.PNG`

#### 1-6p / 1-7p / 1-8p

![1-6p, 1-7p, 1-8p](<wireframe/1-6, 1-7, 1-8.PNG>)

이미지 경로: `wireframe/1-6, 1-7, 1-8.PNG`

### 감독 화면 흐름

#### 2-1p

![2-1p](<wireframe/2-1.PNG>)

이미지 경로: `wireframe/2-1.PNG`

#### 2-3p

![2-3p](<wireframe/2-3.PNG>)

이미지 경로: `wireframe/2-3.PNG`

#### 2-4p / 2-5p

![2-4p, 2-5p](<wireframe/2-4, 2-5.PNG>)

이미지 경로: `wireframe/2-4, 2-5.PNG`

#### 2-6p / 2-7p / 2-8p

![2-6p, 2-7p, 2-8p](<wireframe/2-6, 2-7, 2-8.PNG>)

이미지 경로: `wireframe/2-6, 2-7, 2-8.PNG`

#### 2-9p / 2-10p

![2-9p, 2-10p](<wireframe/2-9, 2-10.PNG>)

이미지 경로: `wireframe/2-9, 2-10.PNG`

### 기록원 화면 흐름

#### 3p

![3p 기록원 화면](<wireframe/3.PNG>)

이미지 경로: `wireframe/3.PNG`

## 6. 개발 중 특이사항 모음

### Supabase policy 문제

- API 호출에서 아주 간단한 POST 요청이었는데, 실제로 데이터가 있는 table이었는데도 빈 배열이 결과로 나오고 통신 결과는 200으로 정상으로 확인됨.
- Supabase에서 authenticator의 policies에서 table별로 permission을 allow 해야 했음.

### `readme.md`와 `README.md` 문제

- Antigravity 버그:
- `readme.md`랑 `README.md`가 둘 다 있었는데 하나만 잡혀서 하나를 삭제하면 뭘 삭제했는지 못 알아먹음.
- 그래서 좀비 같은 파일이 탄생함.
- 그래서 Git이 무한 commit에 빠짐.

### `--host 0.0.0.0` 문제

- `--host 0.0.0.0`을 안 써서 문제가 생김.
- Docs에서는 연결된 것처럼 보이는데 휴대폰에서는 연결 시간 초과가 떴음.

### HTTP method 문제

- 같은 API 주소를 써도 다른 HTTP method를 사용하면 보낼 수 있었다.
- method를 생략하면 자동으로 GET이 된다.

### `onNavigate` prop 문제

- 페이지?명 오른쪽에 `onNavigate`는 prop이었다.

## 7. 20260326

### 데일리 스크럼

| 3Q | 대산(APP) | 형철(Back) | 현석(Back, 스크럼 마스터) |
|---|---|---|---|
| Yesterday | 1. `playerScheduleScreen` 완성 | 1. `managerScheduleScreen` 완성 | 1. `managerScheduleScreen` 머지<br>2. `playerScheduleScreen` 머지 |
| Today | 1. `gameDetailScreen` 제작 | 1. `lineupScreen` 제작 | 1. 리팩토링 |
| Blocking | 1. 스케줄, 팀, 멤버에 관련된 스키마를 못 가져오고 있음. | 1. Supabase에서 데이터 못 가져오고 있음. | 어떤 식으로 컴포넌트 분할할지 고민 중 |

### 특이사항

#### 백엔드 서버 포트 문제

- 백엔드 서버 켰는데 안 됨.
- 포트가 백그라운드에서 사용되고 있었음.

#### 데이터 전처리 위치 변경

- 파이썬 파일로 하고 있었다.
- Supabase에서 App으로 데이터가 연동될 때의 무결성을 위해서 데이터 전처리를 `backend` 폴더에서 파이썬 파일을 만들어서 진행하고, 전처리가 진행된 이후의 데이터를 API로 app으로 보냈다.
- 그래서 타인원과 다른 방식으로 데이터 연동이 진행되고 있어서 코드 작업의 일관성을 위해 백엔드에서 진행되던 데이터 전처리 과정을 app으로 가져와서 JS 파일 안에서 진행되도록 했다.

#### JSX 주석 문제

- 주석을 태그 안에 쓰면 고장남.

## 8. 20260327

### 데일리 스크럼

| 3Q | 대산(APP) | 형철(Back) | 현석(Back, 스크럼 마스터) |
|---|---|---|---|
| Yesterday | 1. `leagueGameScheduleScreen` 제작<br>2. `playerScheduleScreen` 수정 | 1. `lineUpScreen` 제작<br>2. `lineUpScreen` UI 개선 | 1. 푸터 네비게이션<br>2. 앱 바(`commonHeader`)<br>3. Merge<br>4. 리팩토링(`useState` -> `navigate`) |
| Today | 1. `playerScheduleScreen` -> `myGameScreen`과 `playerScheduleScreen`으로 분할 | 1. 팀정보페이지를 따로 만들 예정(이름 안 지음) | 1. Merge<br>2. `playerDetailScreen` UI 수정<br>3. 리팩토링(`navigate` -> 부분 `useState`) |
| Blocking | 1. 지금까지 한 것이 기억이 잘 안 난다. -> 중간 정리가 부족한 것일 수 있다. | 1. UI가 바뀌면서 헷갈린다. -> 기획이 더 준비가 필요했을 것 같다.<br>2. Antigravity 토큰이 부족한 듯하다. | 1. 뇌용량 부족<br>2. 전두엽 비활성화<br>3. 매운 것 먹어서 매움 |

### 특이사항

- Antigravity 버그:
- Pull 받았더니 JS 파일명이 자꾸 소문자에서 대문자로 바뀌어 있음.

## 9. 20260330

### 데일리 스크럼

| 3Q | 대산(APP) | 형철(Back) | 현석(Back, 스크럼 마스터) |
|---|---|---|---|
| Yesterday | 1. `playerScheduleScreen.js`에 참석자만 나오도록 수정 및 리팩토링<br>2. `myGameScreen.js`의 라인업 카드를 `lineupScreen.js`의 베스트라인업 카드와 동일하게 변경 | 1. Schedule 테이블에 `away_lineup`, `home_lineup`으로 분리<br>2. `DirectorScheduleScreen`의 UI를 `PlayerScheduleScreen`에 맞춰서 구성 | 1. 머지<br>2. 네비게이션 바를 기존 stack 구성 대신 `createBottomTabNavigator`로 작성 |
| Today | 1. `leagueGameScheduleScreen.js`에 이전 경기 일정 추가<br>2. AI model 생성 | 1. `DirectorScheduleScreen` UI 개선 | 1. `dataCall.js`에서 Supabase에서 데이터 불러오는 query 로직 추상화 |
| Blocking | 1. 영성에 대해서 조사 중. | 1. 피곤 전이 | 1. 어제 밤에 2시까지 논문 쓰느라 너무 졸림 |

### 특이사항

- 오늘 3시부터 `dev` 브랜치 생성.
- 앞으로 PR은 `dev`로 merge될 수 있도록.

## 10. 20260331

### 데일리 스크럼

| 3Q | 대산(APP) | 형철(Back) | 현석(Back, 스크럼 마스터) |
|---|---|---|---|
| Yesterday | 1. Supabase에 `review` 테이블 생성<br>2. `reiview_logic.py`로 경기에 따른 리뷰 생성 로직 생성<br>3. 달력 부분 UI/UX 대공사(`myGameScreen`, `playerScheduleScreen`, `leagueScheduleScreen`) | 1. `directorScheduleScreen`의 UI를 `playerScheduleScreen`의 UI를 참고하여 수정<br>2. `teamInfoScreen`에 logo svg 등록(Supabase에 테이블) | 1. 선수별 이름에 따른 아바타 생성<br>2. AI 기능 추가: 경기 기록에 따른 특징으로 프롬프트 생성(Gemini) 및 그림 생성(Nano Banana), 다운로드 기능 |
| Today | 1. `directorScheduleScreen` UI/UX 수정 | 1. 기록원 페이지 UI/UX 개선 | 1. AI 이미지 생성 및 야구 카드 합성 시스템(백엔드)<br>2. UI/UX 및 인터랙션 강화(프론트엔드)<br>3. 권한 제어 및 보안(Access Control)<br>4. 안정성 개선 및 버그 수정 |
| Blocking | 1. 롤체 8등 = 큰 상실감 | 1. 날씨가 좋아서 나가고 싶음 | 1. 논문 못 써서 논문 생각 많이 남 |

## 11. 최현석 한 것 정리

### 1. AI 이미지 생성 및 야구 카드 합성 시스템(백엔드)

#### 멀티모달 Gemini-3 연동

- 선수의 아바타 이미지를 직접 분석하여 실제 사람 야구 선수의 외형과 특징을 가진 고해상도 이미지를 생성하도록 Imagen 4.0 프롬프트 엔진을 고도화했습니다.

#### 야구 카드 합성 엔진(`Pillow`)

- AI가 생성한 이미지 위에 선수 이름, 등번호, 팀 정보, 시즌 성적(타율, 홈런, 타점 등)을 오버레이하여 "디지털 야구 카드" 형태로 자동 합성하는 기능을 구현했습니다.
- 상단 뱃지("Baseball Team System")의 배경 박스 길이를 글자 수에 맞춰 자동으로 조절하는 등 디자인 디테일을 강화했습니다.

### 2. UI/UX 및 인터랙션 강화(프론트엔드)

#### 선수 카드 미리보기 모달

- 생성된 카드를 갤러리에 저장하기 전, 팝업창을 통해 최종 결과물을 확인하고 저장 여부를 결정할 수 있는 UX를 추가했습니다.

#### 전방위 내비게이션(Click-to-Detail) 구현

- 팀 정보 화면:
  - 야구장 UI 위의 포지션 슬롯과 하단 전체 멤버 리스트의 모든 선수를 클릭 가능하게 만들어 상세 페이지로 즉시 이동할 수 있게 했습니다.
- 내 경기(My Game) 화면:
  - 라인업 슬롯과 참석 선수 명단(Roster) 리스트에 클릭 기능을 추가하여 동료 선수의 정보를 바로 확인할 수 있도록 개선했습니다.

### 3. 권한 제어 및 보안(Access Control)

#### 프로필 소유권 확인 로직

- 로그인한 유저의 ID와 조회 중인 선수의 ID를 비교하는 `isOwner` 로직을 도입했습니다.

#### 조건부 버튼 렌더링

- 본인의 프로필에서만 "AI 카드 생성" 및 "재생성" 버튼이 나타나도록 하여, 타인이 함부로 남의 PR 카드를 수정할 수 없도록 제한했습니다.

#### 내비게이션 ID 전달

- 전체 앱 내비게이션 스택(`MainTabNavigator`)에서 로그인한 사용자의 ID(`loginId`)가 유실되지 않고 상세 페이지까지 안전하게 전달되도록 구조를 개선했습니다.

### 4. 안정성 개선 및 버그 수정

#### 로그인 스택 초기화

- 로그인 후 뒤로가기를 눌러도 로그인 화면으로 돌아가지 않도록 `navigation.reset()`을 적용하여 사용자 흐름을 매끄럽게 만들었습니다.

#### 백엔드 버그 수정

- `ask_gemini` 함수에서 발생하던 변수 미정의 오류(`NameError`, `contents_parts`)를 해결하고 멀티모달 프롬프트 구성 로직을 안정화했습니다.

#### 폰트 및 경로 설정

- 윈도우 환경에 맞는 한글 폰트(`malgunbd.ttf`) 및 서버 IP 상수를 정비하여 서비스 운영 환경을 구축했습니다.
