# BTS 앱 유저 플로우 정리 (Mermaid)

## 0. 전제

이 문서는 **현재 저장소의 구현 코드 기준**으로 작성했다.  
그래서 아래 두 가지는 구분해서 봐야 한다.

- **코드로 직접 확인된 흐름**
  - 로그인/역할 분기
  - 일정 조회
  - 참석/불참
  - 감독 라인업 구성
  - 팀 정보 / 베스트 멤버
  - 리뷰 생성
  - AI PR 카드 생성
- **기획 문서에는 있지만 현재 브랜치에서 UI까지 직접 확인되지 않은 흐름**
  - 앱 내부 CSV 업로드 화면
  - AI 라인업 추천

즉, 발표나 README에서는 **“기획”과 “현재 구현”을 분리해서 설명**하는 편이 정확하다.

---

## 1. 전체 서비스 흐름

```mermaid
flowchart TD
    A[앱 실행] --> B[LoginScreen]
    B --> C{로그인 방식}

    C -->|ID / 비밀번호 입력| D[Supabase member 조회]
    C -->|Quick Login| E[개발용 ID 선택]
    C -->|Manager Login| F[기록원 계정으로 직접 진입]

    D --> G{Primary_Position}
    E --> G
    F --> H[기록원 전용 진입]

    G -->|감독| I[감독 탭 구조 진입]
    G -->|선수| J[선수 탭 구조 진입]
    G -->|기록원| H

    subgraph DirectorFlow[감독 주요 흐름]
        I --> I1[MyGame: 팀 경기 / 현재 라인업 확인]
        I --> I2[DirectorSchedule: 팀 경기 일정 확인]
        I --> I3[TeamInfo: 팀 정보 / 베스트 멤버]
        I --> I4[PlayerDetail: 개인 상세 기록]

        I2 --> I21[예정 경기 선택]
        I21 --> I22[LineupScreen 이동]
        I22 --> I23[수비 배치]
        I23 --> I24[타순 배치]
        I24 --> I25[라인업 저장]

        I2 --> I26[종료 경기 선택]
        I26 --> I27[review message 생성]

        I3 --> I31[BestMemberScreen 이동]
        I31 --> I32[팀 베스트 멤버 저장]
    end

    subgraph PlayerFlow[선수 주요 흐름]
        J --> J1[MyGame: 내 팀 경기 / 라인업 확인]
        J --> J2[PlayerSchedule: 참석 관리]
        J --> J3[LeagueGameSchedule: 리그 일정 / 결과]
        J --> J4[TeamInfo: 팀 정보]
        J --> J5[PlayerDetail: 내 기록 / PR 카드]

        J2 --> J21[캘린더에서 경기 선택]
        J21 --> J22{참석 상태 선택}
        J22 -->|참석| J23[attendance 저장]
        J22 -->|불참| J24[attendance 저장]
        J22 -->|미응답| J25[attendance 초기화]

        J5 --> J51[최근 경기 / 시즌 기록 확인]
        J5 --> J52[리뷰 조회]
        J5 --> J53[AI 이미지 생성]
        J53 --> J54[PR 카드 저장]
    end

    subgraph RecorderFlow[기록원 주요 흐름]
        H --> H1[ManagerScheduleScreen]
        H1 --> H2[캘린더에서 날짜 선택]
        H2 --> H3[홈팀 / 원정팀 선택]
        H3 --> H4{입력 검증}

        H4 -->|과거 날짜| H5[등록 차단]
        H4 -->|동일 팀 선택| H6[등록 차단]
        H4 -->|정상 입력| H7[일정 등록 / 수정]

        H1 --> H8[기존 일정 편집]
        H1 --> H9[기존 일정 삭제]
    end
```

---

## 2. 로그인 및 권한 분기 흐름

```mermaid
flowchart TD
    A[사용자 앱 실행] --> B[로그인 화면]
    B --> C[ID / PW 입력 또는 테스트 로그인]

    C --> D[member 테이블 조회]
    D --> E{사용자 존재 여부}

    E -->|없음| F[오류 알림]
    E -->|있음| G{비밀번호 일치 여부}

    G -->|아니오| H[비밀번호 오류 알림]
    G -->|예| I{역할 확인}

    I -->|감독| J[MainTab - 감독 탭]
    I -->|선수| K[MainTab - 선수 탭]
    I -->|기록원| L[MainTab 내부 ManagerSchedule 직접 진입]

    J --> M[감독용 하단 푸터 표시]
    K --> N[선수용 하단 푸터 표시]
    L --> O[푸터 숨김]
```

핵심 포인트:
- 권한 분기는 **로그인 직후 바로 발생**
- 역할에 따라 **탭 개수와 진입 화면이 달라짐**
- 기록원은 사실상 “일정 관리 전용 사용자”처럼 동작

---

## 3. 선수 유저 플로우

