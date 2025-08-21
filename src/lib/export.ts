// src/lib/export.ts
import * as XLSX from 'xlsx';
import { ProcessedSale } from '@/hooks/useSalesData';

export const exportToExcel = (data: ProcessedSale[], fileName: string = 'relatorio_vendas') => {
  // Mapeia os dados para um formato mais legível, selecionando e renomeando as colunas
  const mappedData = data.map(sale => ({
    'Código da Venda': sale.codigo,
    'Cliente': sale.cliente,
    'Data': sale.data,
    'Canal de Venda': sale.canal,
    'Forma de Pagamento': sale.formaPagamento,
    'Valor (R$)': sale.valor,
  }));

  // Cria uma nova planilha a partir dos dados mapeados
  const worksheet = XLSX.utils.json_to_sheet(mappedData);

  // Cria um novo workbook
  const workbook = XLSX.utils.book_new();

  // Anexa a planilha ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');

  // Define a largura das colunas para melhor visualização
  worksheet['!cols'] = [
    { wch: 20 }, // Código da Venda
    { wch: 40 }, // Cliente
    { wch: 15 }, // Data
    { wch: 20 }, // Canal de Venda
    { wch: 25 }, // Forma de Pagamento
    { wch: 15 }, // Valor (R$)
  ];

  // Gera o arquivo .xlsx e dispara o download
  XLSX.writeFile(workbook, `${fileName}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
};
