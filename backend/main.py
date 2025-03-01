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
user_db: dict[str, UserModel] = {k: UserModel.model_validate(v) for k, v in {
  "e991e819-882c-4dd8-b93a-edbfac3cb0a3": {
    "name": "Hugo",
    "age": 19,
    "budget": 1000,
    "travel_days": 2,
    "location": "New York",
    "interests": [
      "biking"
    ],
    "bio": "CS student at NYU"
  },
  "f09d0f78-35fc-472c-a473-374705759d6c": {
    "name": "Leo",
    "age": 19,
    "budget": 1000,
    "travel_days": 2,
    "location": "New York",
    "interests": [
      "running"
    ],
    "bio": "CS student at NYU"
  },
  "75df743c-bb84-41a9-b828-6cafd17dc7a6": {
    "name": "Abid",
    "age": 30,
    "budget": 10000000,
    "travel_days": 200,
    "location": "Abu Dhabi",
    "interests": [
      "cocaine"
    ],
    "bio": "Pakistani guy"
  },
  "2abeaa99-5b17-4ddb-9cba-5a6e18b1fc84": {
    "name": "Jack",
    "age": 30,
    "budget": 10000000,
    "travel_days": 200,
    "location": "Shanghai",
    "interests": [
      "cocaine"
    ],
    "bio": "Chinese guy"
  }
}.items()}

client = anthropic.Anthropic(
  api_key=os.environ.get("CLAUDE_API_KEY"),
)

@app.post("/api/user/register")
def add_user(person: UserModel):
  id = str(uuid4())
  user_db[id] = person#.model_dump()
  return user_db

@app.get("/api/user/get_matches/{user_id}")
def pair_user(user_id: str):
  if user_id not in user_db.keys():
    raise HTTPException(status_code=404, detail="User not found")
  
  user = user_db[user_id]
  
  def get_raw_match_score(u: UserModel) -> int:
    return -abs(u.age - user.age) +\
      -abs(u.budget - user.budget) +\
        len(set(u.interests).intersection(user.interests))
  
  scores = [
    (id, get_raw_match_score(u)) for id, u in user_db.items()
  ]
  scores = sorted(scores, reverse=True, key=lambda u: u[1])[:15]
  
  def describe_user(id: str):
    u = user_db.get(id)
    return f"{u.name}, aged {u.age} years old. They would like to go to {u.location} and their " +\
      f"interests include {u.interests}. They have a budget of {u.budget}. Their internal id is {id}"
  
  prompt = f"Your current client is {describe_user(user_id)}. Possible candidates include the following: \n" +\
              "\n".join([describe_user(id) for (id, _) in scores if id != user_id]) +\
                "\n\nReturn absolutely nothing EXCEPT the other person's id."
  print(prompt)
  message = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=1000,
    temperature=1,
    system="You are a travel agent who specializes in connecting clients to others with similar interests and " +\
      "personalities who would enjoy traveling together. You only recognize people by their internal database ids.",
    messages=[
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": prompt
          }
        ]
      }
    ]
  )
  return message.content

