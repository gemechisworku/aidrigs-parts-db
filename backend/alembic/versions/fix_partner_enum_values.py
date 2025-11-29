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
    # Drop the old enum type if it exists with wrong values
    op.execute("DROP TYPE IF EXISTS partnertypeenum CASCADE")
    
    # Ensure partner_type_enum exists with correct lowercase values
    op.execute("DROP TYPE IF EXISTS partner_type_enum CASCADE")
    op.execute("""
        CREATE TYPE partner_type_enum AS ENUM (
            'supplier',
            'customer', 
            'AR_storage',
            'forwarder'
        )
    """)
    
    # Recreate the partners table type column
    op.execute("""
        ALTER TABLE partners 
        ALTER COLUMN type TYPE partner_type_enum 
        USING type::text::partner_type_enum
    """)


def downgrade() -> None:
    # Revert to old enum if needed
    pass
