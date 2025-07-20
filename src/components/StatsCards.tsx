import { DollarSign, Receipt, TrendingUp, Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptStats } from '@/types/receipt';

interface StatsCardsProps {
  stats: ReceiptStats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Spend',
      value: formatCurrency(stats?.totalSpend || 0),
      description: 'Total amount across all receipts',
      icon: DollarSign,
      trend: '+12.5% from last month',
      color: 'text-primary'
    },
    {
      title: 'Total Receipts',
      value: (stats?.totalReceipts || 0).toString(),
      description: 'Number of processed receipts',
      icon: Receipt,
      trend: `${stats?.totalReceipts || 0} receipts processed`,
      color: 'text-info'
    },
    {
      title: 'Average Amount',
      value: formatCurrency(stats?.averageAmount || 0),
      description: 'Mean spending per receipt',
      icon: TrendingUp,
      trend: 'Across all categories',
      color: 'text-success'
    },
    {
      title: 'Median Amount',
      value: formatCurrency(stats?.medianAmount || 0),
      description: 'Middle value of all amounts',
      icon: Calculator,
      trend: `Mode: ${formatCurrency(stats?.modeAmount || 0)}`,
      color: 'text-warning'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <CardDescription className="text-xs">
              {card.description}
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-1">
              {card.trend}
            </p>
          </CardContent>
          <div className={`absolute bottom-0 left-0 w-full h-1 ${card.color.replace('text-', 'bg-')} opacity-20`} />
        </Card>
      ))}
    </div>
  );
};