from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(str(settings.DATABASE_URL))

with engine.begin() as conn:
    # Drop the old enum type
    print("Drop existing approvalstatus enum...")
    conn.execute(text("DROP TYPE IF EXISTS approvalstatus CASCADE"))
    
    # Create new enum with uppercase values
    print("Creating new approvalstatus enum with uppercase values...")
    conn.execute(text("CREATE TYPE approvalstatus AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')"))
    
    print("Success! Enum recreated with uppercase values.")
