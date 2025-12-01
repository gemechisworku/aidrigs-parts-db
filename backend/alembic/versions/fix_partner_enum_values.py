"""
Drop and recreate partner_type_enum with correct values
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fix_partner_enum'
down_revision = '91503ecf6fa2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Temporarily change column to text to detach from enum
    op.execute("ALTER TABLE partners ALTER COLUMN type TYPE VARCHAR(50)")
    
    # 2. Drop the old enum types
    op.execute("DROP TYPE IF EXISTS partnertypeenum")
    op.execute("DROP TYPE IF EXISTS partner_type_enum")
    
    # 3. Create the new enum type
    op.execute("""
        CREATE TYPE partner_type_enum AS ENUM (
            'supplier',
            'customer', 
            'AR_storage',
            'forwarder'
        )
    """)
    
    # 4. Convert column back to enum
    op.execute("""
        ALTER TABLE partners 
        ALTER COLUMN type TYPE partner_type_enum 
        USING type::partner_type_enum
    """)


def downgrade() -> None:
    # Revert to text if needed, simpler than reconstructing old state
    op.execute("ALTER TABLE partners ALTER COLUMN type TYPE VARCHAR(50)")
