"""rename_description_pr_to_description_fr

Revision ID: e559c18d4036
Revises: add_port_approval
Create Date: 2025-12-12 14:59:54.607429

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e559c18d4036'
down_revision: Union[str, None] = 'add_port_approval'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename column from description_pr to description_fr
    op.alter_column('hs_codes', 'description_pr', new_column_name='description_fr')


def downgrade() -> None:
    # Rename column back from description_fr to description_pr
    op.alter_column('hs_codes', 'description_fr', new_column_name='description_pr')
