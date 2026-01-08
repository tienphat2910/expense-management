"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, User, LogOut, Settings, ChevronDown, Bell } from "lucide-react";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { motion, AnimatePresence } from 'framer-motion';

interface UserData {
  username: string;
  fullName: string;
  preferences?: {
    currency?: string;
    timezone?: string;
    language?: string;
    theme?: string;
  };
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: {
    savingsId?: string;
    inviteToken?: string;
    fromUserId?: {
      username: string;
      fullName: string;
    };
  };
  inviteStatus?: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [user] = useState<UserData | null>(() => api.getUser());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const response = await api.notifications.getAll();
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    // Initial load
    void loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Close menus when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    // Don't navigate if it's a pending invite
    if (notification.type === 'savings_invite' && notification.inviteStatus === 'pending') {
      return;
    }

    // Mark as read
    if (!notification.isRead) {
      await api.notifications.markAsRead(notification._id);
      await loadNotifications();
    }

    // Navigate based on notification type
    if (notification.type === 'savings_invite' && notification.data.savingsId && notification.inviteStatus === 'accepted') {
      router.push(`/savings/${notification.data.savingsId}`);
    }
    
    setIsNotificationOpen(false);
  };

  const handleAcceptInvite = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.notifications.acceptInvite(notification._id);
      if (response.success) {
        await loadNotifications();
        // Navigate to savings detail
        if (notification.data.savingsId) {
          router.push(`/savings/${notification.data.savingsId}`);
          setIsNotificationOpen(false);
        }
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
    }
  };

  const handleDeclineInvite = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.notifications.declineInvite(notification._id);
      if (response.success) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error declining invite:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleLogout = () => {
    api.logout();
    router.push("/sign-in");
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/transactions", label: "Giao dịch" },
    { href: "/wallets", label: "Ví" },
    { href: "/savings", label: "Tiết kiệm" },
    { href: "/statistics", label: "Thống kê" }
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/images/logo.png" 
                alt="Sổ thu chi cá nhân" 
                width={120} 
                height={48}
                className="h-12 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Profile Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notification Icon */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden flex flex-col"
                  >
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Thông báo</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Không có thông báo</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`w-full px-4 py-3 border-b border-gray-100 ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                !notification.isRead ? 'bg-blue-600' : 'bg-gray-300'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: vi
                                })}
                              </p>
                              
                              {/* Action buttons for pending invites */}
                              {notification.type === 'savings_invite' && notification.inviteStatus === 'pending' && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={(e) => handleAcceptInvite(notification, e)}
                                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Chấp nhận
                                  </button>
                                  <button
                                    onClick={(e) => handleDeclineInvite(notification, e)}
                                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              )}

                              {/* Status for processed invites */}
                              {notification.type === 'savings_invite' && notification.inviteStatus === 'accepted' && (
                                <button
                                  onClick={() => handleNotificationClick(notification)}
                                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  Xem chi tiết →
                                </button>
                              )}
                              
                              {notification.type === 'savings_invite' && notification.inviteStatus === 'declined' && (
                                <p className="mt-2 text-xs text-gray-500">Đã từ chối</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">{user?.fullName || user?.username}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200"
                  >
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Hồ sơ
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Cài đặt
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </button>
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden"
            >
              <motion.div 
                className="py-4 border-t border-gray-200"
                initial="closed"
                animate="open"
                exit="closed"
                variants={{
                  open: {
                    transition: { staggerChildren: 0.07, delayChildren: 0.1 }
                  },
                  closed: {
                    transition: { staggerChildren: 0.05, staggerDirection: -1 }
                  }
                }}
              >
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <motion.div
                  key={link.href}
                  variants={{
                    open: {
                      y: 0,
                      opacity: 1,
                      transition: {
                        y: { stiffness: 1000, velocity: -100 }
                      }
                    },
                    closed: {
                      y: 20,
                      opacity: 0,
                      transition: {
                        y: { stiffness: 1000 }
                      }
                    }
                  }}
                >
                  <Link
                    href={link.href}
                    className={`px-4 py-3 rounded-lg text-sm font-medium block ${
                      isActive(link.href)
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.hr 
                className="my-2"
                variants={{
                  open: { opacity: 1, transition: { duration: 0.2 } },
                  closed: { opacity: 0, transition: { duration: 0.2 } }
                }}
              />
              <motion.div
                variants={{
                  open: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      y: { stiffness: 1000, velocity: -100 }
                    }
                  },
                  closed: {
                    y: 20,
                    opacity: 0,
                    transition: {
                      y: { stiffness: 1000 }
                    }
                  }
                }}
              >
                <Link
                  href="/profile"
                  className="flex items-center text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Hồ sơ
                </Link>
              </motion.div>
              <motion.div
                variants={{
                  open: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      y: { stiffness: 1000, velocity: -100 }
                    }
                  },
                  closed: {
                    y: 20,
                    opacity: 0,
                    transition: {
                      y: { stiffness: 1000 }
                    }
                  }
                }}
              >
                <Link
                  href="/settings"
                  className="flex items-center text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Cài đặt
                </Link>
              </motion.div>
              <motion.div
                variants={{
                  open: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      y: { stiffness: 1000, velocity: -100 }
                    }
                  },
                  closed: {
                    y: 20,
                    opacity: 0,
                    transition: {
                      y: { stiffness: 1000 }
                    }
                  }
                }}
              >
                <button
                  onClick={handleLogout}
                  className="flex items-center text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg text-sm font-medium w-full text-left"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </button>
              </motion.div>
            </div>
          </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
