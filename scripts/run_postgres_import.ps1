$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$script = 'C:\Users\Engin\OneDrive\Desktop\SQL\PostgreSQL\StoryVisionAI_PostgreSQL.sql'

$exists = & $psql -h localhost -p 5432 -U postgres -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname='storyvisionai'"
if (-not $exists) {
    & $psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE storyvisionai;" | Out-Null
}

& $psql -h localhost -p 5432 -U postgres -d storyvisionai -v ON_ERROR_STOP=1 -f $script

& $psql -h localhost -p 5432 -U postgres -d storyvisionai -Atc "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
& $psql -h localhost -p 5432 -U postgres -d storyvisionai -Atc "SELECT title || '|' || status FROM story ORDER BY created_at DESC LIMIT 1;"
