# Mobility research API

Fail-closed FastAPI prototype. **Not clinically validated. Do not store real health records. Do not expose this SQLite demo to the internet.**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pytest tests -q
uvicorn app.main:app --reload --port 8000
```

Useful routes: `/health`, `/v1/exercises`, `/v1/questionnaire`, `/v1/calendar`, `/v1/intake`, `/v1/checkin`, `/v1/program/{id}`.

Assign placeholder or original media without changing the app UI:

```bash
python ../scripts/assign_video.py --id seated_knee_extension --url /videos/seated_knee_extension.mp4
```
