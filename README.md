# Media Toolkit

로컬에서 실행하는 이미지 포맷 변환 도구입니다.
브라우저에서 드래그 앤 드롭으로 이미지를 올리고, 원하는 포맷으로 변환합니다.

## 빠른 시작

### 1. 사전 준비

**Node.js 18 이상**이 필요합니다. 설치 여부를 확인합니다.

```bash
node -v
# v18.x.x 이상이면 OK
```

설치되어 있지 않다면:

| OS | 설치 방법 |
|----|-----------|
| Windows | [nodejs.org](https://nodejs.org) 에서 LTS 다운로드 후 설치 |
| macOS | `brew install node` |
| Ubuntu/Debian | `sudo apt update && sudo apt install nodejs npm` |

### 2. 프로젝트 세팅

```bash
# 저장소 클론
git clone <repository-url>
cd media-toolkit

# 의존성 설치 (최초 1회)
npm install
```

### 3. 실행

```bash
npm start
```

터미널에 아래 메시지가 나오면 준비 완료입니다.

```
Media Toolkit running at http://localhost:3000
```

브라우저에서 `http://localhost:3000` 을 열면 됩니다.

### 4. 종료

터미널에서 `Ctrl + C` 를 누르면 서버가 종료됩니다.

---

## 사용법

### 파일 업로드

두 가지 방법 중 하나를 선택합니다.

- 브라우저 화면에 이미지 파일을 **드래그 앤 드롭**
- 화면의 **browse** 링크를 클릭하여 파일 선택

### 파일 정보 확인

업로드가 완료되면 다음 정보가 표시됩니다.

| 항목 | 설명 |
|------|------|
| Name | 원본 파일명 |
| Format | 현재 이미지 포맷 (PNG, JPG 등) |
| Size | 원본 파일 용량 |
| Dimensions | 가로 x 세로 픽셀 |

### 포맷 변환

업로드 후 아래에 변환 가능한 포맷 카드가 나열됩니다.

| 포맷 | 특징 |
|------|------|
| **PNG** | 무손실 압축. 투명도 지원. 용량 큼 |
| **JPG** | 손실 압축. 사진에 적합. 용량 작음 |
| **WebP** | 손실/무손실 모두 지원. 웹 최적화 |
| **AVIF** | 최신 포맷. 압축률 최고. 변환 느림 |
| **TIFF** | 비압축. 인쇄/편집용. 용량 매우 큼 |

각 카드에는 **예상 용량**, **예상 감소율(%)**, **예상 소요 시간**이 표시됩니다.

1. 원하는 포맷의 **체크박스**를 클릭 (복수 선택 가능)
2. **Convert Selected** 버튼 클릭
3. 변환 완료 후 **Download** 버튼으로 파일 저장

### 파일 이름 설정

Prefix와 Postfix 입력란으로 출력 파일명을 조절할 수 있습니다.

```
Prefix: thumb_     Postfix: _small
원본: photo.png  →  출력: thumb_photo_small.webp
```

입력과 동시에 미리보기가 갱신됩니다.

---

## 프로젝트 구조

```
media-toolkit/
├── server.js           # Express 서버, 업로드/변환/다운로드 API
├── package.json        # 프로젝트 설정 및 의존성
├── public/
│   ├── index.html      # 메인 페이지
│   ├── style.css       # 다크 테마 스타일
│   └── app.js          # 프론트엔드 로직
├── uploads/            # 업로드 임시 저장 (자동 생성)
└── output/             # 변환 결과 저장 (자동 생성)
```

## API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/upload` | 이미지 업로드 + 메타데이터/예상치 반환 |
| POST | `/api/convert` | 업로드된 파일을 선택한 포맷으로 변환 |
| GET | `/api/download/:filename` | 변환된 파일 다운로드 |

## 기술 스택

| 구성 | 라이브러리 |
|------|------------|
| 서버 | Express |
| 이미지 처리 | sharp (libvips 기반) |
| 파일 업로드 | multer |
| 프론트엔드 | Vanilla HTML/CSS/JS |

## 로드맵

- [ ] 다중 파일 업로드 (배치 변환)
- [ ] 이미지 리사이즈 옵션
- [ ] 영상 포맷 변환 (ffmpeg 연동)
- [ ] AI 기반 기능 (초해상도, 배경 제거 등)
