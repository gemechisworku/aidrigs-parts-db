"""add_translation_approval

Revision ID: add_translation_approval
Revises: add_equivalence_groups
Create Date: 2025-12-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_translation_approval'
down_revision = 'add_equivalence_groups'
branch_labels = None
depends_on = None


def upgrade():
    # Get the approvalstatus enum (already exists from previous migration)
    approval_status_enum = postgresql.ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', name='approvalstatus', create_type=False)
    
    # Add approval fields to part_translation_standardization table
    op.add_column('part_translation_standardization', sa.Column('approval_status', approval_status_enum, nullable=False, server_default='APPROVED'))
    op.add_column('part_translation_standardization', sa.Column('submitted_at', sa.DateTime(), nullable=True))
    op.add_column('part_translation_standardization', sa.Column('reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('part_translation_standardization', sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('part_translation_standardization', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('part_translation_standardization', sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Create index on approval_status for efficient filtering
    op.create_index(op.f('ix_part_translation_standardization_approval_status'), 'part_translation_standardization', ['approval_status'], unique=False)
    
    # Add foreign key constraints
    op.create_foreign_key('fk_part_translation_standardization_reviewed_by', 'part_translation_standardization', 'users', ['reviewed_by'], ['id'])
    op.create_foreign_key('fk_part_translation_standardization_created_by', 'part_translation_standardization', 'users', ['created_by'], ['id'])
    
    # Set all existing translations to 'APPROVED' status (they're already in use)
    op.execute("UPDATE part_translation_standardization SET approval_status = 'APPROVED' WHERE approval_status = 'APPROVED'")


def downgrade():
    # Drop foreign key constraints
    op.drop_constraint('fk_part_translation_standardization_created_by', 'part_translation_standardization', type_='foreignkey')
    op.drop_constraint('fk_part_translation_standardization_reviewed_by', 'part_translation_standardization', type_='foreignkey')
    
    # Drop index
    op.drop_index(op.f('ix_part_translation_standardization_approval_status'), table_name='part_translation_standardization')
    
    # Drop columns
    op.drop_column('part_translation_standardization', 'created_by')
    op.drop_column('part_translation_standardization', 'rejection_reason')
    op.drop_column('part_translation_standardization', 'reviewed_by')
    op.drop_column('part_translation_standardization', 'reviewed_at')
    op.drop_column('part_translation_standardization', 'submitted_at')
    op.drop_column('part_translation_standardization', 'approval_status')
