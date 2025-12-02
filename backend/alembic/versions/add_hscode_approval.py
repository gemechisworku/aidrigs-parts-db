"""add_hscode_approval

Revision ID: add_hscode_approval
Revises: add_translation_approval
Create Date: 2025-12-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_hscode_approval'
down_revision = 'add_translation_approval'
branch_labels = None
depends_on = None


def upgrade():
    # Get the approvalstatus enum (already exists)
    approval_status_enum = postgresql.ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', name='approvalstatus', create_type=False)
    
    # Add approval fields to hs_codes table
    op.add_column('hs_codes', sa.Column('approval_status', approval_status_enum, nullable=False, server_default='APPROVED'))
    op.add_column('hs_codes', sa.Column('submitted_at', sa.DateTime(), nullable=True))
    op.add_column('hs_codes', sa.Column('reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('hs_codes', sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('hs_codes', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('hs_codes', sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Create index on approval_status for efficient filtering
    op.create_index(op.f('ix_hs_codes_approval_status'), 'hs_codes', ['approval_status'], unique=False)
    
    # Add foreign key constraints
    op.create_foreign_key('fk_hs_codes_reviewed_by', 'hs_codes', 'users', ['reviewed_by'], ['id'])
    op.create_foreign_key('fk_hs_codes_created_by', 'hs_codes', 'users', ['created_by'], ['id'])
    
    # Set all existing HS codes to 'APPROVED' status
    op.execute("UPDATE hs_codes SET approval_status = 'APPROVED' WHERE approval_status = 'APPROVED'")


def downgrade():
    # Drop foreign key constraints
    op.drop_constraint('fk_hs_codes_created_by', 'hs_codes', type_='foreignkey')
    op.drop_constraint('fk_hs_codes_reviewed_by', 'hs_codes', type_='foreignkey')
    
    # Drop index
    op.drop_index(op.f('ix_hs_codes_approval_status'), table_name='hs_codes')
    
    # Drop columns
    op.drop_column('hs_codes', 'created_by')
    op.drop_column('hs_codes', 'rejection_reason')
    op.drop_column('hs_codes', 'reviewed_by')
    op.drop_column('hs_codes', 'reviewed_at')
    op.drop_column('hs_codes', 'submitted_at')
    op.drop_column('hs_codes', 'approval_status')
