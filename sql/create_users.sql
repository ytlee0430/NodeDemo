CREATE TABLE IF NOT EXISTS users (
    acct VARCHAR(32) PRIMARY KEY, 
    pwd VARCHAR(32) NOT NULL, 
    fullname VARCHAR(32) NOT NULL, 
    created_at TIMESTAMP NOT NUll, 
    updated_at TIMESTAMP);
