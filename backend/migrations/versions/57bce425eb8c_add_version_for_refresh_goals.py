"""add version for refresh goals

Revision ID: 57bce425eb8c
Revises: 830b88c9f699
Create Date: 2026-08-13 18:04:13.945486

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "57bce425eb8c"
down_revision: Union[str, Sequence[str], None] = "830b88c9f699"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("version", sa.Integer(), server_default="1", nullable=False)
    )


def downgrade() -> None:
    op.drop_column("users", "version")
