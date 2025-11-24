#!/bin/bash
# Database setup script

echo "Creating database..."
docker-compose exec -T db psql -U aidrigs -c "SELECT datname FROM pg_database WHERE datname='aidrigs_parts_db';" | grep aidrigs_parts_db

if [ $? -ne 0 ]; then
    echo "Database doesn't exist, it should be created automatically"
else
    echo "Database exists"
fi

echo "Running migrations..."
docker-compose exec backend poetry run alembic upgrade head

echo "Seeding data..."
docker-compose exec backend python -m app.scripts.seed_data

echo "Database setup complete!"
