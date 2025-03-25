from fastapi import FastAPI, UploadFile, File
from typing import List
import csv

app = FastAPI()

@app.get("/students")
async def get_students():
    try:
        students = []
        with open(csv_filename, "r") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for row in reader:
                if len(row) >= 2:
                    students.append({
                        "name": row[0],
                        "email": row[1]
                    })
        return students
    except Exception as e:
        return {"error": str(e)}

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        # Save the uploaded file
        with open("students.csv", "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        return {"message": "CSV file uploaded successfully"}
    except Exception as e:
        return {"error": str(e)} 