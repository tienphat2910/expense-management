'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '@/lib/api';
import MoneyInput from '@/components/MoneyInput';
import PageTransition from '@/components/Animations/PageTransition';
import AnimatedSection from '@/components/Animations/AnimatedSection';
import {
  ArrowLeft,
  PiggyBank,
  Calendar,
  Target,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Wallet as WalletIcon,
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SavingsGoal {
  _id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  status: 'active' | 'completed' | 'cancelled';
  icon: string;
  color: string;
  progress: number;
  createdAt: string;
}

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  balanceAfter: number;
  walletId: {
    _id: string;
    name: string;
    type: string;
  };
  createdAt: string;
}

interface WalletType {
  _id: string;
  name: string;
  type: string;
  balance: number;
}

export default function SavingsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SavingsGoal | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showAllTransactions, setShowAllTransactions] = useState(true);
  const [showEditDeadlineModal, setShowEditDeadlineModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');

  useEffect(() => {
    const user = api.getUser();
    if (!user) {
      router.push('/sign-in');
      return;
    }
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [savingRes, walletsRes] = await Promise.all([
        api.savings.getById(id),
        api.wallets.getAll(),
      ]);

      if (savingRes.success && savingRes.data) {
        setSaving(savingRes.data);
      }

      if (walletsRes.success && walletsRes.data) {
        setWallets(walletsRes.data.wallets || []);
      }

      await loadTransactions();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const transactionsRes = showAllTransactions
        ? await api.savings.getTransactions(id)
        : await api.savings.getTransactions(id, 1, 20, selectedMonth, selectedYear);

      if (transactionsRes.success && transactionsRes.data) {
        setTransactions(transactionsRes.data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  useEffect(() => {
    if (saving) {
      loadTransactions();
    }
  }, [showAllTransactions, selectedMonth, selectedYear]);

  const handleTransaction = async () => {
    if (!transactionAmount || !selectedWalletId) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const amount = parseFloat(transactionAmount);
    if (amount <= 0) {
      toast.error('Số tiền không hợp lệ!');
      return;
    }

    try {
      const response =
        transactionType === 'deposit'
          ? await api.savings.deposit(id, amount, selectedWalletId)
          : await api.savings.withdraw(id, amount, selectedWalletId);

      if (response.success) {
        toast.success(
          transactionType === 'deposit' ? 'Nạp tiền thành công!' : 'Rút tiền thành công!'
        );
        setShowTransactionModal(false);
        setTransactionAmount('');
        setSelectedWalletId('');
        await loadData();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra!');
      }
    } catch (error: any) {
      console.error('Error transaction:', error);
      toast.error('Có lỗi xảy ra!');
    }
  };

  const openTransactionModal = (type: 'deposit' | 'withdraw') => {
    setTransactionType(type);
    setSelectedWalletId('');
    setTransactionAmount('');
    setShowTransactionModal(true);
  };

  const handleUpdateDeadline = async () => {
    if (!newDeadline) {
      toast.error('Vui lòng chọn ngày!');
      return;
    }

    try {
      const response = await api.savings.update(id, { deadline: newDeadline });
      if (response.success) {
        toast.success('Cập nhật ngày đến hạn thành công!');
        setShowEditDeadlineModal(false);
        setNewDeadline('');
        await loadData();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra!');
      }
    } catch (error) {
      console.error('Error updating deadline:', error);
      toast.error('Có lỗi xảy ra!');
    }
  };

  const getMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `Tháng ${i + 1}`,
    }));
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      value: currentYear - i,
      label: `${currentYear - i}`,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Đang tiết kiệm';
    }
  };

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

  if (!saving) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Không tìm thấy mục tiết kiệm</p>
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
          {/* Back Button */}
          <AnimatedSection>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
          </AnimatedSection>

          {/* Savings Info Card */}
          <AnimatedSection delay={0.1} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: saving.color + '20' }}
              >
                <PiggyBank className="w-8 h-8" style={{ color: saving.color }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{saving.name}</h1>
                <span className={`text-sm px-3 py-1 rounded ${getStatusColor(saving.status)}`}>
                  {getStatusText(saving.status)}
                </span>
              </div>
            </div>
            {saving.status === 'active' && (
              <div className="flex gap-2">
                <button
                  onClick={() => openTransactionModal('deposit')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <ArrowDownCircle className="w-5 h-5" />
                  <span>Nạp tiền</span>
                </button>
                <button
                  onClick={() => openTransactionModal('withdraw')}
                  disabled={saving.currentAmount === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowUpCircle className="w-5 h-5" />
                  <span>Rút tiền</span>
                </button>
              </div>
            )}
          </div>

          {saving.description && (
            <p className="text-gray-600 mb-6">{saving.description}</p>
          )}

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Tiến độ</span>
              <span className="font-semibold text-gray-900">{saving.progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(saving.progress, 100)}%`,
                  backgroundColor: saving.color,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-900 font-semibold">
                {formatCurrency(saving.currentAmount)}
              </span>
              <span className="text-gray-600">{formatCurrency(saving.targetAmount)}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm">Mục tiêu</span>
              </div>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(saving.targetAmount)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Đã tiết kiệm</span>
              </div>
              <p className="text-xl font-bold text-green-900">
                {formatCurrency(saving.currentAmount)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Còn lại</span>
              </div>
              <p className="text-xl font-bold text-orange-900">
                {formatCurrency(saving.targetAmount - saving.currentAmount)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>
                {saving.deadline
                  ? `Hạn hoàn thành: ${format(new Date(saving.deadline), 'dd/MM/yyyy', { locale: vi })}`
                  : 'Chưa có hạn hoàn thành'}
              </span>
            </div>
            <button
              onClick={() => {
                setNewDeadline(
                  saving.deadline ? format(new Date(saving.deadline), 'yyyy-MM-dd') : ''
                );
                setShowEditDeadlineModal(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {saving.deadline ? 'Chỉnh sửa' : 'Đặt hạn'}
            </button>
          </div>
        </AnimatedSection>

        {/* Transaction History */}
        <AnimatedSection delay={0.2} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Lịch sử giao dịch</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllTransactions(true)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showAllTransactions
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setShowAllTransactions(false)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  !showAllTransactions
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Theo tháng
              </button>
            </div>
          </div>

          {!showAllTransactions && (
            <div className="flex items-center gap-2 mb-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getMonthOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getYearOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <PiggyBank className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {transaction.type === 'deposit' ? (
                        <ArrowDownCircle className="w-5 h-5" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transaction.type === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <WalletIcon className="w-3 h-3" />
                        <span>{transaction.walletId.name}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', {
                            locale: vi,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Số dư: {formatCurrency(transaction.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnimatedSection>
        </PageTransition>
      </main>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {transactionType === 'deposit' ? 'Nạp tiền vào tiết kiệm' : 'Rút tiền từ tiết kiệm'}
              </h2>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setTransactionAmount('');
                  setSelectedWalletId('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Mục tiêu</p>
                <p className="font-semibold text-gray-900">{saving.name}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Số tiền đã tiết kiệm:{' '}
                  <span className="font-semibold">{formatCurrency(saving.currentAmount)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {transactionType === 'deposit' ? 'Chọn ví nguồn' : 'Chọn ví đích'} *
                </label>
                <select
                  required
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-2 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Chọn ví</option>
                  {wallets.map((wallet) => (
                    <option key={wallet._id} value={wallet._id}>
                      {wallet.name} - {formatCurrency(wallet.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền</label>
                <MoneyInput
                  value={transactionAmount}
                  onChange={(value) => setTransactionAmount(value)}
                  className="w-full px-2 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowTransactionModal(false);
                    setTransactionAmount('');
                    setSelectedWalletId('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleTransaction}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors ${
                    transactionType === 'deposit'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {transactionType === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deadline Modal */}
      {showEditDeadlineModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa ngày đến hạn</h2>
              <button
                onClick={() => {
                  setShowEditDeadlineModal(false);
                  setNewDeadline('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày đến hạn
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-2 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditDeadlineModal(false);
                    setNewDeadline('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateDeadline}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Cập nhật
                </button>
              </div>
            </div>
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
