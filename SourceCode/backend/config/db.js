const { Pool } = require('pg');

// Uses DATABASE_URL if set, otherwise the standard PG* variables
// (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE).
const pool = new Pool(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {}
);

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error:', err.message);
});

module.exports = pool;
