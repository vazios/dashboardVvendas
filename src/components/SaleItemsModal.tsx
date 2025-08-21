import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Package, User, Calendar, DollarSign, Hash } from "lucide-react";

const SaleItemsModal = ({ isOpen, onClose, saleDetails }) => {
  if (!saleDetails) {
    return null;
  }

  const formatCurrency = (value) => {
    return `R$ ${(Number(value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const { codigo, cliente, data, valor, itens, acrescimo, desconto } = saleDetails;

  const subtotal = React.useMemo(() => {
    return (itens || []).reduce((acc, item) => {
      return acc + (item.quantidade * item.valor_unitario);
    }, 0);
  }, [itens]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6 text-blue-600" />
            Detalhes da Venda
          </DialogTitle>
          <DialogDescription>
            Visualização detalhada dos itens da venda #{codigo}.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo da Venda */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <Hash className="h-6 w-6 text-slate-500 mb-2" />
              <p className="text-sm text-slate-600">Código</p>
              <p className="font-bold text-slate-800">{codigo}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <User className="h-6 w-6 text-slate-500 mb-2" />
              <p className="text-sm text-slate-600">Cliente</p>
              <p className="font-bold text-slate-800 truncate">{cliente}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 text-slate-500 mb-2" />
              <p className="text-sm text-slate-600">Data</p>
              <p className="font-bold text-slate-800">{data}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <DollarSign className="h-6 w-6 text-green-600 mb-2" />
              <p className="text-sm text-slate-600">Valor Total</p>
              <p className="font-bold text-green-700">{formatCurrency(valor)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Itens */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Produto</TableHead>
                <TableHead className="font-semibold text-center">Qtd.</TableHead>
                <TableHead className="font-semibold text-right">Valor Unit.</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(itens || []).map((item) => (
                <React.Fragment key={item.codigo}>
                  <TableRow className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium">{item.produto.descricao}</TableCell>
                    <TableCell className="text-center">{item.quantidade}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.quantidade * item.valor_unitario)}</TableCell>
                  </TableRow>
                  {/* Composições (Adicionais) */}
                  {(item.composicoes || []).map((comp) => (
                     <TableRow key={comp.codigo} className="bg-slate-50/50 hover:bg-slate-100 transition-colors">
                       <TableCell className="pl-8 text-sm text-slate-600">
                         ↳ {comp.produtoComposicao.descricao}
                       </TableCell>
                       <TableCell className="text-center text-sm text-slate-600">{comp.quantidade_adicional}</TableCell>
                       <TableCell className="text-right text-sm text-slate-600">{formatCurrency(comp.valor_unitario)}</TableCell>
                       <TableCell className="text-right text-sm text-slate-600">{formatCurrency(comp.quantidade_adicional * comp.valor_unitario)}</TableCell>
                     </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(subtotal)}</TableCell>
              </TableRow>
              {acrescimo > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium text-blue-600">Acréscimos</TableCell>
                  <TableCell className="text-right font-semibold text-blue-600">{formatCurrency(acrescimo)}</TableCell>
                </TableRow>
              )}
              {desconto > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium text-red-600">Descontos</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">{formatCurrency(desconto * -1)}</TableCell>
                </TableRow>
              )}
              <TableRow className="bg-slate-100">
                <TableCell colSpan={3} className="text-right font-bold text-lg">Total</TableCell>
                <TableCell className="text-right font-bold text-lg">{formatCurrency(valor)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        
      </DialogContent>
    </Dialog>
  );
};

export default SaleItemsModal;