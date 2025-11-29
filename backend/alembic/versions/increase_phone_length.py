"""increase phone number length

Revision ID: increase_phone_length
Revises: fix_type_column_enum
Create Date: 2025-11-29 09:50:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'increase_phone_length'
down_revision: Union[str, None] = 'fix_type_column_enum'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Increase phone number columns length to 20
    op.alter_column('contacts', 'phone1',
               existing_type=sa.String(length=12),
               type_=sa.String(length=20),
               existing_nullable=True)
    op.alter_column('contacts', 'phone2',
               existing_type=sa.String(length=12),
               type_=sa.String(length=20),
               existing_nullable=True)


def downgrade() -> None:
    # Revert back to 12 chars (might fail if data is longer)
    op.alter_column('contacts', 'phone1',
               existing_type=sa.String(length=20),
               type_=sa.String(length=12),
               existing_nullable=True)
    op.alter_column('contacts', 'phone2',
               existing_type=sa.String(length=20),
               type_=sa.String(length=12),
               existing_nullable=True)
