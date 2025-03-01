import os
import anthropic
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from uuid import uuid4

class PersonRequest(BaseModel):
  name: str
  age: int
  budget: int
  travel_days: int
  location: str
  hobbies: list[str]
  preferred_activities: list[str]
  description: str

app = FastAPI()
data = {}
data_by_location = {}

client = anthropic.Anthropic(
  api_key=os.environ.get(os.environ.get("CLAUDE_API_KEY")),
)

@app.post("/add_user")
def add_user(person: PersonRequest):
  data[str(uuid4())] = person.dict()
  if person.location in data_by_location: data_by_location[person.location].append(person)
  else: data_by_location[person.location] = [person]
  return data

@app.get("/pair_user/{user_id}")
def pair_user(user_id: str):
  if user_id not in data:
    raise HTTPException(status_code=404, detail="User not found")
  person = data[user_id]


