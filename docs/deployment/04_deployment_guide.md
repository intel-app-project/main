# BTS 배포 가이드: 로컬 서버에서 운영 환경으로 옮기기

> 경로 기준 업데이트: 리팩토링 이후 모바일 앱 실행 루트는 `apps/mobile`, FastAPI 백엔드 실행 루트는 `apps/api`다. 이 문서의 본문 중 과거 `app/`, `backend/` 경로가 나오면 각각 `apps/mobile`, `apps/api`로 읽는다.

## 0. 결론 먼저

이 프로젝트는 **“앱 전체를 그냥 Vercel에 올리면 끝”** 인 구조가 아니다.  
현재 저장소는 **Expo React Native 모바일 앱**과 **FastAPI 백엔드**가 같이 들어 있기 때문에, 현실적인 배포 방식은 아래처럼 **2단 분리**다.

- **백엔드(FastAPI)** → Vercel 또는 다른 Python 호스팅
- **모바일 앱(Android/iOS)** → Expo EAS Build 로 앱 바이너리 생성 및 배포

Vercel은 FastAPI 앱을 배포할 수 있고, FastAPI 앱은 Vercel에서 단일 Vercel Function으로 실행된다. 반면 Expo의 EAS Build는 Expo/React Native 프로젝트용 앱 바이너리를 만드는 공식 클라우드 빌드 서비스다. citeturn3view0L1661-L1664 citeturn4view1L1793-L1800 citeturn5view0L84-L108

---

## 1. 현재 프로젝트를 배포 관점에서 해석하면

### 현재 구조
- 모바일 앱: `app/`
- 백엔드 API: `backend/`
- DB: Supabase
- 외부 AI: Google Gemini / Imagen

### 권장 배포 구조
```mermaid
flowchart LR
    Mobile[Expo App (Android / iOS)] -->|HTTPS| API[FastAPI on Vercel]
    Mobile -->|Public client access| Supabase[(Supabase)]
    API --> Supabase
    API --> GoogleAI[Gemini / Imagen]
```

### 지금 상태 점수
- MVP 실행 가능성: `9/10`
- 로컬 시연 가능성: `9/10`
- 운영 배포 준비도: `4/10`

이 점수가 낮은 이유는 “기능이 없어서”가 아니라, **배포 전 정리해야 할 코드/환경 포인트가 명확히 남아 있기 때문**이다.

---

## 2. 배포 전에 먼저 고쳐야 할 것들

## 2-1. `API_BASE_URL` 하드코딩 제거 (`10/10`)
현재 `app/constants/commonConstants.js`:

```js
export const API_BASE_URL = "http://172.30.1.19:8000";
```

이 상태에서는
- 다른 네트워크
- 다른 팀원 기기
- 운영 서버
로 바뀌는 순간 앱이 바로 깨진다.

### 추천 수정
```js
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
```

Expo는 `EXPO_PUBLIC_` 접두사의 환경변수를 `.env` 에서 자동으로 로드해 JS 코드에서 사용할 수 있다. 단, 이 값은 앱 번들에 포함되므로 민감한 비밀값은 넣으면 안 된다. citeturn5view4L114-L145 citeturn5view4L231-L233

---

## 2-2. Supabase 설정 외부화 (`10/10`)
현재 `app/lib/supabase.js` 에 Supabase URL과 anon key가 코드에 직접 들어 있다.

