"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus } from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import StatsCard from "@/components/Dashboard/StatsCard";
import RecentTransactions from "@/components/Dashboard/RecentTransactions";
import PageTransition from "@/components/Animations/PageTransition";
import AnimatedSection from "@/components/Animations/AnimatedSection";
import StaggerContainer, { itemVariants } from "@/components/Animations/StaggerContainer";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    // Check if user is logged in
    const user = api.getUser();
    
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Load dashboard data
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load statistics
      const statsResponse = await api.statistics.getSummary();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        console.error('Stats failed:', statsResponse);
      }

      // Load recent transactions
      const transactionsResponse = await api.transactions.getAll(1, 5);
      if (transactionsResponse.success && transactionsResponse.data?.transactions) {
        setRecentTransactions(transactionsResponse.data.transactions);
      } else {
        console.error('Transactions failed:', transactionsResponse);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <PageTransition>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <AnimatedSection className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Trang chủ
              </h1>
              <p className="text-gray-600">
                Chào mừng bạn trở lại! Đây là tổng quan về tình hình tài chính của bạn.
              </p>
            </AnimatedSection>

            {/* Stats Cards */}
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div variants={itemVariants}>
                <StatsCard
                  title="Tổng thu nhập"
                  value={isLoading ? "..." : formatCurrency(stats.totalIncome)}
                  icon={TrendingUp}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatsCard
                  title="Tổng chi tiêu"
                  value={isLoading ? "..." : formatCurrency(stats.totalExpense)}
                  icon={TrendingDown}
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatsCard
                  title="Số dư"
                  value={isLoading ? "..." : formatCurrency(stats.balance)}
                  icon={Wallet}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatsCard
                  title="Giao dịch"
                  value={isLoading ? "..." : stats.transactionCount}
                  icon={DollarSign}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />
              </motion.div>
            </StaggerContainer>

            {/* Quick Actions */}
            <AnimatedSection delay={0.3} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/transactions")}
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <Plus className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Thêm thu nhập</span>
              </button>
              <button
                onClick={() => router.push("/transactions")}
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50 transition-colors"
              >
                <Plus className="w-6 h-6 text-red-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Thêm chi tiêu</span>
              </button>
              <button
                onClick={() => router.push("/wallets")}
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Quản lý ví</span>
              </button>
              <button
                onClick={() => router.push("/statistics")}
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <Plus className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Xem thống kê</span>
              </button>
            </div>
            </AnimatedSection>

            {/* Recent Transactions */}
            <AnimatedSection delay={0.4}>
              <RecentTransactions transactions={recentTransactions} />
            </AnimatedSection>
          </div>
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}