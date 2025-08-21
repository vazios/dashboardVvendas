# Dashboard de Análise de Vendas Yooga

Uma aplicação web full-stack desenvolvida para visualizar e analisar dados de vendas exportados da plataforma Yooga. O projeto consome a API de relatórios da Yooga, processa os dados em um backend Python (Flask) e os apresenta em um dashboard interativo construído com React e TypeScript.

<!-- Inserir screenshot da aplicação aqui -->

## 🚀 Funcionalidades

- **Visualização de KPIs:** Métricas chave como Valor Líquido, Total de Pedidos, Total de Descontos e Ticket Médio.
- **Filtros Dinâmicos:** Filtre os dados por período, forma de pagamento e canal de venda.
- **Gráficos Interativos:** Análise visual das vendas por forma de pagamento.
- **Cache Inteligente:** As buscas de dados são salvas em cache por dia, agilizando consultas futuras para os mesmos períodos.
- **Consolidação de Vendas:** Vendas com múltiplos pagamentos (compostas) são agrupadas e tratadas como uma única transação, garantindo a precisão dos dados.
- **Pronto para Deploy:** Configurado para deploy simplificado na plataforma Vercel.

## 🛠️ Tecnologias Utilizadas

**Frontend:**
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Componentes)
- [Tremor](https://www.tremor.so/) (Gráficos e Dashboards)

**Backend:**
- [Python](https://www.python.org/)
- [Flask](https://flask.palletsprojects.com/) (Servidor da API)
- [Pandas](https://pandas.pydata.org/) (Análise e manipulação de dados)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions) (para o deploy)

## 📋 Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina:
- [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
- [Python](https://www.python.org/downloads/) (versão 3.9 ou superior)
- `pip` (gerenciador de pacotes do Python)

## ⚙️ Configuração e Instalação

Siga os passos abaixo para configurar o ambiente de desenvolvimento local.

**1. Clone o Repositório:**
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd <NOME_DO_SEU_PROJETO>
```

**2. Configure o Backend (Python):**
```bash
# Crie um ambiente virtual
python -m venv venv

# Ative o ambiente virtual
# No Windows:
.\venv\Scripts\activate
# No macOS/Linux:
source venv/bin/activate

# Instale as dependências do Python
pip install -r requirements.txt

# Crie o arquivo de variáveis de ambiente
# Crie um arquivo chamado .env na raiz do projeto
```
Dentro do arquivo `.env`, adicione seu token da Yooga:
```
YOOGA_TOKEN="SEU_TOKEN_AQUI"
```

**3. Configure o Frontend (React):**
```bash
# Instale as dependências do Node.js
npm install
```

## ▶️ Executando a Aplicação

Para rodar a aplicação localmente, você precisará de **dois terminais** abertos na raiz do projeto.

**Terminal 1 - Iniciar o Backend:**
```bash
# Certifique-se de que o ambiente virtual (venv) está ativado
python api.py
```
O servidor Flask estará rodando em `http://127.0.0.1:5000`.

**Terminal 2 - Iniciar o Frontend:**
```bash
# Inicia o servidor de desenvolvimento do Vite
npm run dev
```
A aplicação estará acessível em `http://localhost:5173` (ou outra porta, se a 5173 estiver em uso).

## ☁️ Deploy na Vercel

Este projeto está pré-configurado para deploy na Vercel.

1.  **Faça o push do seu código** para um repositório no GitHub.
2.  **Importe o projeto** na Vercel a partir do seu repositório.
3.  **Configure a Variável de Ambiente:**
    - No painel do seu projeto na Vercel, vá para `Settings` -> `Environment Variables`.
    - Adicione a variável `YOOGA_TOKEN` com o seu token da Yooga.
4.  **Clique em "Deploy"**. A Vercel irá automaticamente construir o frontend e implantar a API Python como uma Serverless Function.

## 📂 Estrutura do Projeto

```
/
├── api.py                # Servidor Flask que serve a API
├── gerar_json.py         # Lógica principal para buscar e processar dados da Yooga
├── requirements.txt      # Dependências do Python
├── vercel.json           # Configurações de build e roteamento para a Vercel
├── package.json          # Dependências e scripts do Frontend
├── src/                  # Código-fonte do frontend em React/TypeScript
│   ├── components/       # Componentes da UI
│   ├── hooks/            # Hooks customizados (ex: useSalesData.ts)
│   ├── App.tsx           # Componente principal da aplicação
│   └── main.tsx          # Ponto de entrada do React
└── dist/                 # Pasta de build do frontend (gerada pelo `npm run build`)
```
