from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

origins = [
    "http://localhost:5173/",
    "http://localhost:8080",
    # Add more origins if needed
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get('/quiz/')
async def quiz():
    with open('questions.json') as q:
        data = json.load(q)
        return data

