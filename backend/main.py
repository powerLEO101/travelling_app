import os
import anthropic
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from uuid import uuid4

class UserModel(BaseModel):
  name: str
  age: int
  budget: int
  travel_days: int
  location: str
  interests: list[str]
  bio: str

app = FastAPI()
user_db = {}

client = anthropic.Anthropic(
  api_key=os.environ.get(os.environ.get("CLAUDE_API_KEY")),
)

@app.post("api/user/register")
def add_user(person: UserModel):
  user_db[str(uuid4())] = person.dict()
  return user_db

@app.get("/pair_user/{user_id}")
def pair_user(user_id: str):
  if user_id not in user_db:
    raise HTTPException(status_code=404, detail="User not found")
  person = user_db[user_id]
  message = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=1000,
    temperature=1,
    system="You are a travel agent who specializes in connecting clients to others with similar interests and personalities who would enjoy traveling together.",
    messages=[
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Why is the ocean salty?"
          }
        ]
      }
    ]
  )

