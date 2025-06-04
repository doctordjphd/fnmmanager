-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    paypal_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    seat_count INTEGER NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'completed',
    table_assignment INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tables table for organizing players
CREATE TABLE IF NOT EXISTS event_tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER NOT NULL,
    event_date DATE NOT NULL,
    max_players INTEGER DEFAULT 4,
    current_players INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_number, event_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_event_date ON reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_table_assignment ON reservations(table_assignment);
CREATE INDEX IF NOT EXISTS idx_event_tables_date ON event_tables(event_date);
