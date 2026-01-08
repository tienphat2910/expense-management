'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import MoneyInput from '@/components/MoneyInput';
import PageTransition from '@/components/Animations/PageTransition';
import AnimatedSection from '@/components/Animations/AnimatedSection';
import StaggerContainer, { itemVariants } from '@/components/Animations/StaggerContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Wallet as WalletIcon, 
  CreditCard,
  Smartphone,
  Building2,
  TrendingUp,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

interface Wallet {
  _id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'credit-card' | 'investment' | 'other';
  balance: number;
  currency: string;
  description?: string;
  icon?: string;
  color: string;
  isActive: boolean;
}

const walletTypeIcons = {
  cash: WalletIcon,
  bank: Building2,
  ewallet: Smartphone,
  'credit-card': CreditCard,
  investment: TrendingUp,
  other: WalletIcon,
};

const walletTypeNames = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  ewallet: 'Ví điện tử',
  'credit-card': 'Thẻ tín dụng',
  investment: 'Đầu tư',
  other: 'Khác',
};

const walletTypeColors = {
  cash: '#10b981',
  bank: '#3b82f6',
  ewallet: '#8b5cf6',
  'credit-card': '#ef4444',
  investment: '#f59e0b',
  other: '#6b7280',
};

export default function WalletsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as Wallet['type'],
    balance: '',
    currency: 'VND',
    description: '',
    color: walletTypeColors.cash,
  });

  useEffect(() => {
    const user = api.getUser();
    if (!user) {
      router.push('/sign-in');
      return;
    }
    loadWallets();
  }, []);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const response = await api.wallets.getAll();
      if (response.success && response.data) {
        setWallets(response.data.wallets || []);
        setTotalBalance(response.data.totalBalance || 0);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        balance: parseFloat(formData.balance) || 0,
      };

      let response;
      if (editingWallet) {
        response = await api.wallets.update(editingWallet._id, data);
      } else {
        response = await api.wallets.create(data);
      }

      if (response.success) {
        toast.success(editingWallet ? 'Cập nhật ví thành công!' : 'Tạo ví thành công!');
        setShowModal(false);
        resetForm();
        loadWallets();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra!');
      }
    } catch (error) {
      console.error('Error saving wallet:', error);
      toast.error('Có lỗi xảy ra khi lưu ví!');
    }
  };

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance.toString(),
      currency: wallet.currency,
      description: wallet.description || '',
      color: wallet.color,
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa ví này?')) return;
    
    try {
      const response = await api.wallets.delete(id);
      if (response.success) {
        loadWallets();
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
    setActiveMenu(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cash',
      balance: '',
      currency: 'VND',
      description: '',
      color: walletTypeColors.cash,
    });
    setEditingWallet(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleTypeChange = (type: Wallet['type']) => {
    setFormData({
      ...formData,
      type,
      color: walletTypeColors[type],
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <PageTransition>
          {/* Header Section */}
          <AnimatedSection className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ví tiền</h1>
                <p className="text-gray-600">Quản lý tất cả các ví của bạn</p>
              </div>
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setButtonPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm ví</span>
            </button>
          </div>
        </AnimatedSection>

        {/* Total Balance Card */}
        <AnimatedSection delay={0.1} className="bg-blue-600 text-white rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Tổng số dư</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-4xl font-bold">
            {showBalance ? formatCurrency(totalBalance) : '••••••••'}
          </p>
          <p className="text-blue-100 text-sm mt-2">
            {wallets.filter(w => w.isActive).length} ví đang hoạt động
          </p>
        </AnimatedSection>

        {/* Wallets Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <WalletIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Chưa có ví nào</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tạo ví đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((wallet) => {
              const Icon = walletTypeIcons[wallet.type];
              return (
                <div
                  key={wallet._id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow relative"
                  style={{ opacity: wallet.isActive ? 1 : 0.6 }}
                >
                  {/* Menu Button */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setActiveMenu(activeMenu === wallet._id ? null : wallet._id)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                    
                    {activeMenu === wallet._id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => handleEdit(wallet)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 className="w-4 h-4" />
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleDelete(wallet._id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Wallet Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: wallet.color + '20' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: wallet.color }} />
                  </div>

                  {/* Wallet Info */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {wallet.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {walletTypeNames[wallet.type]}
                  </p>

                  {/* Balance */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Số dư</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {showBalance ? formatCurrency(wallet.balance) : '••••••••'}
                    </p>
                  </div>

                  {/* Description */}
                  {wallet.description && (
                    <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                      {wallet.description}
                    </p>
                  )}

                  {!wallet.isActive && (
                    <div className="mt-3 text-xs text-red-600 font-medium">
                      Đã vô hiệu hóa
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </PageTransition>
      </main>

      {/* Add/Edit Wallet Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
              <motion.div
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: buttonPosition.x - window.innerWidth / 2,
                  y: buttonPosition.y - window.innerHeight / 2
                }}
                animate={{ 
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: 0
                }}
                exit={{ 
                  opacity: 0,
                  scale: 0,
                  x: buttonPosition.x - window.innerWidth / 2,
                  y: buttonPosition.y - window.innerHeight / 2
                }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingWallet ? 'Sửa ví' : 'Thêm ví mới'}
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên ví *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Ví tiền mặt"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại ví *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(walletTypeNames) as Wallet['type'][]).map((type) => {
                    const Icon = walletTypeIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeChange(type)}
                        className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                          formData.type === type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" style={{ color: walletTypeColors[type] }} />
                        <span className="text-sm">{walletTypeNames[type]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số dư ban đầu (VND)
                </label>
                <MoneyInput
                  value={formData.balance}
                  onChange={(value) => setFormData({ ...formData, balance: value })}
                  className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0"
                />
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
                  placeholder="Thêm ghi chú về ví này..."
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
                  {editingWallet ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
          </>
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
      <Footer />
    </div>
  );
}
