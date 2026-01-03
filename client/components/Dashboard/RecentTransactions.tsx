interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  transactionDate: string;
  categoryId?: {
    name: string;
    icon?: string;
    color?: string;
  };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Giao dịch gần đây</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có giao dịch nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Giao dịch gần đây</h3>
        <a href="/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Xem tất cả
        </a>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction._id}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center space-x-3 flex-1">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  transaction.type === "income"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {transaction.categoryId?.name || "Khác"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {transaction.description || "Không có mô tả"}
                </p>
              </div>
            </div>
            <div className="text-right ml-4">
              <p
                className={`text-sm font-semibold ${
                  transaction.type === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-gray-500">{formatDate(transaction.transactionDate)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
