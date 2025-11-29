"""fix partners type column to use enum

Revision ID: fix_type_column_enum  
Revises: fix_partner_enum
Create Date: 2025-11-29 09:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fix_type_column_enum'
down_revision: Union[str, None] = 'fix_partner_enum'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Alter the partners.type column to use the enum type instead of VARCHAR
    op.execute("""
        ALTER TABLE partners 
        ALTER COLUMN type TYPE partner_type_enum 
        USING type::partner_type_enum
    """)


def downgrade() -> None:
    # Revert back to VARCHAR
    op.execute("""
        ALTER TABLE partners 
        ALTER COLUMN type TYPE VARCHAR(10) 
        USING type::text
    """)
