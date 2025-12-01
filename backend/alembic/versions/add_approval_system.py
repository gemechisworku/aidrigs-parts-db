"""add_approval_system

Revision ID: add_approval_system
Revises: 
Create Date: 2025-11-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_approval_system'
down_revision = 'increase_phone_length'
branch_labels = None
depends_on = None


def upgrade():
    # Create approval status enum safely - using uppercase to match Python enum names
    op.execute("DO $$ BEGIN CREATE TYPE approvalstatus AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    approval_status_enum = postgresql.ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', name='approvalstatus', create_type=False)
    
    # Create approval_logs table
    op.create_table('approval_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('old_status', approval_status_enum, nullable=True),
        sa.Column('new_status', approval_status_enum, nullable=False),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_approval_logs_entity_id'), 'approval_logs', ['entity_id'], unique=False)
    op.create_index(op.f('ix_approval_logs_entity_type'), 'approval_logs', ['entity_type'], unique=False)
    
    # Add approval fields to parts table
    op.add_column('parts', sa.Column('approval_status', approval_status_enum, nullable=False, server_default='APPROVED'))
    op.add_column('parts', sa.Column('submitted_at', sa.DateTime(), nullable=True))
    op.add_column('parts', sa.Column('reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('parts', sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('parts', sa.Column('rejection_reason', sa.Text(), nullable=True))
    
    # Create index on approval_status for efficient filtering
    op.create_index(op.f('ix_parts_approval_status'), 'parts', ['approval_status'], unique=False)
    
    # Add foreign key constraint
    op.create_foreign_key('fk_parts_reviewed_by', 'parts', 'users', ['reviewed_by'], ['id'])
    
    # Set all existing parts to 'APPROVED' status
    op.execute("UPDATE parts SET approval_status = 'APPROVED' WHERE approval_status = 'APPROVED'")


def downgrade():
    # Drop foreign key and index
    op.drop_constraint('fk_parts_reviewed_by', 'parts', type_='foreignkey')
    op.drop_index(op.f('ix_parts_approval_status'), table_name='parts')
    
    # Drop columns from parts
    op.drop_column('parts', 'rejection_reason')
    op.drop_column('parts', 'reviewed_by')
    op.drop_column('parts', 'reviewed_at')
    op.drop_column('parts', 'submitted_at')
    op.drop_column('parts', 'approval_status')
    
    # Drop approval_logs table
    op.drop_index(op.f('ix_approval_logs_entity_type'), table_name='approval_logs')
    op.drop_index(op.f('ix_approval_logs_entity_id'), table_name='approval_logs')
    op.drop_table('approval_logs')
    
    # Drop enum
    sa.Enum(name='approvalstatus').drop(op.get_bind(), checkfirst=True)
