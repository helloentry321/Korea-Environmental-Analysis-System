# K-EAS — Korea Environmental Analysis System

대한민국 17개 시·도의 환경위험도를 분석하고 시각화하는 웹 기반 플랫폼입니다.

![K-EAS](https://img.shields.io/badge/K--EAS-v1.0-2563EB?style=flat-square) ![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python) ![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask)

---

## 주요 기능

- **대한민국 SVG 지도** — 시·도 클릭으로 즉시 분석
- **환경위험지수** — 폭염·홍수·산불·대기오염·도시화 5가지 요소 종합
- **전국 순위 리스트** — 17개 시·도 위험도 순위를 한눈에
- **지역 비교 모드** — 두 지역의 위험요인을 나란히 비교
- **AI 환경 분석 & 개선방안** — 지역 특성 기반 자동 생성

---

## 환경위험지수 계산식

| 요소 | 가중치 | 데이터 출처 |
|------|--------|------------|
| 폭염 (Heat) | 30% | 기상청 |
| 홍수 (Flood) | 20% | 행정안전부 |
| 산불 (Wildfire) | 20% | 산림청 |
| 대기오염 (Air) | 20% | 에어코리아 |
| 도시화 (Urban) | 10% | 통계청(KOSIS) |

> 배출량 원시 데이터: **Climate TRACE v5.8.0** (2021–2023)

---

## 기술 스택

- **Backend** — Python, Flask
- **Frontend** — HTML, CSS, JavaScript (Vanilla)
- **지도** — SVG (대한민국 17개 시·도)
- **데이터** — JSON (environment.json)

---

## 프로젝트 구조

```
K-EAS/
├── app.py                  # Flask 백엔드
├── requirements.txt
├── Procfile                # Render 배포용
├── render.yaml
├── data/
│   └── environment.json    # 17개 시·도 환경 데이터
├── templates/
│   └── index.html
└── static/
    ├── css/style.css
    ├── js/map.js
    └── map/korea.svg
```

---

## 로컬 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-id/k-eas.git
cd k-eas

# 2. 패키지 설치
pip install -r requirements.txt

# 3. 서버 실행
python app.py

# 4. 브라우저에서 열기
# http://localhost:5000
```

---

## Render 배포

1. GitHub에 이 저장소를 push
2. [Render](https://render.com) → **New Web Service** → GitHub 연결
3. 아래 설정 입력:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
4. **Deploy** 클릭

---

## 개발 목적

학교 포트폴리오 프로젝트로 개발되었습니다. Climate TRACE의 실제 온실가스 배출량 데이터를 기반으로 지역별 환경위험을 정량화하고, 누구나 URL 하나로 접속할 수 있는 공개 서비스를 목표로 합니다.

---

*데이터 출처: Climate TRACE v5.8.0 | 기상청 | 행정안전부 | 산림청 | 에어코리아 | 통계청*
