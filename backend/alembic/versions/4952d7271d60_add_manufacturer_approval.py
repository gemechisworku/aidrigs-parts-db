"""add_manufacturer_approval

Revision ID: 4952d7271d60
Revises: add_hscode_approval
Create Date: 2025-12-04 12:53:43.199094

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '4952d7271d60'
down_revision: Union[str, None] = 'add_hscode_approval'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add approval fields to manufacturers table
    op.add_column('manufacturers', sa.Column('approval_status', sa.Enum('PENDING_APPROVAL', 'APPROVED', 'REJECTED', name='approvalstatus'), nullable=False, server_default='APPROVED'))
    op.add_column('manufacturers', sa.Column('submitted_at', sa.DateTime(), nullable=True))
    op.add_column('manufacturers', sa.Column('reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('manufacturers', sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('manufacturers', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('manufacturers', sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Create index
    op.create_index(op.f('ix_manufacturers_approval_status'), 'manufacturers', ['approval_status'], unique=False)
    
    # Add foreign keys
    op.create_foreign_key(None, 'manufacturers', 'users', ['reviewed_by'], ['id'])
    op.create_foreign_key(None, 'manufacturers', 'users', ['created_by'], ['id'])


def downgrade() -> None:
    # Remove foreign keys
    op.drop_constraint(None, 'manufacturers', type_='foreignkey')
    op.drop_constraint(None, 'manufacturers', type_='foreignkey')
    
    # Remove index
    op.drop_index(op.f('ix_manufacturers_approval_status'), table_name='manufacturers')
    
    # Remove columns
    op.drop_column('manufacturers', 'created_by')
    op.drop_column('manufacturers', 'rejection_reason')
    op.drop_column('manufacturers', 'reviewed_by')
    op.drop_column('manufacturers', 'reviewed_at')
    op.drop_column('manufacturers', 'submitted_at')
    op.drop_column('manufacturers', 'approval_status')