```js
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

처럼 바꾸는 편이 낫다.

### 이유
- 환경 분리(dev / prod)가 쉬워진다.
- 팀원별 로컬 설정이 쉬워진다.
- 배포 파이프라인에서 값을 교체하기 쉽다.

주의:
- `EXPO_PUBLIC_` 변수는 공개값 전용이다.
- **Google API Key**, **Supabase service-role key** 같은 값은 절대 프론트에 두면 안 된다.

---

## 2-3. `.env` 파일 Git 정리 (`9/10`)
현재 루트와 `backend/` 안에 `.env` 파일이 존재한다.  
이 파일을 저장소에 남긴 채 배포하면 팀 운영상 리스크가 커진다.

### 권장 처리
- `.env` 를 Git 추적에서 제외
- 실제 배포 환경에서는
  - Vercel Project Environment Variables
  - EAS Environment
  로만 관리

---

## 2-4. 파일명 / import 대소문자 정리 (`9/10`)
현재 `MainTabNavigator.js` 는

```js
import BestMemberScreen from "../screen/bestMemberScreen";
```

처럼 import 하지만 실제 파일은 `BestMemberScreen.js` 다.

### 왜 위험한가
- Windows/macOS 로컬 개발에서는 지나갈 수 있다.
- Linux 기반 CI/CD / 배포 환경에서는 실패할 수 있다.

### 권장 수정
```js
import BestMemberScreen from "../screen/BestMemberScreen";
```

---

## 2-5. `backend/main.py` 분리 (`8/10`)
현재 `main.py` 에 일정/멤버/팀/리뷰/AI/CSV 업로드가 다 들어 있다.  
Vercel 배포 자체는 가능하지만, 운영 중 에러 추적과 유지보수는 어려워진다.

### 최소 권장 분리
- `routes/`
- `services/`
- `schemas/`

---

## 2-6. Windows 전용 폰트 경로 제거 (`8/10`)
`/api/make_card` 에서 Windows 폰트 경로를 직접 참조한다.

```python
font_path = "C:\\Windows\\Fonts\\malgunbd.ttf"
```

이 코드는 Linux 서버에서는 바로 깨질 가능성이 높다.

### 권장 방식
1. 리포지토리에 사용 가능한 폰트를 포함하거나
2. Linux에서 존재하는 폰트 후보를 순차 탐색하거나
3. 폰트가 없을 때도 레이아웃이 크게 깨지지 않게 fallback 설계

---

## 2-7. 앱 직접 Supabase 접근 vs FastAPI 경유 혼합 정리 (`8/10`)
현재 앱은
- 어떤 데이터는 Supabase 직접 조회
- 어떤 데이터는 FastAPI 경유
로 처리한다.

배포 후에는 아래를 먼저 결정해야 한다.

### 질문
1. 로그인도 FastAPI로 통일할 것인가?
2. 아니면 Supabase Auth 중심으로 갈 것인가?
3. 감사 로그 / 권한 검증은 어디서 할 것인가?

즉, 배포는 단순 “올리는 작업”이 아니라 **아키텍처 선택을 확정하는 작업**이기도 하다.

---

## 3. 배포 전략 추천

## 전략 A. 백엔드는 Vercel, 앱은 Expo EAS Build (`10/10`)
가장 현실적이다.

### 이유
- Vercel은 FastAPI 배포를 공식 지원한다. FastAPI 앱은 zero-configuration 으로도 배포 가능하고, `app.py`, `index.py`, `server.py`, `main.py` 같은 엔트리포인트의 top-level `app` 을 인식한다. Python runtime은 `src/`, `app/`, `api/` 디렉터리도 확인한다. citeturn3view0L1661-L1664 citeturn3view1L1663-L1675
- Expo EAS Build는 Expo/React Native 프로젝트의 Android/iOS 바이너리를 만드는 공식 호스팅 빌드 서비스다. `eas build --platform android`, `eas build --platform ios`, `eas build --platform all` 흐름으로 운영한다. citeturn5view0L100-L108 citeturn5view2L189-L214

### 전략 점수
- 구현 난이도: `7/10`
- 속도: `9/10`
- 운영 안정성: `8/10`

---

## 4. 백엔드를 Vercel에 올리는 방법

## 4-1. 가장 쉬운 방식: `backend/` 를 별도 Vercel 프로젝트로 배포
이 저장소 전체를 한 번에 올리기보다, **Vercel 프로젝트의 Root Directory를 `backend/` 로 잡는 방식**이 가장 안전하다.

### 왜 이 방식이 안전한가
- `backend/main.py` 에 이미 `app = FastAPI()` 가 있다.
- `backend/requirements.txt` 도 이미 있다.
- 프론트 `app/` 폴더와 충돌하지 않는다.

### 추천 절차
1. GitHub 저장소를 Vercel에 연결
2. Project Root Directory 를 `backend/` 로 지정
3. Environment Variables 등록
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `GOOGLE_API_KEY`
4. 배포
5. 배포 URL 확인
6. 앱의 `EXPO_PUBLIC_API_BASE_URL` 값을 해당 URL로 변경

---

## 4-2. 루트 전체를 올리고 싶다면: `api/index.py` 브리지 파일 추가
Vercel의 Python runtime 은 `api/` 디렉터리도 엔트리 후보로 찾는다. 따라서 루트에서 배포하고 싶다면 아래처럼 둘 수 있다. citeturn3view1L1666-L1675

### 예시
```python
# api/index.py
from backend.main import app
```

하지만 이 방식은 monorepo 탐지, 루트 설정, 불필요한 프론트 파일 포함까지 고려해야 하므로 **초기 배포는 `backend/` 별도 프로젝트 방식이 더 단순**하다.

---

## 4-3. Vercel 배포 시 주의할 점

### 1) FastAPI는 단일 Function이 된다
FastAPI 앱을 Vercel에 배포하면 애플리케이션이 **단일 Vercel Function** 으로 실행되고, Vercel Functions 제한을 따른다. citeturn4view1L1793-L1800

### 2) 번들 크기 제한
FastAPI 앱은 단일 번들로 패키징되며 **500MB 제한** 안에 들어와야 한다. citeturn4view1L1798-L1800

### 3) 서버리스 성격을 고려해야 한다
이미지 처리, 대형 파일 처리, 오래 걸리는 작업이 많아지면 Vercel보다 다른 호스팅(Render/Railway/Fly.io 등)이 더 편할 수도 있다.

### 4) CORS
현재 `allow_origins=["*"]` 이다.  
운영에서는 앱/웹 도메인만 허용하도록 좁히는 것이 좋다.

---

## 5. 앱을 Expo EAS Build로 배포하는 방법

Expo EAS 는 Build, Submit, Hosting, Update 등을 제공한다. 여기서 BTS에 직접 필요한 것은 **Build** 와 이후의 **Submit / Update** 다. citeturn5view3L92-L95

## 5-1. 앱 코드 정리
`app/` 안에서 다음을 먼저 반영한다.

### `commonConstants.js`
```js
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
```

### `lib/supabase.js`
```js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### `.env`
```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Expo CLI는 `EXPO_PUBLIC_` 접두사의 변수를 `.env` 에서 자동으로 읽는다. citeturn5view4L114-L145

---

## 5-2. EAS 초기 설정

```bash
cd app
npm install
npx eas login
npx eas build:configure
```

이후 `eas.json` 이 생성되면 build profile을 정리한다.

### 예시
```json
{
  "build": {
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## 5-3. Android / iOS 빌드

### Android
```bash
npx eas build --platform android
```

### iOS
```bash
npx eas build --platform ios
```

### 둘 다
```bash
npx eas build --platform all
```

공식 문서 기준으로 EAS Build 는 installable binaries 를 생성한다. Android/iOS 모두 클라우드 빌드가 가능하다. citeturn5view0L100-L108

---

## 5-4. 스토어 배포 전 알아둘 점

- Google Play 배포에는 Google Play Developer 계정이 필요하다.
- Apple App Store 배포에는 Apple Developer Program 계정이 필요하다. citeturn3view3L182-L188

즉, “빌드는 가능” 과 “스토어에 올릴 수 있음” 은 다른 문제다.

---

## 5-5. 배포 후 빠른 수정
EAS Update 는 앱 스토어 재배포 없이 작은 JS 수정사항을 빠르게 배포하는 용도로 쓸 수 있다. EAS 환경변수를 쓸 때는 `--environment` 플래그를 같이 쓰는 편이 맞다. citeturn5view3L95-L95 citeturn3view5L151-L158

### 예시
```bash
npx eas update --environment production
```

---

## 6. 웹 버전도 만들고 싶다면

이 프로젝트는 현재 **React Navigation 기반 모바일 앱**이다.  
그래서 “웹도 그냥 같이 올리자”는 접근은 우선순위가 낮다.

### 이유
- 지금 핵심 사용처는 모바일이다.
- `expo-media-library`, 모바일 저장 흐름, 기기 중심 UX가 많다.
- 웹 전용 QA를 따로 해야 한다.

Expo 공식 문서에서는 웹 배포 시 `npx expo export -p web` 또는 `npx expo export --platform web` 로 빌드한 뒤, EAS Hosting 또는 third-party hosting 을 사용할 수 있다고 설명한다. 다만 EAS Hosting 소개는 **Expo Router + React Native web** 웹 프로젝트를 중심으로 설명한다. citeturn3view7L143-L170 citeturn3view8L84-L113 citeturn3view9L62-L86

### 그래서 BTS 기준 추천
- 1단계: 모바일 배포 먼저
- 2단계: 필요하면 웹 전환 검토
- 3단계: 그때 `expo web` 대응성과 화면 반응형 문제 해결

### 웹 배포 점수
- 지금 당장 우선순위: `3/10`
- 나중 확장 가치: `6/10`

---

## 7. 실제 적용 순서(추천)

## Step 1. 백엔드만 먼저 배포 (`10/10`)
- `backend/` 를 Vercel 프로젝트로 배포
- env 등록
- `/api/schedule`, `/api/review/{id}` 테스트

## Step 2. 앱 환경변수화 (`10/10`)
- `API_BASE_URL` / Supabase 값 외부화
- 하드코딩 제거

## Step 3. Android 내부 배포 (`9/10`)
- `eas build --platform android`
- 팀원 기기에서 설치 테스트

## Step 4. iOS 필요 여부 판단 (`6/10`)
- 사용자층이 iPhone까지 필요한지 확인
- 필요 시 iOS 빌드

## Step 5. 운영형 리팩터링 (`8/10`)
- CORS 제한
- 폰트 경로 수정
- 백엔드 라우터 분리
- 인증 정책 정리

---

## 8. 추천 체크리스트

### 배포 전
- [ ] `API_BASE_URL` 환경변수화
- [ ] Supabase config 외부화
- [ ] `.env` Git 추적 제거
- [ ] `BestMemberScreen` import 대소문자 수정
- [ ] Windows 전용 폰트 경로 제거
- [ ] 백엔드 env 등록값 정리

### 백엔드 배포 후
- [ ] Vercel URL에서 `/` 응답 확인
- [ ] `/api/schedule` 응답 확인
- [ ] `/api/review/{id}` 응답 확인
- [ ] CORS 테스트

### 앱 배포 전
- [ ] 실제 운영 API URL 연결
- [ ] Android 기기 테스트
- [ ] 이미지 생성/갤러리 저장 테스트
- [ ] 네트워크 오류 처리 확인

---

## 9. 서비스 선택 점수

### Vercel + EAS 조합
- 속도: `9/10`
- 초반 설정 단순성: `8/10`
- 현재 구조 적합성: `8/10`

### Render / Railway + EAS 조합
- 속도: `8/10`
- Python 서버 운영 편의성: `9/10`
- 현재 구조 적합성: `8/10`

### “모든 걸 한 번에 한 서비스에서” 시도
- 단순해 보이는 정도: `7/10`
- 실제 성공 확률: `4/10`

핵심 판단:
- **BTS는 백엔드와 모바일 앱의 배포 단위를 분리하는 순간 훨씬 쉬워진다.**

---

## 10. 최종 추천

가장 현실적인 경로는 아래다.

1. `backend/` 를 먼저 Vercel에 올린다.
2. 앱의 URL/설정을 환경변수로 바꾼다.
3. `app/` 는 EAS Build로 Android 내부 배포부터 시작한다.
4. 실제 사용자 테스트를 통과하면 스토어 배포를 준비한다.

즉, 이 프로젝트의 배포 핵심은  
**“Vercel에 올리는 법” 자체보다, “무엇을 Vercel에 올리고 무엇을 EAS로 빌드할지 분리하는 판단”** 이다.
