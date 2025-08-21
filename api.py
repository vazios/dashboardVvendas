from flask import Flask, request, jsonify
from flask_cors import CORS
from gerar_json import get_vendas_com_cache
import traceback

# Inicializa a aplicação Flask
app = Flask(__name__)
# Habilita o CORS para permitir requisições do frontend (React)
CORS(app)

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    """
    Endpoint da API para gerar o relatório de vendas.
    Recebe token, data de início e data de fim via JSON.
    """
    try:
        # Pega os dados enviados na requisição
        data = request.get_json()
        token = data.get('token')
        data_inicio = data.get('data_inicio')
        data_fim = data.get('data_fim')

        # Validação simples das entradas
        if not all([token, data_inicio, data_fim]):
            return jsonify({"error": "Parâmetros 'token', 'data_inicio' e 'data_fim' são obrigatórios."}), 400

        # Chama a função de coleta de dados importada
        print(f"Iniciando coleta de dados para o período de {data_inicio} a {data_fim}...")
        resultado_json = get_vendas_com_cache(token, data_inicio, data_fim)
        print("Coleta de dados finalizada com sucesso.")

        # Retorna os dados coletados como uma resposta JSON
        return jsonify(resultado_json)

    except Exception as e:
        # Em caso de erro, retorna uma mensagem de erro detalhada
        print(f"Ocorreu um erro na API: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Executa o servidor na porta 5000, acessível na rede local
    app.run(host='0.0.0.0', port=5000, debug=True)
