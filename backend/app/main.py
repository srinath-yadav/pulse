from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pulse",version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get('/health')
def health():
    return {"status":"ok","service":"pulse-api"}

@app.get('/')
def root():
    return {"message":"Hello world"}

