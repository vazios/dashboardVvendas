// src/hooks/useSalesData.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DateRange } from 'react-day-picker';
import { format, parseISO, subDays } from 'date-fns';
import { toast } from '@/hooks/use-toast';

// Tipos para os dados
interface SaleItem {
  produto: { descricao: string };
  quantidade: number;
  valor_unitario: number;
}

interface RawSale {
  codigo: string;
  cliente?: { nome_razao?: string };
  data: string;
  origin?: string;
  itens?: SaleItem[];
  acrescimo?: number;
  desconto?: number;
  formaPagamento?: { descricao?: string };
  pagamentos?: {
    codigo: string;
    valor?: number;
    formaPagamento?: { descricao?: string };
  }[];
  valor?: number;
}

export interface ProcessedSale {
  id: string;
  codigo: string;
  cliente: string;
  data: string;
  canal: string;
  valor: number;
  formaPagamento: string;
  itens: SaleItem[];
}

// URL da nossa API Python
const API_URL = '/api/generate-report';

export const useSalesData = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estado principal dos dados
  const [data, setData] = useState<ProcessedSale[]>([]);
  const [fullData, setFullData] = useState<RawSale[]>([]); // Mantém os dados brutos para modais
  const [isLoading, setIsLoading] = useState(false);

  // Estados dos filtros
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(() => searchParams.get('paymentMethod') || "all");
  const [selectedChannel, setSelectedChannel] = useState(() => searchParams.get('channel') || "all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from && to) {
      return { from: parseISO(from), to: parseISO(to) };
    }
    // Padrão para os últimos 30 dias se não houver nada na URL
    const toDate = new Date();
    const fromDate = subDays(toDate, 29);
    return { from: fromDate, to: toDate };
  });

  // Efeito para atualizar a URL quando os filtros mudam
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedPaymentMethod !== "all") params.set('paymentMethod', selectedPaymentMethod);
    if (selectedChannel !== "all") params.set('channel', selectedChannel);
    if (dateRange?.from) params.set('from', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('to', format(dateRange.to, 'yyyy-MM-dd'));
    setSearchParams(params, { replace: true });
  }, [selectedPaymentMethod, selectedChannel, dateRange, setSearchParams]);

  // Função que processa o JSON bruto vindo da API
  const processJsonData = useCallback((jsonData: { data: RawSale[] }): ProcessedSale[] => {
    if (!jsonData || !Array.isArray(jsonData.data)) {
      setFullData([]);
      return [];
    }
    
    setFullData(jsonData.data);

    const processedSales: ProcessedSale[] = [];
    jsonData.data.forEach(item => {
      const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      const baseSale = {
        codigo: item.codigo,
        cliente: item.cliente?.nome_razao || 'Não identificado',
        data: dataFormatada,
        canal: item.origin || 'Não informado',
        itens: item.itens || [],
      };

      if (item.formaPagamento?.descricao === "COMPOSTO" && Array.isArray(item.pagamentos) && item.pagamentos.length > 0) {
        const totalPagamentosBruto = item.pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0);
        const valorTotalLiquido = item.valor || 0;
        const fatorAjuste = totalPagamentosBruto > 0 ? valorTotalLiquido / totalPagamentosBruto : 1;

        item.pagamentos.forEach(payment => {
          processedSales.push({
            ...baseSale,
            id: `${item.codigo}-${payment.codigo}`,
            valor: (payment.valor || 0) * fatorAjuste,
            formaPagamento: payment.formaPagamento?.descricao || 'Não informado',
          });
        });
      } else {
        processedSales.push({
          ...baseSale,
          id: item.codigo,
          valor: item.valor || 0,
          formaPagamento: item.formaPagamento?.descricao || 'Não informado',
        });
      }
    });

    return processedSales;
  }, []);

  // Nova função para buscar dados da API
  const fetchReportData = useCallback(async (token: string, range: DateRange) => {
    if (!range.from || !range.to) {
      toast({ title: "Erro", description: "Por favor, selecione um período de datas válido.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    setData([]);
    setFullData([]);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          data_inicio: format(range.from, 'yyyy-MM-dd'),
          data_fim: format(range.to, 'yyyy-MM-dd'),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      const processedData = processJsonData(result);

      if (processedData.length === 0) {
        toast({ title: "Nenhum dado encontrado", description: "A consulta foi bem-sucedida, mas não retornou vendas para o período.", variant: "default" });
      } else {
        toast({ title: "Relatório gerado!", description: `${processedData.length} registros de pagamento encontrados.` });
      }
      
      setData(processedData);

    } catch (error) {
      console.error("Erro ao buscar dados da API:", error);
      toast({ title: "Erro de Conexão", description: `Não foi possível conectar à API. Verifique se o servidor Python está rodando. Detalhe: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [processJsonData]);

  // Filtra os dados com base nos seletores
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const paymentMethodMatch = selectedPaymentMethod === 'all' || item.formaPagamento === selectedPaymentMethod;
      const channelMatch = selectedChannel === 'all' || item.canal === selectedChannel;
      return paymentMethodMatch && channelMatch;
    });
  }, [data, selectedPaymentMethod, selectedChannel]);

  const resetFilters = useCallback(() => {
    setSelectedPaymentMethod("all");
    setSelectedChannel("all");
  }, []);

  const paymentMethods = useMemo(() => [...new Set(data.map(item => item.formaPagamento))], [data]);
  const channels = useMemo(() => [...new Set(data.map(item => item.canal))], [data]);

  return {
    data,
    filteredData,
    fullData,
    isLoading,
    filters: {
      paymentMethod: selectedPaymentMethod,
      channel: selectedChannel,
      dateRange,
      paymentMethods,
      channels,
    },
    actions: {
      fetchReportData,
      resetFilters,
      setPaymentMethod: setSelectedPaymentMethod,
      setChannel: setSelectedChannel,
      setDateRange,
    }
  };
};
