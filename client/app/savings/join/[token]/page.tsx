'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { Users, Loader2 } from 'lucide-react';

export default function JoinSavingsPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [savingsInfo, setSavingsInfo] = useState<any>(null);

  useEffect(() => {
    const user = api.getUser();
    if (!user) {
      router.push('/sign-in');
      return;
    }
    
    // Optionally, fetch savings info to show preview
    setLoading(false);
  }, [router]);

  const handleJoin = async () => {
    const user = api.getUser();
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      router.push('/sign-in');
      return;
    }

    setJoining(true);
    try {
      const response = await api.savings.joinByToken(token, user._id);
      
      if (response.success) {
        toast.success('Tham gia tiết kiệm thành công!');
        setTimeout(() => {
          router.push('/savings');
        }, 1500);
      } else {
        toast.error(response.message || 'Không thể tham gia tiết kiệm');
      }
    } catch (error: any) {
      console.error('Error joining savings:', error);
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lời mời tham gia tiết kiệm
          </h1>
          <p className="text-gray-600">
            Bạn đã được mời tham gia góp quỹ tiết kiệm cùng
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {joining ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tham gia...
              </>
            ) : (
              'Tham gia ngay'
            )}
          </button>
          
          <button
            onClick={() => router.push('/savings')}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
