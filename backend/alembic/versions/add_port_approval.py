"""add_port_approval_fields

Revision ID: add_port_approval
Revises: create_extracted_quotes
Create Date: 2025-12-12 10:24:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_port_approval'
down_revision = 'create_extracted_quotes'
branch_labels = None
depends_on = None


def upgrade():
    # Add approval-related columns to ports table
    op.add_column('ports', sa.Column('approval_status', sa.String(50), nullable=False, server_default='PENDING_APPROVAL'))
    op.add_column('ports', sa.Column('submitted_at', sa.TIMESTAMP(timezone=True), nullable=True, server_default=sa.func.now()))
    op.add_column('ports', sa.Column('reviewed_at', sa.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('ports', sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('ports', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('ports', sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Add foreign key constraints
    op.create_foreign_key('fk_ports_reviewed_by', 'ports', 'users', ['reviewed_by'], ['id'])
    op.create_foreign_key('fk_ports_created_by', 'ports', 'users', ['created_by'], ['id'])
    
    # Create index on approval_status for faster queries
    op.create_index('ix_ports_approval_status', 'ports', ['approval_status'])
    
    # Update existing ports to APPROVED status (they were created before approval system)
    op.execute("""
        UPDATE ports 
        SET approval_status = 'APPROVED',
            reviewed_at = created_at
        WHERE approval_status = 'PENDING_APPROVAL'
    """)


def downgrade():
    # Drop index and foreign keys first
    op.drop_index('ix_ports_approval_status', table_name='ports')
    op.drop_constraint('fk_ports_created_by', 'ports', type_='foreignkey')
    op.drop_constraint('fk_ports_reviewed_by', 'ports', type_='foreignkey')
    
    # Drop columns
    op.drop_column('ports', 'created_by')
    op.drop_column('ports', 'rejection_reason')
    op.drop_column('ports', 'reviewed_by')
    op.drop_column('ports', 'reviewed_at')
    op.drop_column('ports', 'submitted_at')
    op.drop_column('ports', 'approval_status')
