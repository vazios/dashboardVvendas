import streamlit as st
import json
from datetime import datetime, timedelta
import os
import pandas as pd

# Importa a lógica de coleta de dados do outro arquivo
from gerar_json_bkp import (
    gerar_periodos,
    coletar_vendas,
)

NOME_ARQUIVO = "vendas_consolidadas.json"

def formatar_brl(valor):
    """Formata um número para o padrão monetário brasileiro (R$ 1.234,56)."""
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def calcular_kpis(vendas_validas):
    """Calcula os KPIs a partir de uma lista de vendas já filtrada."""
    if not vendas_validas:
        return {
            "valor_liquido": 0,
            "total_pedidos": 0,
            "total_descontos": 0,
            "ticket_medio": 0
        }

    df = pd.DataFrame(vendas_validas)
    
    valor_liquido = df['valor'].sum()
    total_pedidos = len(df)
    total_descontos = df['desconto'].sum()
    ticket_medio = valor_liquido / total_pedidos if total_pedidos > 0 else 0

    # Converte os tipos do NumPy para tipos nativos do Python
    return {
        "valor_liquido": float(valor_liquido),
        "total_pedidos": int(total_pedidos),
        "total_descontos": float(total_descontos),
        "ticket_medio": float(ticket_medio)
    }

def main():
    """Função principal que renderiza a página do Streamlit."""
    st.set_page_config(page_title="Gerador de Relatórios Yooga", layout="wide")
    st.title("📊 Gerador de Relatório de Vendas Yooga")

    if 'resultado' not in st.session_state:
        st.session_state.resultado = None

    st.markdown("""
    Esta ferramenta automatiza a coleta de dados de vendas da API Yooga.
    **Importante:** Vendas canceladas são desconsideradas nos cálculos e gráficos.
    """)

    with st.expander("1. Insira suas credenciais e período", expanded=True):
        token = st.text_input(
            "Token de Autenticação Yooga",
            type="password",
            help="Seu token de acesso à API. Ele não será salvo."
        )
        data_fim_padrao = datetime.today()
        data_inicio_padrao = data_fim_padrao - timedelta(days=30)
        periodo_selecionado = st.date_input(
            "Selecione o Período",
            (data_inicio_padrao, data_fim_padrao),
            format="DD/MM/YYYY"
        )

    if st.button("Gerar Relatório", type="primary", use_container_width=True):
        st.session_state.resultado = None
        if not token:
            st.warning("Por favor, insira o token de autenticação.")
            return
        if not periodo_selecionado or len(periodo_selecionado) != 2:
            st.warning("Por favor, selecione um período de datas válido.")
            return

        data_inicio_str = periodo_selecionado[0].strftime("%Y-%m-%d")
        data_fim_str = periodo_selecionado[1].strftime("%Y-%m-%d")

        if periodo_selecionado[0] > periodo_selecionado[1]:
            st.error("A data de início não pode ser posterior à data de fim.")
            return

        try:
            todas_vendas_brutas = []
            with st.spinner(f"Coletando dados de {data_inicio_str} a {data_fim_str}..."):
                periodos = gerar_periodos(data_inicio_str, data_fim_str)
                progress_bar = st.progress(0, text="Iniciando...")
                
                for i, (inicio, fim) in enumerate(periodos):
                    status_text = f"Coletando mês: {inicio} a {fim}"
                    progress_bar.progress((i + 1) / len(periodos), text=status_text)
                    
                    vendas, _, __ = coletar_vendas(inicio, fim, token)
                    todas_vendas_brutas.extend(vendas)
            
            vendas_validas = [v for v in todas_vendas_brutas if v.get('data_del') is None]
            kpis = calcular_kpis(vendas_validas)

            resultado_final = {
                "total": len(vendas_validas),
                "data": vendas_validas,
                "kpis": kpis
            }
            
            st.session_state.resultado = resultado_final

            with open(NOME_ARQUIVO, "w", encoding="utf-8") as f:
                json.dump(resultado_final, f, ensure_ascii=False, indent=2)
            
            st.success(f"✅ Relatório gerado! {len(todas_vendas_brutas)} registros encontrados, {len(vendas_validas)} são válidos.")

        except Exception as e:
            st.error(f"Ocorreu um erro: {e}")
            st.session_state.resultado = None

    st.header("2. Análise de Vendas")
    if st.session_state.resultado:
        vendas_validas = st.session_state.resultado.get("data", [])
        kpis = st.session_state.resultado.get("kpis", {})

        st.subheader("Indicadores Principais")
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric(label="💰 Valor Líquido", value=formatar_brl(kpis.get("valor_liquido", 0)))
        with col2:
            st.metric(label="📦 Total de Pedidos", value=f"{kpis.get('total_pedidos', 0)}")
        with col3:
            st.metric(label="💸 Total de Descontos", value=formatar_brl(kpis.get("total_descontos", 0)))
        with col4:
            st.metric(label="🛒 Ticket Médio", value=formatar_brl(kpis.get("ticket_medio", 0)))

        st.divider()

        st.subheader("Vendas por Forma de Pagamento")
        if vendas_validas:
            pagamentos_individuais = []
            for venda in vendas_validas:
                if 'pagamentos' in venda and venda['pagamentos']:
                    for pagamento in venda['pagamentos']:
                        pagamentos_individuais.append({
                            'forma': pagamento.get('nome', 'Não Informado'),
                            'valor': pagamento.get('valor', 0)
                        })
            
            if pagamentos_individuais:
                df_pagamentos = pd.DataFrame(pagamentos_individuais)
                vendas_por_forma = df_pagamentos.groupby('forma')['valor'].sum().sort_values(ascending=False)
                st.bar_chart(vendas_por_forma)
            else:
                st.info("Não foram encontrados dados de pagamentos para exibir o gráfico.")
        else:
            st.info("Não há dados de vendas válidas para exibir o gráfico.")

    else:
        st.info("Gere um relatório para que a análise apareça aqui.")

    st.header("3. Baixar Relatório Completo")
    if st.session_state.resultado:
        resultado_para_download = {
            "total": st.session_state.resultado.get("total"),
            "kpis": st.session_state.resultado.get("kpis"),
            "data": st.session_state.resultado.get("data")
        }
        json_string = json.dumps(resultado_para_download, ensure_ascii=False, indent=2)
        st.download_button(
            label="Baixar Arquivo JSON (Apenas Vendas Válidas)",
            data=json_string,
            file_name=NOME_ARQUIVO,
            mime="application/json",
            use_container_width=True
        )
    else:
        st.info("Gere um relatório para que o botão de download apareça aqui.")

if __name__ == "__main__":
    main()
