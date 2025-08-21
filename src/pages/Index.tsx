import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, BarChart3, FileDown, X, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SalesChart from "@/components/SalesChart";
import TrendChart from "@/components/TrendChart";
import SalesDetailModal from "@/components/SalesDetailModal";
import SaleItemsModal from "@/components/SaleItemsModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import SeasonalityChart from "@/components/SeasonalityChart";
import CustomerRanking from "@/components/CustomerRanking";
import TopProducts from "@/components/TopProducts";

import AdvancedFilters from "@/components/AdvancedFilters";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSalesData } from "@/hooks/useSalesData";
import { cn } from "@/lib/utils";

const Index = () => {
  const {
    filteredData,
    fullData,
    isLoading,
    filters,
    actions,
  } = useSalesData();

  const [token, setToken] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState([]);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const summaryRef = useRef(null);
  const salesChartRef = useRef(null);
  const trendChartRef = useRef(null);

  const handleGenerateReport = () => {
    if (!token) {
      toast({ title: "Token obrigatório", description: "Por favor, insira seu token da API.", variant: "destructive" });
      return;
    }
    if (!filters.dateRange || !filters.dateRange.from || !filters.dateRange.to) {
      toast({ title: "Período obrigatório", description: "Por favor, selecione as datas de início e fim.", variant: "destructive" });
      return;
    }
    actions.fetchReportData(token, filters.dateRange);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    toast({ title: "Gerando PDF...", description: "Aguarde enquanto preparamos seu relatório." });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let yPos = margin;

      pdf.setFontSize(18);
      pdf.text("Relatório de Vendas", pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      if (summaryRef.current) {
        const canvas = await html2canvas(summaryRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      }

      if (salesChartRef.current) {
        const canvas = await html2canvas(salesChartRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      }
      
      if (trendChartRef.current) {
        pdf.addPage();
        yPos = margin;
        const canvas = await html2canvas(trendChartRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
      }

      pdf.save("relatorio-de-vendas.pdf");
      toast({ title: "Sucesso!", description: "Seu relatório em PDF foi gerado." });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ title: "Erro", description: "Não foi possível gerar o relatório em PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    const jsonString = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_vendas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Sucesso!", description: "Seu relatório em JSON foi gerado." });
  };

  const handleChartClick = (paymentMethod) => {
    const details = filteredData.filter(item => item.formaPagamento === paymentMethod);
    setSelectedPaymentDetails(details);
    setIsModalOpen(true);
  };

  const handleViewSaleDetails = (saleId) => {
    const sale = fullData.find(item => item.codigo === saleId);
    if (sale) {
      const dataFormatada = new Date(sale.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      setSelectedSaleDetails({ ...sale, cliente: sale.cliente?.nome_razao || 'Não identificado', formaPagamento: sale.formaPagamento?.descricao || 'Não informado', canal: sale.origin || 'Não informado', data: dataFormatada });
      setIsItemsModalOpen(true);
    }
  };

  const getPaymentMethodSummary = () => {
    const summary = {};
    filteredData.forEach(item => {
      if (!summary[item.formaPagamento]) summary[item.formaPagamento] = 0;
      summary[item.formaPagamento] += Number(item.valor) || 0;
    });
    return Object.entries(summary).map(([name, value]) => ({ name, value: Number(value) }));
  };

  const getDailySales = () => {
    const dailySales = {};
    filteredData.forEach(item => {
      if (!dailySales[item.data]) dailySales[item.data] = 0;
      dailySales[item.data] += Number(item.valor) || 0;
    });
    return Object.entries(dailySales).map(([date, total]) => ({ date, total })).sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });
  };

  const getTotalSales = () => {
    return filteredData.reduce((total, item) => total + (Number(item.valor) || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-200">Dashboard de Vendas</h1>
            <p className="text-slate-600 dark:text-slate-400">Sistema de Análise e Conferência de Vendas</p>
          </div>
          <ThemeToggle />
        </div>

        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Token da API</label>
              <Input type="password" placeholder="Insira seu token" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !filters.dateRange?.from && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? format(filters.dateRange.from, "dd/MM/yyyy") : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.from}
                    onSelect={(date) => actions.setDateRange({ from: date, to: filters.dateRange?.to })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !filters.dateRange?.to && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.to ? format(filters.dateRange.to, "dd/MM/yyyy") : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.to}
                    onSelect={(date) => actions.setDateRange({ from: filters.dateRange?.from, to: date })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
              {isLoading ? "Gerando..." : "Gerar Relatório"}
            </Button>
          </CardContent>
        </Card>

        {filteredData.length > 0 && !isLoading && (
          <>
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300">Ações</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={actions.resetFilters} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  <Button onClick={handleExportPdf} disabled={isExporting}>
                    <FileDown className="h-4 w-4 mr-2" />
                    {isExporting ? "Exportando..." : "Exportar PDF"}
                  </Button>
                  <Button onClick={handleExportJson}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar JSON
                  </Button>
                </div>
              </CardContent>
            </Card>

            <AdvancedFilters
              paymentMethods={filters.paymentMethods}
              channels={filters.channels}
              dateRange={filters.dateRange}
              selectedPaymentMethod={filters.paymentMethod}
              selectedChannel={filters.channel}
              onPaymentMethodChange={actions.setPaymentMethod}
              onChannelChange={actions.setChannel}
              onDateRangeChange={actions.setDateRange}
            />

            <div ref={summaryRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total de Vendas</p>
                      <h3 className="text-2xl sm:text-3xl font-bold">R$ {getTotalSales().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Número de Vendas</p>
                      <h3 className="text-2xl sm:text-3xl font-bold">{[...new Set(filteredData.map(item => item.codigo))].length}</h3>
                    </div>
                    <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Ticket Médio</p>
                      <h3 className="text-2xl sm:text-3xl font-bold">R$ {filteredData.length > 0 ? (getTotalSales() / [...new Set(filteredData.map(item => item.codigo))].length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</h3>
                    </div>
                    <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div ref={salesChartRef}><SalesChart data={getPaymentMethodSummary()} onBarClick={handleChartClick} /></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div ref={trendChartRef}><TrendChart data={getDailySales()} /></div>
              <SeasonalityChart data={filteredData} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <CustomerRanking data={filteredData} />
              <TopProducts data={filteredData} />
            </div>

            <SalesDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} data={selectedPaymentDetails} onViewSaleDetails={handleViewSaleDetails} />
            <SaleItemsModal isOpen={isItemsModalOpen} onClose={() => setIsItemsModalOpen(false)} saleDetails={selectedSaleDetails} />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
