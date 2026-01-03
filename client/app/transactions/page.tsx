'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '@/lib/api';
import MoneyInput from '@/components/MoneyInput';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Briefcase,
  Gift,
  TrendingUp,
  Store,
  Clock,
  Home,
  Percent,
  DollarSign,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Zap,
  Gamepad2,
  Heart,
  GraduationCap,
  Dumbbell,
  Plane,
  Smartphone,
  Wifi,
  Shield,
  Sparkles,
  PawPrint,
  MoreHorizontal,
  LucideIcon
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import categoriesData from '@/data/categories.json';

// Hàm lấy giờ hiện tại theo múi giờ Vietnam (Asia/Ho_Chi_Minh)
const getVietnamDateTime = () => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  // Sử dụng locale 'sv-SE' để có format YYYY-MM-DD HH:mm
  const formatter = new Intl.DateTimeFormat('sv-SE', options);
  const dateTimeString = formatter.format(new Date());
  
  // Chuyển "2026-01-04 00:54" thành "2026-01-04T00:54"
  return dateTimeString.replace(' ', 'T');
};

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Gift,
  TrendingUp,
  Store,
  Clock,
  Home,
  Percent,
  DollarSign,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Zap,
  Gamepad2,
  Heart,
  GraduationCap,
  Dumbbell,
  Plane,
  Smartphone,
  Wifi,
  Shield,
  Sparkles,
  PawPrint,
  MoreHorizontal,
};

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description?: string;
  categoryId?: {
    _id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  category?: {
    _id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  walletId?: {
    _id: string;
    name: string;
    type: string;
    color?: string;
  };
  transactionDate: string;
  paymentMethod?: string;
  tags?: string[];
}

interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

interface WalletType {
  _id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    categoryId: '',
    categoryIcon: '',
    categoryColor: '',
    walletId: '',
    description: '',
    transactionDate: getVietnamDateTime(),
    tags: '',
  });

  useEffect(() => {
    const user = api.getUser();
    if (!user) {
      router.push('/sign-in');
      return;
    }
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsRes, categoriesRes, walletsRes] = await Promise.all([
        api.transactions.getAll(currentPage, itemsPerPage),
        api.categories.getAll(),
        api.wallets.getAll(),
      ]);

      if (transactionsRes.success && transactionsRes.data) {
        setTransactions(transactionsRes.data.transactions || transactionsRes.data);
        setTotalPages(transactionsRes.data.totalPages || 1);
      }

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      if (walletsRes.success && walletsRes.data) {
        setWallets(walletsRes.data.wallets || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      const response = await api.transactions.create(data);
      if (response.success) {
        toast.success('Thêm giao dịch thành công!');
        setShowModal(false);
        resetForm();
        await loadData();
      } else {
        toast.error(response.message || 'Thêm giao dịch thất bại!');
      }
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm giao dịch!');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      categoryId: '',
      categoryIcon: '',
      categoryColor: '',
      walletId: '',
      description: '',
      transactionDate: getVietnamDateTime(),
      tags: '',
    });
    setEditingTransaction(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchQuery || 
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.categoryId?.name || transaction.category?.name)?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || 
      (transaction.categoryId?.name === filterCategory || transaction.category?.name === filterCategory);
    
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Giao dịch</h1>
          <p className="text-gray-600">Quản lý tất cả các giao dịch thu chi của bạn</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm giao dịch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Bộ lọc</span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm giao dịch</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giao dịch
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-[42px]"
                >
                  <option value="all">Tất cả</option>
                  <option value="income">Thu nhập</option>
                  <option value="expense">Chi tiêu</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-[42px]"
                >
                  <option value="all">Tất cả danh mục</option>
                  {[...categoriesData.income, ...categoriesData.expense].map((category, index) => (
                    <option key={index} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoảng thời gian
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">Không có giao dịch nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ví
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(transaction.transactionDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: (transaction.categoryId?.color || transaction.category?.color) + '20' }}
                          >
                            {transaction.type === 'income' ? (
                              <ArrowDownLeft className="w-4 h-4" style={{ color: (transaction.categoryId?.color || transaction.category?.color) || '#10b981' }} />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" style={{ color: (transaction.categoryId?.color || transaction.category?.color) || '#ef4444' }} />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {transaction.categoryId?.name || transaction.category?.name || 'Không có danh mục'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {transaction.description || '-'}
                        </div>
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {transaction.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {transaction.walletId?.name || 'Không có ví'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div key={transaction._id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: (transaction.categoryId?.color || transaction.category?.color) + '20' }}
                      >
                        {transaction.type === 'income' ? (
                          <ArrowDownLeft className="w-5 h-5" style={{ color: (transaction.categoryId?.color || transaction.category?.color) || '#10b981' }} />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" style={{ color: (transaction.categoryId?.color || transaction.category?.color) || '#ef4444' }} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.categoryId?.name || transaction.category?.name || 'Không có danh mục'}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(transaction.transactionDate)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  {transaction.description && (
                    <p className="text-sm text-gray-600 mb-2">{transaction.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      <span>{transaction.walletId?.name || 'Không có ví'}</span>
                    </div>
                    {transaction.tags && transaction.tags.length > 0 && (
                      <div className="flex gap-1">
                        {transaction.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Add/Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giao dịch *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`py-2 px-4 border rounded-lg transition-colors ${
                      formData.type === 'expense'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`py-2 px-4 border rounded-lg transition-colors ${
                      formData.type === 'income'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Thu nhập
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền (VND) *
                </label>
                <MoneyInput
                  required
                  value={formData.amount}
                  onChange={(value) => setFormData({ ...formData, amount: value })}
                  className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {(formData.type === 'income' ? categoriesData.income : categoriesData.expense).map((category, index) => {
                    const IconComponent = iconMap[category.icon];
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          categoryId: category.name,
                          categoryIcon: category.icon,
                          categoryColor: category.color
                        })}
                        className={`flex items-center gap-2 p-3 border rounded-lg transition-colors text-left ${
                          formData.categoryId === category.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {IconComponent && (
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            <IconComponent className="w-4 h-4" style={{ color: category.color }} />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ví *
                </label>
                <select
                  required
                  value={formData.walletId}
                  onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Chọn ví</option>
                  {wallets
                    .filter(wallet => wallet.balance >= 0)
                    .map((wallet) => (
                      <option key={wallet._id} value={wallet._id}>
                        {wallet.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(wallet.balance)})
                      </option>
                    ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                  placeholder="Thêm ghi chú..."
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày giờ giao dịch *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhãn (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="ví dụ: mua sắm, ăn uống"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTransaction ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
