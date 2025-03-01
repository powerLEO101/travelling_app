import os
import openai
from fastapi import FastAPI
from pydantic import BaseModel

class Person(BaseModel):
  name: str
  description: str

app = FastAPI()
data = []

client = openai.OpenAI(
  api_key=os.environ.get("TOGETHER_API_KEY"),
  base_url="https://api.together.xyz/v1",
)

@app.get("/")
async def root():
  return {"message": "Hello World"}

@app.post("/add")
def add_profile(person: Person):
  data.append(person)
  return data

@app.get("/pair")
def pair_profile(profile=""):
  content = "\n".join([f"Name: {x.name}\nDescription: {x.description}" for x in data])
  response = client.chat.completions.create(
    model="deepseek-ai/DeepSeek-V3",
    messages=[
      {"role": "system", "content": f"You are a helpful travelling agent. You are given multiple profiles of people wanting to travel to the same place. Match this profile with the best provided profile: {profile}"},
      {"role": "user", "content": content},
    ]
  )
  return response.choices[0].message.content
