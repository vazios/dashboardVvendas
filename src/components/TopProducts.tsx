import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Package, TrendingUp } from "lucide-react";

interface ProductData {
  nome: string;
  total: number;
  quantidade: number;
  ranking: number;
}

const TopProducts = ({ data }) => {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getTopProducts = (): ProductData[] => {
    const productData: { [key: string]: { nome: string; total: number; quantidade: number } } = {};

    data.forEach(sale => {
      (sale.itens || []).forEach(item => {
        const productName = item.produto.descricao;
        if (!productData[productName]) {
          productData[productName] = {
            nome: productName,
            total: 0,
            quantidade: 0,
          };
        }
        productData[productName].total += item.quantidade * item.valor_unitario;
        productData[productName].quantidade += item.quantidade;
      });
    });

    const sortedProducts = (Object.values(productData) as { nome: string; total: number; quantidade: number }[])
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return sortedProducts.map((product, index) => ({
      ...product,
      ranking: index + 1,
    }));
  };

  const topProducts = getTopProducts();

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Crown className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Crown className="h-5 w-5 text-orange-600" />;
      default:
        return <Package className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Ranking de Produtos
        </CardTitle>
        <p className="text-sm text-slate-600">Top 10 produtos por receita</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topProducts.map((product) => (
            <div 
              key={product.nome} 
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getRankingIcon(product.ranking)}
                <div>
                  <p className="font-medium text-slate-800">{product.nome}</p>
                  <div className="flex gap-4 text-xs text-slate-600">
                    <span>{product.quantidade} unidades vendidas</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">
                  {formatCurrency(product.total)}
                </p>
              </div>
            </div>
          ))}
        </div>
        {topProducts.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum produto encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProducts;
