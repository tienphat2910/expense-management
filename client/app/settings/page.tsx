'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '@/lib/api';
import {
  Settings as SettingsIcon,
  Trash2,
  AlertTriangle,
  Shield,
  Database,
  User,
  LogOut,
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import PageTransition from '@/components/Animations/PageTransition';
import AnimatedSection from '@/components/Animations/AnimatedSection';

export default function SettingsPage() {
  const router = useRouter();
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const user = api.getUser();

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  const handleResetData = async () => {
    if (confirmText !== 'XÓA TẤT CẢ') {
      toast.error('Vui lòng nhập chính xác "XÓA TẤT CẢ" để xác nhận!');
      return;
    }

    try {
      const response = await api.settings.resetData();
      if (response.success) {
        toast.success('Đã xóa tất cả dữ liệu thành công!');
        setShowResetModal(false);
        setConfirmText('');
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(response.message || 'Có lỗi xảy ra!');
      }
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleLogout = () => {
    api.logout();
    router.push('/sign-in');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <PageTransition>
          {/* Header */}
          <AnimatedSection className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cài đặt</h1>
            <p className="text-gray-600">Quản lý tài khoản và dữ liệu của bạn</p>
          </AnimatedSection>

          {/* Account Info */}
          <AnimatedSection delay={0.1} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Thông tin tài khoản</h2>
              <p className="text-sm text-gray-600">Xem và quản lý thông tin cá nhân</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Tên người dùng:</span>
              <span className="font-medium text-gray-900">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Họ và tên:</span>
              <span className="font-medium text-gray-900">{user?.fullName}</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="mt-4 w-full px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            Chỉnh sửa hồ sơ
          </button>
        </AnimatedSection>

        {/* Security Section */}
        <AnimatedSection delay={0.2} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bảo mật</h2>
              <p className="text-sm text-gray-600">Quản lý tài khoản và phiên đăng nhập</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </AnimatedSection>

        {/* Data Management Section */}
        <AnimatedSection delay={0.3} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quản lý dữ liệu</h2>
              <p className="text-sm text-gray-600">Xóa hoặc sao lưu dữ liệu của bạn</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Cảnh báo quan trọng</h3>
                <p className="text-sm text-red-700">
                  Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu của bạn bao gồm: giao dịch, ví tiền,
                  mục tiêu tiết kiệm và lịch sử. Dữ liệu không thể khôi phục sau khi xóa.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <Trash2 className="w-5 h-5" />
            <span>Xóa tất cả dữ liệu</span>
          </button>
        </AnimatedSection>
        </PageTransition>
      </main>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Xác nhận xóa dữ liệu</h2>
                  <p className="text-sm text-gray-600">Hành động này không thể hoàn tác</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Dữ liệu sẽ bị xóa:</h3>
                <ul className="space-y-1 text-sm text-red-700">
                  <li>• Tất cả giao dịch thu chi</li>
                  <li>• Tất cả ví tiền và số dư</li>
                  <li>• Tất cả mục tiêu tiết kiệm</li>
                  <li>• Lịch sử giao dịch tiết kiệm</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập <span className="font-bold text-red-600">XÓA TẤT CẢ</span> để xác nhận:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nhập chính xác: XÓA TẤT CẢ"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setConfirmText('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleResetData}
                  disabled={confirmText !== 'XÓA TẤT CẢ'}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xóa vĩnh viễn
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
