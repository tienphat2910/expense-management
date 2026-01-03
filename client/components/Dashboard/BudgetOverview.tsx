interface Budget {
  _id: string;
  categoryId: {
    name: string;
    icon?: string;
    color?: string;
  };
  amount: number;
  spent: number;
  period: string;
}

interface BudgetOverviewProps {
  budgets: Budget[];
}

export default function BudgetOverview({ budgets }: BudgetOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const calculatePercentage = (spent: number, total: number) => {
    return Math.min(Math.round((spent / total) * 100), 100);
  };

  if (budgets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan ngân sách</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có ngân sách nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tổng quan ngân sách</h3>
        <a href="/budgets" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Xem tất cả
        </a>
      </div>

      <div className="space-y-6">
        {budgets.map((budget) => {
          const percentage = calculatePercentage(budget.spent, budget.amount);
          const isWarning = percentage >= 80;
          const isDanger = percentage >= 100;

          return (
            <div key={budget._id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {budget.categoryId.name}
                </span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isDanger
                      ? "bg-red-600"
                      : isWarning
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">{budget.period}</span>
                <span
                  className={`text-xs font-medium ${
                    isDanger
                      ? "text-red-600"
                      : isWarning
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
