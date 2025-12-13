"""drop_mfg_id_column

Revision ID: 273337e780f7
Revises: e559c18d4036
Create Date: 2025-12-12 17:21:09.118047

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '273337e780f7'
down_revision: Union[str, None] = 'e559c18d4036'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('manufacturers', 'mfg_id')


def downgrade() -> None:
    op.add_column('manufacturers', sa.Column('mfg_id', sa.String(length=10), nullable=False))
    op.create_index('ix_manufacturers_mfg_id', 'manufacturers', ['mfg_id'], unique=True)
