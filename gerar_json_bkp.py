import requests
import json
import time
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

def gerar_periodos(data_inicio, data_fim):
    """Gera lista de tuplas (inicio, fim) mês a mês"""
    periodos = []
    inicio = datetime.strptime(data_inicio, "%Y-%m-%d")
    fim = datetime.strptime(data_fim, "%Y-%m-%d")

    while inicio <= fim:
        # último dia do mês
        ultimo_dia = (inicio.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        fim_mes = min(ultimo_dia, fim)
        periodos.append((inicio.strftime("%Y-%m-%d"), fim_mes.strftime("%Y-%m-%d")))
        inicio = fim_mes + timedelta(days=1)

    return periodos

def coletar_vendas(data_inicio, data_fim, token):
    base_url = "https://report.yooga.com.br/vendas"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    params = {
        "inverse": "true",
        "origin": "",
        "data_inicio": data_inicio,
        "data_fim": data_fim,
        "hora_inicio": "00:00",
        "hora_fim": "23:59",
        "page": 1,
        "query": ""
    }

    all_vendas = []
    totais = {
        "desconto": 0,
        "valor": 0,
        "acrescimo": 0,
        "total_pagamentos": 0
    }
    agrupamento = {
        "valorBrutoFaturado": 0,
        "valorLiquido": 0,
        "totalDescontos": 0,
        "totalAcrescimos": 0,
        "totalDescontosIfood": 0,
        "totalAcrescimosIfood": 0,
        "totalItens": 0,
        "totalPedido": 0
    }

    while True:
        resp = requests.get(base_url, headers=headers, params=params)
        if resp.status_code == 401:
            raise Exception("⚠️ Token inválido ou expirado. Pegue um novo no painel.")
        if resp.status_code == 429:
            print("⏳ Muitas requisições... aguardando 2s antes de tentar de novo")
            time.sleep(2)
            continue

        resp.raise_for_status()
        data = resp.json()

        all_vendas.extend(data["data"])

        # soma totais
        for k in totais:
            totais[k] += data["totais"].get(k, 0)

        # soma agrupamentos
        for k in agrupamento:
            agrupamento[k] += data["agrupamento"].get(k, 0)

        print(f"Página {data['page']} de {data['lastPage']} coletada ({data_inicio} → {data_fim})")

        if data["page"] >= data["lastPage"]:
            break

        params["page"] += 1
        time.sleep(0.3)  # pequeno delay entre páginas

    return all_vendas, totais, agrupamento

if __name__ == "__main__":
    load_dotenv()
    TOKEN = os.getenv("YOOGA_TOKEN")
    if not TOKEN:
        raise ValueError("O token não foi encontrado. Defina a variável de ambiente YOOGA_TOKEN no arquivo .env")

    DATA_INICIO = "2024-01-01"
    DATA_FIM = "2025-08-18"

    periodos = gerar_periodos(DATA_INICIO, DATA_FIM)

    todas_vendas = []
    totais_geral = {
        "desconto": 0,
        "valor": 0,
        "acrescimo": 0,
        "total_pagamentos": 0
    }
    agrupamento_geral = {
        "valorBrutoFaturado": 0,
        "valorLiquido": 0,
        "totalDescontos": 0,
        "totalAcrescimos": 0,
        "totalDescontosIfood": 0,
        "totalAcrescimosIfood": 0,
        "totalItens": 0,
        "totalPedido": 0
    }

    for inicio, fim in periodos:
        vendas, totais, agrupamento = coletar_vendas(inicio, fim, TOKEN)

        todas_vendas.extend(vendas)

        for k in totais_geral:
            totais_geral[k] += totais[k]
        for k in agrupamento_geral:
            agrupamento_geral[k] += agrupamento[k]

    resultado = {
        "total": len(todas_vendas),
        "perPage": len(todas_vendas),
        "page": 1,
        "lastPage": 1,
        "data": todas_vendas,
        "totais": totais_geral,
        "agrupamento": agrupamento_geral
    }

    with open("vendas_consolidadas.json", "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print(f"✅ Arquivo salvo com {len(todas_vendas)} registros consolidados.")


