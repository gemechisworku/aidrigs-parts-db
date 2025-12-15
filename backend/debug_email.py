import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.database import SessionLocal
from app.core.email import get_smtp_settings
import sys

def test_smtp():
    db = SessionLocal()
    try:
        print("Fetching settings...")
        settings = get_smtp_settings(db)
        
        # Mask password for safety in logs, but check length/content type
        pwd = settings.get('SMTP_PASSWORD', '')
        print(f"Settings found: Host={settings.get('SMTP_HOST')}, Port={settings.get('SMTP_PORT')}, User={settings.get('SMTP_USER')}, TLS={settings.get('SMTP_USE_TLS')}")
        print(f"Password length: {len(pwd)}")
        if ' ' in pwd:
            print("WARNING: Password contains spaces!")

        msg = MIMEMultipart()
        msg['From'] = settings["SMTP_FROM_EMAIL"]
        msg['To'] = settings["SMTP_FROM_EMAIL"] # Send to self
        msg['Subject'] = "Test"
        msg.attach(MIMEText("Test", 'html'))

        print("Connecting to server...")
        if int(settings["SMTP_PORT"]) == 465:
            print("Using SMTP_SSL...")
            server = smtplib.SMTP_SSL(settings["SMTP_HOST"], int(settings["SMTP_PORT"]))
        else:
            print("Using SMTP...")
            server = smtplib.SMTP(settings["SMTP_HOST"], int(settings["SMTP_PORT"]))
            if settings.get("SMTP_USE_TLS", "false").lower() == "true":
                print("Starting TLS...")
                server.starttls()
        
        print("Logging in...")
        server.login(settings["SMTP_USER"], settings["SMTP_PASSWORD"])
        print("Login successful!")
        
        print("Sending test email...")
        server.send_message(msg)
        print("Email sent successfully!")
        
        server.quit()
        
    except Exception as e:
        error_msg = f"CRITICAL ERROR: {type(e).__name__}: {str(e)}"
        print(error_msg)
        # Write to file with utf-8 to handle any weird characters
        with open("error_log_v2.txt", "w", encoding="utf-8") as f:
            f.write(error_msg)
            import traceback
            traceback.print_exc(file=f)
    finally:
        db.close()

if __name__ == "__main__":
    test_smtp()