```mermaid
flowchart TD
    A[선수 로그인] --> B[MyGame 화면]
    B --> C[다가오는 경기 확인]
    B --> D[현재 저장된 라인업 확인]
    B --> E[참석 로스터 / 벤치 확인]
    E --> F[선수 카드 클릭]
    F --> G[PlayerDetail 이동]

    A --> H[PlayerSchedule 화면]
    H --> I[캘린더에서 경기 날짜 확인]
    I --> J[경기 카드 선택]
    J --> K{참석 상태 선택}
    K -->|참석| L[PATCH attendance]
    K -->|불참| M[PATCH attendance]
    K -->|미응답| N[attendance 값 제거]
    L --> O[캘린더 / 리스트 UI 갱신]
    M --> O
    N --> O

    A --> P[LeagueGameSchedule 화면]
    P --> Q[과거 경기 결과 확인]
    P --> R[미래 경기 일정 확인]

    A --> S[TeamInfo 화면]
    S --> T[팀 로고 / 팀 설명 확인]
    S --> U[베스트 라인업 확인]
    S --> V[팀원 목록 확인]
    V --> G

    G --> W[타자 / 투수 성적 계산 결과 확인]
    G --> X[최근 5경기 확인]
    G --> Y[AI 리뷰 확인]
    G --> Z[PR 이미지 및 카드 생성]
    Z --> ZA[갤러리에 저장]
```

선수 입장에서 핵심 UX는 3개다.

1. **내가 어느 경기에서 뛸 수 있는지 먼저 표시한다.**
2. **감독이 저장한 라인업을 본다.**
3. **개인 기록과 AI 기반 PR 카드까지 소비한다.**

---

## 4. 감독 유저 플로우

```mermaid
flowchart TD
    A[감독 로그인] --> B[MyGame 화면]
    B --> C[가장 가까운 팀 경기 확인]
    B --> D[현재 라인업 / 벤치 상태 확인]

    A --> E[DirectorSchedule 화면]
    E --> F[내 팀 관련 경기만 우선 확인]
    F --> G{경기 상태}

    G -->|예정 경기| H[라인업 구성 버튼]
    H --> I[LineupScreen 이동]
    I --> J[참석 가능한 선수만 후보 표시]
    J --> K[수비 포지션 배치]
    K --> L[타순 배치]
    L --> M[라인업 저장]
    M --> N[MyGame 화면에서 재확인]

    G -->|종료 경기| O[review message 생성]
    O --> P[팀원별 리뷰 생성 / 갱신]

    A --> Q[TeamInfo 화면]
    Q --> R[현재 팀 베스트 라인업 확인]
    R --> S[관리하기]
    S --> T[BestMemberScreen 이동]
    T --> U[팀 베스트 멤버 수비 / 타순 설정]
    U --> V[best_member 저장]

    A --> W[PlayerDetail 화면]
    W --> X[선수 상세 성적 및 리뷰 확인]
```

감독 입장에서 핵심 UX는 4개다.

1. **참석 가능한 선수 확인**
2. **라인업 구성**
3. **팀 기준 베스트 멤버 관리**
4. **종료 경기 리뷰 생성**

---

## 5. 기록원 유저 플로우

```mermaid
flowchart TD
    A[기록원 로그인] --> B[ManagerScheduleScreen]
    B --> C[오늘 이후 일정 목록 확인]

    B --> D[달력에서 날짜 선택]
    D --> E[홈팀 선택]
    E --> F[원정팀 선택]
    F --> G{유효성 검사}

    G -->|과거 날짜| H[등록 거부]
    G -->|홈팀과 원정팀 동일| I[등록 거부]
    G -->|정상| J[POST 일정 등록]

    B --> K[기존 일정 선택]
    K --> L[수정 모드 진입]
    L --> M[PUT 일정 수정]

    K --> N[삭제 버튼]
    N --> O[DELETE 일정 삭제 표기]
```

현재 코드 기준으로 기록원 흐름은 **일정 CRUD** 중심이다.  
즉, 설명상 “리그 기록원 계정으로 일정 업로드” 문제를 풀기 위한 사용자로 이해할 수 있지만,  
실제 구현은 **수동 일정 등록/수정/삭제 도구**에 더 가깝다.

---

## 6. 참석 상태 업데이트 시스템 플로우

```mermaid
sequenceDiagram
    participant Player as 선수
    participant App as Expo App
    participant API as FastAPI
    participant DB as Supabase

    Player->>App: PlayerSchedule 화면 진입
    App->>API: GET /api/member/{id}
    App->>API: GET /api/schedule
    App->>API: GET /api/team
    API->>DB: member / schedule / team 조회
    DB-->>API: 조회 결과
    API-->>App: 경기 목록 + 팀 정보 + 사용자 정보

    Player->>App: 참석/불참/미응답 선택
    App->>API: PATCH /api/schedule/attendance
    API->>DB: schedule.home_member 또는 away_member JSON 수정
    DB-->>API: 수정 완료
    API-->>App: 최신 일정 반환
    App-->>Player: 뱃지 색상 / 캘린더 상태 갱신
```

