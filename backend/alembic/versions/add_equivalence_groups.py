"""add_equivalence_groups

Revision ID: add_equivalence_groups
Revises: add_approval_system
Create Date: 2025-11-30

Implements production-grade equivalence system with:
- Audit trail for parts_equivalence
- Bidirectional enforcement via trigger
- Equivalence groups for transitive relationships
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_equivalence_groups'
down_revision = 'add_approval_system'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add audit columns to parts_equivalence table
    print("Adding audit columns to parts_equivalence...")
    
    # Drop existing composite primary key
    op.execute("ALTER TABLE parts_equivalence DROP CONSTRAINT IF EXISTS parts_equivalence_pkey")
    
    # Add ID column as new primary key
    op.execute("ALTER TABLE parts_equivalence ADD COLUMN id UUID DEFAULT gen_random_uuid()")
    op.execute("UPDATE parts_equivalence SET id = gen_random_uuid() WHERE id IS NULL")
    op.execute("ALTER TABLE parts_equivalence ALTER COLUMN id SET NOT NULL")
    op.execute("ALTER TABLE parts_equivalence ADD PRIMARY KEY (id)")
    
    # Create unique constraint on the original composite key
    op.create_unique_constraint('uq_parts_equivalence_parts', 'parts_equivalence', ['part_id', 'equivalent_part_id'])
    
    # Add audit trail columns
    op.add_column('parts_equivalence', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('parts_equivalence', sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('parts_equivalence', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('parts_equivalence', sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Foreign key for created_by and deleted_by
    op.create_foreign_key('fk_parts_equiv_created_by', 'parts_equivalence', 'users', ['created_by'], ['id'])
    op.create_foreign_key('fk_parts_equiv_deleted_by', 'parts_equivalence', 'users', ['deleted_by'], ['id'])
    
    # Backfill created_at for existing rows (set to now)
    op.execute(f"UPDATE parts_equivalence SET created_at = '{datetime.utcnow()}' WHERE created_at IS NULL")
    
    # Make created_at NOT NULL after backfill
    op.alter_column('parts_equivalence', 'created_at', nullable=False)
    
    # Step 2: Ensure bidirectional relationships exist
    print("Ensuring bidirectional relationships...")
    op.execute("""
        INSERT INTO parts_equivalence (id, part_id, equivalent_part_id, created_at)
        SELECT 
            gen_random_uuid(),
            pe.equivalent_part_id,
            pe.part_id,
            pe.created_at
        FROM parts_equivalence pe
        WHERE NOT EXISTS (
            SELECT 1 FROM parts_equivalence pe2
            WHERE pe2.part_id = pe.equivalent_part_id
            AND pe2.equivalent_part_id = pe.part_id
        )
        AND pe.deleted_at IS NULL
    """)
    
    # Step 3: Create trigger for bidirectional enforcement
    print("Creating bidirectional trigger...")
    op.execute("""
        CREATE OR REPLACE FUNCTION ensure_bidirectional_equivalence()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Only create reverse if this is an INSERT
            IF (TG_OP = 'INSERT') THEN
                -- Check if reverse already exists
                IF NOT EXISTS (
                    SELECT 1 FROM parts_equivalence 
                    WHERE part_id = NEW.equivalent_part_id 
                    AND equivalent_part_id = NEW.part_id
                    AND deleted_at IS NULL
                ) THEN
                    -- Auto-insert reverse relationship
                    INSERT INTO parts_equivalence (
                        id, part_id, equivalent_part_id, 
                        created_at, created_by
                    ) VALUES (
                        gen_random_uuid(),
                        NEW.equivalent_part_id,
                        NEW.part_id,
                        NEW.created_at,
                        NEW.created_by
                    );
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
        CREATE TRIGGER trigger_bidirectional_equivalence
        AFTER INSERT ON parts_equivalence
        FOR EACH ROW
        EXECUTE FUNCTION ensure_bidirectional_equivalence();
    """)
    
    # Step 4: Add equivalence_group_id to parts table
    print("Adding equivalence_group_id to parts table...")
    op.add_column('parts', sa.Column('equivalence_group_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Step 5: Create indexes for performance
    print("Creating indexes...")
    op.create_index('idx_parts_equivalence_group', 'parts', ['equivalence_group_id'])
    op.create_index('idx_parts_equiv_part_id', 'parts_equivalence', ['part_id'], 
                    postgresql_where=sa.text('deleted_at IS NULL'))
    op.create_index('idx_parts_equiv_equiv_id', 'parts_equivalence', ['equivalent_part_id'],
                    postgresql_where=sa.text('deleted_at IS NULL'))
    op.create_index('idx_parts_equiv_created_at', 'parts_equivalence', ['created_at'])
    
    print("Migration complete! Run data migration script to populate equivalence_group_id.")


def downgrade():
    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS trigger_bidirectional_equivalence ON parts_equivalence")
    op.execute("DROP FUNCTION IF EXISTS ensure_bidirectional_equivalence()")
    
    # Drop indexes
    op.drop_index('idx_parts_equiv_created_at', table_name='parts_equivalence')
    op.drop_index('idx_parts_equiv_equiv_id', table_name='parts_equivalence')
    op.drop_index('idx_parts_equiv_part_id', table_name='parts_equivalence')
    op.drop_index('idx_parts_equivalence_group', table_name='parts')
    
    # Drop equivalence_group_id from parts
    op.drop_column('parts', 'equivalence_group_id')
    
    # Drop foreign keys
    op.drop_constraint('fk_parts_equiv_deleted_by', 'parts_equivalence', type_='foreignkey')
    op.drop_constraint('fk_parts_equiv_created_by', 'parts_equivalence', type_='foreignkey')
    
    # Drop unique constraint
    op.drop_constraint('uq_parts_equivalence_parts', 'parts_equivalence', type_='unique')
    
    # Drop new primary key and restore composite key
    op.execute("ALTER TABLE parts_equivalence DROP CONSTRAINT IF EXISTS parts_equivalence_pkey")
    
    # Drop audit columns from parts_equivalence
    op.drop_column('parts_equivalence', 'deleted_by')
    op.drop_column('parts_equivalence', 'deleted_at')
    op.drop_column('parts_equivalence', 'created_by')
    op.drop_column('parts_equivalence', 'created_at')
    op.drop_column('parts_equivalence', 'id')
    
    # Restore original composite primary key
    op.execute("ALTER TABLE parts_equivalence ADD PRIMARY KEY (part_id, equivalent_part_id)")

