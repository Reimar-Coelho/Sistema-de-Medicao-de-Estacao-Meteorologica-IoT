import sqlite3

def get_db_connection():
    conn = sqlite3.connect('dados.db', timeout=10)
    conn.execute('PRAGMA journal_mode=WAL;')
    conn.execute('PRAGMA busy_timeout=5000;')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute(open('schema.sql').read())
    conn.commit()
    conn.close()

def inserir_leitura(temperatura, umidade, pressao):
    conn = get_db_connection()
    conn.execute('INSERT INTO leituras (temperatura, umidade, pressao) VALUES (?, ?, ?)', (temperatura, umidade, pressao))
    conn.commit()
    conn.close()

def buscar_leitura(id):
    conn = get_db_connection()
    leitura = conn.execute('SELECT * FROM leituras WHERE id = ?', (id,)).fetchone()
    conn.close()
    return leitura

def atualizar_leitura(id, dados):
    conn = get_db_connection()
    conn.execute('UPDATE leituras SET temperatura = ?, umidade = ?, pressao = ? WHERE id = ?', (dados['temperatura'], dados['umidade'], dados['pressao'], id))
    conn.commit()
    conn.close()

def deletar_leitura(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM leituras WHERE id = ?', (id,))
    conn.commit()
    conn.close()