이 흐름이 BTS의 문제 해결 핵심이다.  
감독이 한 명씩 연락하지 않아도, 선수들이 먼저 상태를 표시하면 된다.

---

## 7. 감독 라인업 저장 시스템 플로우

```mermaid
sequenceDiagram
    participant Director as 감독
    participant App as LineupScreen
    participant API as FastAPI
    participant DB as Supabase

    Director->>App: 특정 경기 라인업 화면 진입
    App->>API: GET /api/schedule/date/{targetDate}
    App->>API: GET /api/member
    API->>DB: schedule / member 조회
    DB-->>API: 조회 결과
    API-->>App: 경기 정보 + 선수 목록

    App->>App: 홈/원정 판별
    App->>App: 참석 가능한 선수만 후보화
    Director->>App: 수비 포지션 배치
    Director->>App: 타순 배치
    App->>App: 중복 배치 / DH / 투수 타순 규칙 검증

    Director->>App: 저장 클릭
    App->>API: POST /api/schedule/{date}/lineup?side=home|away
    API->>DB: home_lineup 또는 away_lineup 저장
    DB-->>API: 저장 완료
    API-->>App: 저장 성공
```

이 플로우는 발표에서 보여주기 좋다.  
이유는 단순 CRUD가 아니라 **규칙 검증이 들어간 편성 로직**이기 때문이다.

---

## 8. AI 리뷰 + PR 카드 생성 플로우

```mermaid
sequenceDiagram
    participant User as 사용자
    participant App as PlayerDetailScreen
    participant API as FastAPI
    participant DB as Supabase
    participant AI as Gemini/Imagen

    User->>App: 선수 상세 화면 진입
    App->>API: GET /api/review/{member_id}
    API->>DB: game / member / team / review 조회
    DB-->>API: 경기 데이터 / 기존 리뷰
    API-->>App: 리뷰 메시지 + 이슈 목록

    User->>App: PR 카드 생성 클릭
    App->>API: GET /api/gemini?prompt=...
    API->>AI: 리뷰와 아바타 기반 프롬프트 생성 요청
    AI-->>API: 이미지용 영어 프롬프트
    API-->>App: 프롬프트 결과

    App->>API: GET /api/banana?banana=...
    API->>AI: 이미지 생성 요청
    AI-->>API: base64 이미지
    API-->>App: base64 이미지 반환

    App->>API: POST /api/make_card
    API->>App: 카드 합성 이미지 반환

    App->>API: POST /api/member
    API->>DB: 생성 이미지 경로/정보 저장
    DB-->>API: 저장 완료
    API-->>App: 저장 성공

    App-->>User: 카드 미리보기 / 갤러리 저장
```

주의:
- 이 기능은 **재미와 차별화 측면에서는 강함**
- 하지만 **핵심 문제 해결(참석/라인업)** 과의 직접 연결성은 `6/10` 정도다.
- 그래서 발표에서는 “핵심 기능” 뒤에 “확장 기능”으로 배치하는 편이 좋다.

---

## 9. 화면 간 관계를 더 압축해서 보면

```mermaid
flowchart LR
    Login[Login] --> MyGame[MyGame]
    Login --> PlayerSchedule[PlayerSchedule]
    Login --> DirectorSchedule[DirectorSchedule]
    Login --> ManagerSchedule[ManagerSchedule]
    Login --> TeamInfo[TeamInfo]
    Login --> PlayerDetail[PlayerDetail]

    MyGame --> PlayerDetail
    TeamInfo --> PlayerDetail
    TeamInfo --> BestMember
    DirectorSchedule --> Lineup
    PlayerDetail --> Review[Review 조회]
    PlayerDetail --> PR[PR 카드 생성]
```

---

## 10. 발표에서 이 플로우를 말할 때의 포인트

### 가장 먼저 말할 흐름 (`10/10`)
- 기록원이 경기 일정 등록
- 선수가 참석 여부 체크
- 감독이 참석 가능한 선수로 라인업 구성

### 두 번째로 말할 흐름 (`9/10`)
- 감독이 종료 경기 기준 리뷰 생성
- 선수 상세 화면에서 개인 기록과 리뷰 확인

### 마지막에 말할 확장 흐름 (`7/10`)
- PR 카드 생성
- 이미지 저장

이 순서를 추천하는 이유는 간단하다.

- 앞부분은 **문제 해결 핵심**
- 뒷부분은 **프로젝트의 개성과 확장성**

즉, 발표도 유저 플로우처럼  
**핵심 문제 해결 흐름 → 운영 보조 흐름 → 확장 기능 흐름**  
순서로 가는 편이 가장 자연스럽다.
