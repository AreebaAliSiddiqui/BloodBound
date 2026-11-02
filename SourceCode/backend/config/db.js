const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' strings (avoids timezone off-by-one).
types.setTypeParser(1082, (v) => v);

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

