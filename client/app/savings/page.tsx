'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '@/lib/api';
import MoneyInput from '@/components/MoneyInput';
import {
  Plus,
  PiggyBank,
  TrendingUp,
  Calendar,
  Target,
  Wallet as WalletIcon,
  Edit,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  MoreVertical,
  Eye,
  Users,
  Copy,
  Link as LinkIcon,
  Search,
  X,
  UserPlus,
  Loader2,
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
  isShared?: boolean;
  members?: Array<{
    userId: {
      _id: string;
      username: string;
      email: string;
      fullName?: string;
    };
    role: 'owner' | 'member';
    contributedAmount: number;
    joinedAt: string;
  }>;
  inviteToken?: string;
}

interface WalletType {
  _id: string;
  name: string;
  type: string;
  balance: number;
}

export default function SavingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedSaving, setSelectedSaving] = useState<SavingsGoal | null>(null);
  const [editingSaving, setEditingSaving] = useState<SavingsGoal | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    deadline: '',
    color: '#3b82f6',
  });

  const [transactionAmount, setTransactionAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const user = api.getUser();
    if (!user) {
      router.push('/sign-in');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [savingsRes, walletsRes] = await Promise.all([
        api.savings.getAll(),
        api.wallets.getAll(),
      ]);

      if (savingsRes.success && savingsRes.data) {
        setSavings(savingsRes.data.savings || []);
        setTotalSaved(savingsRes.data.totalSaved || 0);
      }

      if (walletsRes.success && walletsRes.data) {
        setWallets(walletsRes.data.wallets || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        deadline: formData.deadline || undefined,
      };

      const response = editingSaving
        ? await api.savings.update(editingSaving._id, data)
        : await api.savings.create(data);

      if (response.success) {
        toast.success(editingSaving ? 'Cập nhật thành công!' : 'Tạo mục tiết kiệm thành công!');
        setShowModal(false);
        resetForm();
        await loadData();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra!');
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleTransaction = async () => {
    if (!selectedSaving || !transactionAmount || !selectedWalletId) {
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
          ? await api.savings.deposit(selectedSaving._id, amount, selectedWalletId)
          : await api.savings.withdraw(selectedSaving._id, amount, selectedWalletId);

      if (response.success) {
        toast.success(
          transactionType === 'deposit' ? 'Nạp tiền thành công!' : 'Rút tiền thành công!'
        );
        setShowTransactionModal(false);
        setTransactionAmount('');
        setSelectedWalletId('');
        setSelectedSaving(null);
        await loadData();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra!');
      }
    } catch (error: any) {
      console.error('Error transaction:', error);
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục tiết kiệm này? Số tiền sẽ được hoàn lại ví.')) return;

    try {
      const response = await api.savings.delete(id);
      if (response.success) {
        toast.success('Xóa thành công!');
        await loadData();
      } else {
        toast.error(response.message || 'Xóa thất bại!');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Có lỗi xảy ra!');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      targetAmount: '',
      deadline: '',
      color: '#3b82f6',
    });
    setEditingSaving(null);
  };

  const openEditModal = (saving: SavingsGoal) => {
    setEditingSaving(saving);
    setFormData({
      name: saving.name,
      description: saving.description || '',
      targetAmount: saving.targetAmount.toString(),
      deadline: saving.deadline ? format(new Date(saving.deadline), 'yyyy-MM-dd') : '',
      color: saving.color,
    });
    setShowModal(true);
  };

  const openTransactionModal = (saving: SavingsGoal, type: 'deposit' | 'withdraw') => {
    setSelectedSaving(saving);
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  const handleGenerateInviteLink = async (saving: SavingsGoal) => {
    setSelectedSaving(saving);
    try {
      const response = await api.savings.generateInvite(saving._id);
      if (response.success) {
        setInviteLink(response.data.inviteUrl);
        setShowInviteModal(true);
        toast.success('Tạo link mời thành công!');
      } else {
        toast.error(response.message || 'Không thể tạo link mời');
      }
    } catch (error) {
      console.error('Error generating invite:', error);
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Đã sao chép link!');
  };

  const handleSearchUsers = async (query: string) => {
    setSearchUsername(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const user = api.getUser();
      console.log('Searching for:', query, 'excluding userId:', user?._id);
      const response = await api.savings.searchUsers(query, user?._id);
      console.log('Search response:', response);
      if (response.success) {
        setSearchResults(response.data);
        console.log('Search results:', response.data);
      } else {
        console.error('Search failed:', response.message);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!selectedSaving) return;

    try {
      const response = await api.savings.inviteUser(selectedSaving._id, userId);
      if (response.success) {
        toast.success('Mời thành viên thành công!');
        setSearchUsername('');
        setSearchResults([]);
        await loadData();
      } else {
        toast.error(response.message || 'Không thể mời thành viên');
      }
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedSaving) return;
    
    if (!confirm('Bạn có chắc muốn xóa thành viên này?')) return;

    try {
      const response = await api.savings.removeMember(selectedSaving._id, userId);
      if (response.success) {
        toast.success('Xóa thành viên thành công!');
        await loadData();
      } else {
        toast.error(response.message || 'Không thể xóa thành viên');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Có lỗi xảy ra!');
    }
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tiết kiệm</h1>
            <p className="text-gray-600">Thêm mục tiêu tiết kiệm</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm mục tiêu</span>
          </button>
        </div>

        {/* Total Saved Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-6 h-6" />
                <span className="text-green-100">Tổng tiền tiết kiệm</span>
              </div>
              <p className="text-4xl font-bold">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="text-right">
              <p className="text-green-100 text-sm">Số mục đang tiết kiệm</p>
              <p className="text-3xl font-bold">
                {savings.filter((s) => s.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        {/* Savings Goals List */}
        {savings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <PiggyBank className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có mục tiết kiệm</h3>
            <p className="text-gray-600 mb-6">Tạo mục tiết kiệm đầu tiên của bạn</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Tạo mục tiết kiệm</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savings.map((saving) => (
              <div
                key={saving._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: saving.color + '20' }}
                    >
                      <PiggyBank className="w-6 h-6" style={{ color: saving.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{saving.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(saving.status)}`}>
                        {getStatusText(saving.status)}
                      </span>
                    </div>
                  </div>
                  <div className="relative" ref={openMenuId === saving._id ? menuRef : null}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === saving._id ? null : saving._id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    {openMenuId === saving._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => {
                            router.push(`/savings/${saving._id}`);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="w-4 h-4" />
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => {
                            handleGenerateInviteLink(saving);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Users className="w-4 h-4" />
                          Mời thành viên
                        </button>
                        <button
                          onClick={() => {
                            openEditModal(saving);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(saving._id);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {saving.description && (
                  <p className="text-sm text-gray-600 mb-4">{saving.description}</p>
                )}

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Tiến độ</span>
                    <span className="font-semibold text-gray-900">
                      {saving.progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
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

                {/* Info */}
                <div className="space-y-2 mb-4">
                  {saving.deadline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Hạn: {format(new Date(saving.deadline), 'dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {saving.status === 'active' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openTransactionModal(saving, 'deposit')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Nạp</span>
                    </button>
                    <button
                      onClick={() => openTransactionModal(saving, 'withdraw')}
                      disabled={saving.currentAmount === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Rút</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSaving ? 'Chỉnh sửa mục tiết kiệm' : 'Tạo mục tiết kiệm mới'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên mục tiêu *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Ví dụ: Mua laptop mới"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                  placeholder="Mô tả ngắn gọn..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền mục tiêu *
                </label>
                <MoneyInput
                  required
                  value={formData.targetAmount}
                  onChange={(value) => setFormData({ ...formData, targetAmount: value })}
                  className="w-full px-2 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hạn hoàn thành (tuỳ chọn)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-2 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingSaving ? 'Cập nhật' : 'Tạo mục tiêu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedSaving && (
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
                  setSelectedSaving(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Mục tiêu</p>
                <p className="font-semibold text-gray-900">{selectedSaving.name}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Số tiền đã tiết kiệm:{' '}
                  <span className="font-semibold">
                    {formatCurrency(selectedSaving.currentAmount)}
                  </span>
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
                    setSelectedSaving(null);
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

      {/* Invite Members Modal */}
      {showInviteModal && selectedSaving && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Mời thành viên
              </h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteLink('');
                  setSearchUsername('');
                  setSearchResults([]);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invite Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link mời
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Sao chép
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Link có hiệu lực trong 7 ngày. Chia sẻ link này để mời người khác tham gia.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 text-center mb-4">hoặc</p>
              </div>

              {/* Search Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm theo username
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchUsername}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Nhập username..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Search Results */}
                {searchingUsers && (
                  <div className="mt-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin inline-block text-blue-600" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <button
                          onClick={() => handleInviteUser(user._id)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          Mời
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchUsername.length >= 2 && !searchingUsers && searchResults.length === 0 && (
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    Không tìm thấy user nào
                  </p>
                )}
              </div>

              {/* Current Members */}
              {selectedSaving.members && selectedSaving.members.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Thành viên ({selectedSaving.members.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedSaving.members.map((member) => (
                      <div
                        key={member.userId._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{member.userId.username}</p>
                          <p className="text-xs text-gray-500">
                            {member.role === 'owner' ? 'Chủ sở hữu' : 'Thành viên'}
                          </p>
                        </div>
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.userId._id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
