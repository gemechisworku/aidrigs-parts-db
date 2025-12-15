"""
Email handling utility
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.database import SessionLocal
from app.models.setting import SystemSetting
import logging

logger = logging.getLogger(__name__)

def get_smtp_settings(db):
    """Fetch SMTP settings from database"""
    keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL", "SMTP_USE_TLS"]
    settings_dict = {}
    
    settings = db.query(SystemSetting).filter(SystemSetting.key.in_(keys)).all()
    for s in settings:
        settings_dict[s.key] = s.value
        
    return settings_dict

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email using SMTP settings from the database.
    Returns True if successful, False otherwise.
    """
    db = SessionLocal()
    try:
        settings = get_smtp_settings(db)
        
        # Validate required settings
        required_keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"]
        if not all(k in settings and settings[k] for k in required_keys):
            logger.error("Missing SMTP configuration. Cannot send email.")
            return False

        msg = MIMEMultipart()
        msg['From'] = settings["SMTP_FROM_EMAIL"]
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(html_content, 'html'))

        if int(settings["SMTP_PORT"]) == 465:
            server = smtplib.SMTP_SSL(settings["SMTP_HOST"], int(settings["SMTP_PORT"]))
        else:
            server = smtplib.SMTP(settings["SMTP_HOST"], int(settings["SMTP_PORT"]))
            if settings.get("SMTP_USE_TLS", "false").lower() == "true":
                server.starttls()
        
        server.login(settings["SMTP_USER"], settings["SMTP_PASSWORD"])
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False
    finally:
        db.close()

def send_invite_email(to_email: str, invite_link: str):
    """Send an invitation email"""
    subject = "You have been invited to AidRigs Parts Database"
    html_content = f"""
    <html>
        <body>
            <h2>Welcome!</h2>
            <p>You have been invited to join the AidRigs Parts Database.</p>
            <p>Please click the link below to set up your account:</p>
            <p><a href="{invite_link}">{invite_link}</a></p>
            <p>This link will expire in 48 hours.</p>
            <br>
            <p>If you did not expect this invitation, please ignore this email.</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, html_content)

def send_reset_password_email(to_email: str, email: str, link: str):
    """
    Send password reset email
    """
    subject = f"Password recovery for AidRigs"
    html_content = f"""
    <html>
        <body>
            <h2>Password Recovery</h2>
            <p>A password reset was requested for your account {email}.</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href="{link}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <br>
            <p>If you did not request a password reset, please ignore this email.</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, html_content)
