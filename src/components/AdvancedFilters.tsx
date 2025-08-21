import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Filter } from "lucide-react";
import { DateRange } from "react-day-picker";

interface AdvancedFiltersProps {
  paymentMethods: string[];
  channels: string[];
  dateRange: DateRange | undefined;
  selectedPaymentMethod: string;
  selectedChannel: string;
  onPaymentMethodChange: (value: string) => void;
  onChannelChange: (value: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  paymentMethods,
  channels,
  dateRange,
  selectedPaymentMethod,
  selectedChannel,
  onPaymentMethodChange,
  onChannelChange,
  onDateRangeChange,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5 text-blue-600" />
          Filtros de Análise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Filtros de Seleção */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Forma de Pagamento
            </label>
            <Select value={selectedPaymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as formas</SelectItem>
                {paymentMethods.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Canal
            </label>
            <Select value={selectedChannel} onValueChange={onChannelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um canal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                {channels.map(channel => (
                  <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Período */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Período
            </label>
            <DateRangePicker date={dateRange} onDateChange={onDateRangeChange} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters;