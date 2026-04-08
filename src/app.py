from flask import Flask, request, jsonify, render_template, redirect
from flask_cors import CORS
from database import get_db_connection, init_db, inserir_leitura, buscar_leitura, atualizar_leitura, deletar_leitura

app = Flask(__name__)

# Configuração explícita do CORS
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

@app.route('/', methods=['GET'])
def index():
    return redirect('/dashboard')

@app.route('/ultimas', methods=['GET'])
def ultimas():
    init_db()
    conn = get_db_connection()
    leituras = conn.execute('SELECT * FROM leituras ORDER BY timestamp DESC LIMIT 10').fetchall()
    conn.close()
    return jsonify([dict(leitura) for leitura in leituras])


@app.route('/leituras', methods=['GET'])
def listar():
    conn = get_db_connection()
    leituras = conn.execute('SELECT * FROM leituras ORDER BY timestamp').fetchall()
    conn.close()
    return jsonify([dict(leitura) for leitura in leituras])

@app.route('/leituras', methods=['POST'])
def criar():
    init_db()
    dados = request.get_json()
    if not dados:
        return jsonify({'error': 'Dados inválidos'}), 400
    id_novo = inserir_leitura(dados['temperatura'], dados['umidade'], dados['pressao'])
    return jsonify({'id': id_novo, 'status': 'criado'}), 201

@app.route('/leituras/<int:id>', methods=['GET'])
def detalhe(id):
    leitura = buscar_leitura(id)
    if not leitura:
        return jsonify({'error': 'Leitura não encontrada'}), 404
    return jsonify(dict(leitura))

@app.route('/leituras/<int:id>', methods=['PUT'])
def atualizar(id):
    dados = request.get_json()
    if not dados:
        return jsonify({'error': 'Dados inválidos'}), 400
    leitura = buscar_leitura(id)
    if not leitura:
        return jsonify({'error': 'Leitura não encontrada'}), 404
    atualizar_leitura(id, dados)
    return jsonify({'id': id, 'status': 'atualizado'})

@app.route('/leituras/<int:id>', methods=['DELETE'])
def deletar(id):
    leitura = buscar_leitura(id)
    if not leitura:
        return jsonify({'error': 'Leitura não encontrada'}), 404
    deletar_leitura(id)
    return jsonify({'id': id, 'status': 'deletado'})

@app.route('/historico', methods=['GET'])
def historico():
    return render_template('historico.html')


@app.route('/editar/<int:id>', methods=['GET', 'POST'])
def editar(id):
    leitura = buscar_leitura(id)
    if not leitura:
        return 'Leitura não encontrada', 404

    if request.method == 'POST':
        temperatura = request.form.get('temperatura')
        umidade = request.form.get('umidade')
        pressao = request.form.get('pressao')

        if not temperatura or not umidade or not pressao:
            return 'Dados inválidos', 400

        try:
            dados = {
                'temperatura': float(temperatura),
                'umidade': float(umidade),
                'pressao': float(pressao)
            }
        except ValueError:
            return 'Valores devem ser numéricos', 400

        atualizar_leitura(id, dados)
        return redirect('/historico')

    return render_template('editar.html', leitura=leitura)


@app.route('/dashboard', methods=['GET'])
def dashboard():
    return render_template('index.html')


@app.route('/api/estatisticas', methods=['GET'])
def estatisticas():
    conn = get_db_connection()
    stats = conn.execute('''
        SELECT
            AVG(temperatura) AS temp_media,
            AVG(umidade)     AS umid_media,
            AVG(pressao)     AS pressao_media,
            MIN(temperatura) AS temp_min,
            MAX(temperatura) AS temp_max,
            MIN(umidade)     AS umid_min,
            MAX(umidade)     AS umid_max,
            MIN(pressao)     AS pressao_min,
            MAX(pressao)     AS pressao_max
        FROM leituras
    ''').fetchone()
    conn.close()

    return jsonify({
        'temperatura_media':  stats['temp_media'],
        'temperatura_minima': stats['temp_min'],
        'temperatura_maxima': stats['temp_max'],
        'umidade_media':      stats['umid_media'],
        'umidade_minima':     stats['umid_min'],
        'umidade_maxima':     stats['umid_max'],
        'pressao_media':      stats['pressao_media'],
        'pressao_minima':     stats['pressao_min'],
        'pressao_maxima':     stats['pressao_max'],
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True)