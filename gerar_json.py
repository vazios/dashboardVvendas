import requests
import json
import time
from datetime import datetime, timedelta
import os
import pandas as pd
from itertools import groupby

def gerar_periodos(data_inicio, data_fim):
    """Gera lista de tuplas (inicio, fim) para a busca de dados."""
    periodos = []
    inicio = datetime.strptime(data_inicio, "%Y-%m-%d")
    fim = datetime.strptime(data_fim, "%Y-%m-%d")
    while inicio <= fim:
        ultimo_dia = (inicio.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        fim_mes = min(ultimo_dia, fim)
        periodos.append((inicio.strftime("%Y-%m-%d"), fim_mes.strftime("%Y-%m-%d")))
        inicio = fim_mes + timedelta(days=1)
    return periodos

def coletar_vendas(data_inicio, data_fim, token):
    """Busca as vendas da API, página por página, para um dado período."""
    base_url = "https://report.yooga.com.br/vendas"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    params = {
        "inverse": "true", "origin": "", "data_inicio": data_inicio,
        "data_fim": data_fim, "hora_inicio": "00:00", "hora_fim": "23:59",
        "page": 1, "query": ""
    }
    all_vendas = []
    while True:
        try:
            resp = requests.get(base_url, headers=headers, params=params)
            if resp.status_code == 401: raise Exception("Token inválido ou expirado.")
            if resp.status_code == 429:
                print("Rate limit... aguardando 2s.")
                time.sleep(2)
                continue
            resp.raise_for_status()
            data = resp.json()
            all_vendas.extend(data.get("data", []))
            print(f"Página {data.get('page', 1)} de {data.get('lastPage', 1)} coletada ({data_inicio} → {data_fim})")
            if data.get("page", 1) >= data.get("lastPage", 1): break
            params["page"] += 1
            time.sleep(0.3)
        except requests.exceptions.RequestException as e:
            print(f"Erro de rede: {e}. Tentando novamente em 5s.")
            time.sleep(5)
    return all_vendas

def calcular_kpis(vendas_validas):
    """Calcula os KPIs a partir de uma lista de vendas já consolidada."""
    if not vendas_validas:
        return {"valor_liquido": 0, "total_pedidos": 0, "total_descontos": 0, "ticket_medio": 0}
    
    df = pd.DataFrame(vendas_validas)
    valor_liquido = df['valor'].sum()
    total_pedidos = len(df)
    total_descontos = df['desconto'].sum()
    ticket_medio = valor_liquido / total_pedidos if total_pedidos > 0 else 0
    
    return {
        "valor_liquido": float(valor_liquido),
        "total_pedidos": int(total_pedidos),
        "total_descontos": float(total_descontos),
        "ticket_medio": float(ticket_medio)
    }

def get_vendas_com_cache(token, data_inicio, data_fim):
    """
    Função principal chamada pela API.
    Orquestra a coleta, o processamento e a consolidação dos dados de vendas.
    """
    periodos = gerar_periodos(data_inicio, data_fim)
    
    todas_vendas_brutas = []
    for inicio, fim in periodos:
        vendas = coletar_vendas(inicio, fim, token)
        todas_vendas_brutas.extend(vendas)
        
    # 1. Filtra vendas canceladas
    vendas_validas_flat = [v for v in todas_vendas_brutas if v.get('data_del') is None]

    # 2. Consolida vendas com múltiplos pagamentos
    vendas_consolidadas = []
    vendas_validas_flat.sort(key=lambda v: v.get('codigo', 0))
    for codigo, grupo in groupby(vendas_validas_flat, key=lambda v: v.get('codigo')):
        if not codigo: continue
        
        grupo_lista = list(grupo)
        venda_base = grupo_lista[0].copy()
        
        pagamentos_consolidados = []
        valor_total_venda = 0
        
        # Itera sobre cada registro de pagamento para a mesma venda
        for venda_item in grupo_lista:
            valor_total_venda += venda_item.get("valor", 0)
            
            # Extrai o objeto de pagamento completo de dentro do array 'pagamentos'
            if venda_item.get('pagamentos') and isinstance(venda_item['pagamentos'], list):
                pagamentos_consolidados.extend(venda_item['pagamentos'])

        venda_base['pagamentos'] = pagamentos_consolidados
        venda_base['valor'] = valor_total_venda
        
        if len(pagamentos_consolidados) > 1:
            venda_base['formaPagamento'] = {"descricao": "COMPOSTO"}
        elif len(pagamentos_consolidados) == 1:
            # Garante que a forma de pagamento principal reflita o único pagamento
            venda_base['formaPagamento'] = pagamentos_consolidados[0].get('formaPagamento', {"descricao": "Não informado"})

        vendas_consolidadas.append(venda_base)

    # 3. Calcula os KPIs sobre os dados finais e consolidados
    kpis = calcular_kpis(vendas_consolidadas)
    
    resultado_final = {
        "total": len(vendas_consolidadas),
        "kpis": kpis,
        "data": vendas_consolidadas
    }
    
    return resultado_final