"""create extracted quotes tables

Revision ID: create_extracted_quotes
Revises: increase_phone_length
Create Date: 2025-12-11 16:45:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_extracted_quotes'
down_revision = '4952d7271d60'  # add_manufacturer_approval
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create extracted_quotes table
    op.create_table(
        'extracted_quotes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quote_number', sa.String(length=50), nullable=True),
        sa.Column('quote_date', sa.Date(), nullable=True),
        sa.Column('valid_until', sa.Date(), nullable=True),
        sa.Column('vehicle_vin', sa.String(length=100), nullable=True),
        sa.Column('vehicle_make', sa.String(length=100), nullable=True),
        sa.Column('vehicle_model', sa.String(length=100), nullable=True),
        sa.Column('customer_name', sa.String(length=255), nullable=True),
        sa.Column('customer_city', sa.String(length=255), nullable=True),
        sa.Column('customer_country', sa.String(length=255), nullable=True),
        sa.Column('customer_phone', sa.String(length=50), nullable=True),
        sa.Column('customer_email', sa.String(length=255), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=True, server_default='USD'),
        sa.Column('origin_incoterm', sa.String(length=10), nullable=True),
        sa.Column('origin_port', sa.String(length=255), nullable=True),
        sa.Column('attachment_filename', sa.String(length=500), nullable=True),
        sa.Column('attachment_data', sa.LargeBinary(), nullable=True),
        sa.Column('attachment_mime_type', sa.String(length=100), nullable=True),
        sa.Column('extraction_status', sa.String(length=50), nullable=True, server_default='pending'),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
    )
    op.create_index(op.f('ix_extracted_quotes_quote_number'), 'extracted_quotes', ['quote_number'], unique=False)
    
    # Create extracted_quote_items table
    op.create_table(
        'extracted_quote_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('extracted_quote_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('part_name', sa.Text(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('tax_code', sa.String(length=20), nullable=True),
        sa.Column('discount', sa.Numeric(precision=5, scale=2), nullable=True, server_default='0'),
        sa.Column('total_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('position', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['extracted_quote_id'], ['extracted_quotes.id'], ondelete='CASCADE'),
    )


def downgrade() -> None:
    op.drop_table('extracted_quote_items')
    op.drop_index(op.f('ix_extracted_quotes_quote_number'), table_name='extracted_quotes')
    op.drop_table('extracted_quotes')
