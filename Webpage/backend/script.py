import smtplib
import csv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import logging

# Setup logger
logger = logging.getLogger(__name__)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s: %(message)s',
                    filename='email_sender.log')

# Load environment variables
load_dotenv()

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
ATTENDANCE_THRESHOLD = 75

# Function to send email
def send_email(to_email, student_name, subjects_with_low_attendance):
    try:
        # Validate email configuration
        if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
            logging.error("Email credentials are missing. Check .env file.")
            return False

        # Validate recipient email
        if not to_email or '@' not in to_email:
            logging.warning(f"Invalid email for {student_name}: {to_email}")
            return False

        msg = MIMEMultipart()
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email
        msg["Subject"] = "Attendance Notification"

        # Construct email body
        body = f"Dear {student_name},\n\n"
        
        if subjects_with_low_attendance:
            body += "This is to inform you about your attendance concerns:\n\n"
            for subject, attendance_percentage in subjects_with_low_attendance:
                body += f"- {subject}: {attendance_percentage}% attendance\n"
            
            body += "\nPlease take immediate action to improve your attendance in the mentioned subjects.\n"
        else:
            body += "We hope this email finds you well. No immediate attendance concerns at this time.\n"
        
        body += "\nBest regards,\nAdmin Team"

        msg.attach(MIMEText(body, "plain"))

        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
            
            logging.info(f"Email sent to {student_name} at {to_email}")
            return True

    except smtplib.SMTPAuthenticationError:
        logging.error("SMTP Authentication Failed. Check email credentials.")
    except smtplib.SMTPException as smtp_error:
        logging.error(f"SMTP Error when sending email to {student_name}: {smtp_error}")
    except Exception as e:
        logging.error(f"Unexpected error sending email to {student_name}: {e}")
    
    return False

# Reading the CSV file and processing attendance
def read_csv_and_send_emails(csv_filename, attendance_threshold=ATTENDANCE_THRESHOLD):
    try:
        # Check if file exists
        if not os.path.exists(csv_filename):
            logging.error(f"CSV file not found: {csv_filename}")
            return

        # Read CSV file
        with open(csv_filename, "r") as file:
            reader = csv.reader(file)
            headers = next(reader)  # Store headers
            
            # Validate headers
            required_columns = ["Name", "Email"]
            if not all(col in headers for col in required_columns):
                logging.error("CSV is missing required columns (Name, Email)")
                return

            # Find column indices
            name_index = headers.index("Name")
            email_index = headers.index("Email")
            
            # Dynamically find subject columns
            subject_columns = [col for col in headers if col not in ["Name", "Email"]]
            
            # Track email sending statistics
            total_students = 0
            emails_sent = 0
            emails_failed = 0

            # Process each student
            for row in reader:
                total_students += 1
                
                # Validate row data
                if len(row) < len(headers):
                    logging.warning(f"Incomplete row: {row}")
                    continue

                student_name = row[name_index]
                student_email = row[email_index]
                
                # Find subjects with low attendance
                low_attendance_subjects = []
                for subject in subject_columns:
                    subject_index = headers.index(subject)
                    try:
                        attendance = float(row[subject_index])
                        if attendance < attendance_threshold:
                            low_attendance_subjects.append((subject, attendance))
                    except (ValueError, TypeError):
                        logging.warning(f"Invalid attendance value for {student_name} in {subject}")
                
                # Send email for low attendance
                if low_attendance_subjects:
                    if send_email(student_email, student_name, low_attendance_subjects):
                        emails_sent += 1
                    else:
                        emails_failed += 1

            # Log overall statistics
            logging.info(f"Total students processed: {total_students}")
            logging.info(f"Emails sent: {emails_sent}")
            logging.info(f"Emails failed: {emails_failed}")

    except Exception as e:
        logging.error(f"Error processing CSV: {e}")

@app.post("/process_attendance/")
def process_attendance(attendance_threshold: int = 70):
    csv_filename = "students.csv"

    if not os.path.exists(csv_filename):
        logger.error(f"CSV file not found: {csv_filename}")
        raise HTTPException(status_code=404, detail="CSV file not found")

    emails_sent = 0
    emails_failed = 0

    try:
        with open(csv_filename, "r", encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                student_name = row.get('Name', 'Student')
                student_email = row.get('Email')

                if not student_email:
                    logger.warning(f"No email found for {student_name}")
                    continue

                # Find subjects with low attendance
                low_attendance_subjects = []
                for subject, attendance in row.items():
                    if subject not in ['Name', 'Email']:
                        try:
                            attendance_float = float(attendance)
                            if attendance_float < attendance_threshold:
                                low_attendance_subjects.append((subject, attendance_float))
                        except ValueError:
                            logger.warning(f"Invalid attendance value for {student_name} in {subject}")

                # Send email if low attendance subjects found
                if low_attendance_subjects:
                    logger.info(f"Found low attendance for {student_name}: {low_attendance_subjects}")
                    email_result = send_email(student_email, student_name, low_attendance_subjects)
                    if email_result:
                        emails_sent += 1
                    else:
                        emails_failed += 1

        logger.info(f"Attendance processing complete. Emails sent: {emails_sent}, Failed: {emails_failed}")
        return {
            "message": "Attendance processing complete", 
            "emails_sent": emails_sent, 
            "emails_failed": emails_failed
        }

    except Exception as e:
        logger.error(f"Processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/upload-csv/")
async def upload_csv(file: UploadFile = File(...)):
    file_location = "students.csv"
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"CSV file uploaded successfully to {file_location}")
        process_attendance()
        get_students()
        return {"message": "File uploaded successfully."}
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.get("/students")
def get_students():
    try:
        # Process attendance when fetching students
        
        with open("students.csv", "r", encoding='utf-8') as file:
            reader = csv.DictReader(file)
            return list(reader)
    except FileNotFoundError:
        logger.warning("No students file found")
        return {"error": "No students found"}
    
    


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)