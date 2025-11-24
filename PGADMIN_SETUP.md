# pgAdmin Configuration Guide

## Accessing pgAdmin

1. **URL**: http://localhost:5050
2. **Login Credentials**:
   - Email: `admin@aidrigs.com`
   - Password: `admin123`

## Adding AidRigs Database Server

After logging into pgAdmin:

### Step 1: Add New Server
1. Right-click on "Servers" in the left panel
2. Select "Register" → "Server..."

### Step 2: General Tab
- **Name**: `AidRigs Local`

### Step 3: Connection Tab
- **Host name/address**: `db` (Docker service name)
- **Port**: `5432`
- **Maintenance database**: `aidrigs_parts_db`
- **Username**: `aidrigs`
- **Password**: `aidrigs_dev_password`
- **Save password**: ✓ (check this box)

### Step 4: Click "Save"

## Quick Access Commands

### View All Tables
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname='public' 
ORDER BY tablename;
```

### View Table Data
```sql
-- View roles
SELECT * FROM roles;

-- View categories  
SELECT * FROM categories;

-- View users
SELECT * FROM users;

-- Count records in all tables
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM quote_ident(schemaname)||'.'||quote_ident(tablename)) as row_count
FROM pg_tables 
WHERE schemaname='public';
```

## Troubleshooting

### Can't Connect to Database
1. Make sure all Docker containers are running:
   ```bash
   docker-compose ps
   ```

2. Check if database is accessible:
   ```bash
   docker-compose exec db psql -U aidrigs -d aidrigs_parts_db -c "SELECT 1"
   ```

### Forgot pgAdmin Password
1. Stop pgAdmin container
2. Remove pgadmin volume: `docker volume rm aidrigs-parts-db_pgadmin_data`
3. Restart: `docker-compose up -d pgadmin`

## Features to Try

1. **Query Tool**: Write and execute SQL queries
2. **Table View**: Browse table data with filtering
3. **ERD Diagram**: Generate entity relationship diagrams
4. **Import/Export**: Import CSV data or export query results
5. **Backup/Restore**: Create database backups
