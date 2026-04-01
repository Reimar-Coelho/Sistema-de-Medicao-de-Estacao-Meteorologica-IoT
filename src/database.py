import sqlite3

def get_db_connection():
    conn = sqlite3.connect('dados.db', timeout=10)
    conn.execute('PRAGMA journal_mode=WAL;')
    conn.execute('PRAGMA busy_timeout=5000;')
    conn.row_factory = sqlite3.Row
    return conn