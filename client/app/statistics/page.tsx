'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '@/lib/api';
import PageTransition from '@/components/Animations/PageTransition';
import AnimatedSection from '@/components/Animations/AnimatedSection';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  DollarSign,
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subWeeks, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  transactionDate: string;
  categoryId?: {
    name: string;
    color?: string;
  };
}

interface CategoryStat {
  name: string;
  value: number;
  color: string;
}

interface DailyStat {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'week' | 'month'>('month');
  const [filterPeriod, setFilterPeriod] = useState(0); // 0: current, -1: last, -2: 2 periods ago
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  });

  useEffect(() => {
    const user = api.getUser();
    if (!user) {
      router.push('/sign-in');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterPeriod]);

  const getDateRange = () => {
    const now = new Date();
    let start, end;

    if (filterType === 'week') {
      const targetDate = subWeeks(now, Math.abs(filterPeriod));
      start = startOfWeek(targetDate, { weekStartsOn: 1 });
      end = endOfWeek(targetDate, { weekStartsOn: 1 });
    } else {
      const targetDate = subMonths(now, Math.abs(filterPeriod));
      start = startOfMonth(targetDate);
      end = endOfMonth(targetDate);
    }

    return { start, end };
  };

  const getPeriodLabel = () => {
    const { start, end } = getDateRange();
    if (filterType === 'week') {
      return `Tuần ${format(start, 'dd/MM', { locale: vi })} - ${format(end, 'dd/MM/yyyy', { locale: vi })}`;
    } else {
      return `Tháng ${format(start, 'MM/yyyy', { locale: vi })}`;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');

      const [statsRes, transactionsRes] = await Promise.all([
        api.statistics.getSummary(startDate, endDate),
        api.transactions.getAll(1, 1000), // Get all for filtering
      ]);

      if (statsRes.success && statsRes.data) {
        setSummary(statsRes.data);
      }

      if (transactionsRes.success && transactionsRes.data) {
        const allTransactions = transactionsRes.data.transactions || transactionsRes.data;
        // Filter transactions by date range
        const filtered = allTransactions.filter((t: Transaction) => {
          const date = new Date(t.transactionDate);
          return date >= start && date <= end;
        });
        setTransactions(filtered);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('Không thể tải dữ liệu thống kê!');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Calculate category statistics
  const getCategoryStats = (type: 'income' | 'expense'): CategoryStat[] => {
    const categoryMap = new Map<string, { value: number; color: string }>();

    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        const name = t.categoryId?.name || 'Khác';
        const color = t.categoryId?.color || (type === 'income' ? '#10b981' : '#ef4444');
        const current = categoryMap.get(name) || { value: 0, color };
        categoryMap.set(name, {
          value: current.value + t.amount,
          color,
        });
      });

    return Array.from(categoryMap.entries())
      .map(([name, { value, color }]) => ({ name, value, color }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  };

  // Calculate daily statistics
  const getDailyStats = (): DailyStat[] => {
    const { start, end } = getDateRange();
    const dailyMap = new Map<string, { income: number; expense: number }>();

    // Initialize all dates in range
    const current = new Date(start);
    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd');
      dailyMap.set(dateStr, { income: 0, expense: 0 });
      current.setDate(current.getDate() + 1);
    }

    // Populate with transaction data
    transactions.forEach((t) => {
      const dateStr = format(new Date(t.transactionDate), 'yyyy-MM-dd');
      const current = dailyMap.get(dateStr);
      if (current) {
        if (t.type === 'income') {
          current.income += t.amount;
        } else {
          current.expense += t.amount;
        }
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, { income, expense }]) => ({
        date: format(new Date(date), 'dd/MM', { locale: vi }),
        income,
        expense,
        balance: income - expense,
      }))
      .slice(0, filterType === 'week' ? 7 : 31);
  };

  const incomeCategories = getCategoryStats('income');
  const expenseCategories = getCategoryStats('expense');
  const dailyStats = getDailyStats();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <PageTransition>
          {/* Header Section */}
          <AnimatedSection className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê</h1>
            <p className="text-gray-600">Phân tích chi tiết thu chi của bạn</p>
          </AnimatedSection>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Bộ lọc:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFilterType('week');
                    setFilterPeriod(0);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterType === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tuần
                </button>
                <button
                  onClick={() => {
                    setFilterType('month');
                    setFilterPeriod(0);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterType === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tháng
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterPeriod((p) => p - 1)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ←
              </button>
              <div className="flex items-center gap-2 min-w-[200px] justify-center">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">{getPeriodLabel()}</span>
              </div>
              <button
                onClick={() => setFilterPeriod((p) => Math.min(0, p + 1))}
                disabled={filterPeriod === 0}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100">Tổng thu nhập</span>
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(summary.totalIncome)}</p>
            <p className="text-green-100 text-sm mt-2">{getPeriodLabel()}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-100">Tổng chi tiêu</span>
              <TrendingDown className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(summary.totalExpense)}</p>
            <p className="text-red-100 text-sm mt-2">{getPeriodLabel()}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100">Chênh lệch</span>
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(summary.totalIncome - summary.totalExpense)}
            </p>
            <p className="text-blue-100 text-sm mt-2">
              {summary.totalIncome - summary.totalExpense >= 0 ? 'Dương' : 'Âm'}
            </p>
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Xu hướng thu chi theo ngày</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyStats}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis width={80} />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorIncome)"
                name="Thu nhập"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorExpense)"
                name="Chi tiêu"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Income vs Expense Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">So sánh thu chi</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis width={80} />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Thu nhập" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Chi tiêu" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Income Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Phân bổ thu nhập theo danh mục</h2>
            {incomeCategories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={incomeCategories as any}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                      label={false}
                      labelLine={false}
                    >
                      {incomeCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {incomeCategories.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-700">{cat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">Chưa có dữ liệu thu nhập</div>
            )}
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Phân bổ chi tiêu theo danh mục</h2>
            {expenseCategories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={expenseCategories as any}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                      label={false}
                      labelLine={false}
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {expenseCategories.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-700">{cat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">Chưa có dữ liệu chi tiêu</div>
            )}
          </div>
        </div>

        {/* Balance Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Biểu đồ chênh lệch thu chi</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis width={80} />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
                name="Chênh lệch"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        </PageTransition>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Footer />
    </div>
  );
}
