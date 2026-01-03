"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AnimatedInput from "@/components/Auth/AnimatedInput";
import { api } from "@/lib/api";

interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username không được để trống";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username phải có ít nhất 3 ký tự";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const data = await api.auth.login(formData.username, formData.password);

      if (!data.success) {
        setErrors({ general: data.message || "Đăng nhập thất bại" });
        return;
      }

      // Store user data and token in localStorage permanently
      // Data will persist until user explicitly logs out
      if (data.data?.user) {
        api.saveAuth(data.data.user, data.data.token);
      }

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setErrors({ general: "Không thể kết nối đến server" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đăng nhập
            </h1>
            <p className="text-gray-600">
              Quản lý thu chi cá nhân của bạn
            </p>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 text-center">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatedInput
              name="username"
              label="Tên đăng nhập"
              type="text"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
            />

            <AnimatedInput
              name="password"
              label="Mật khẩu"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3 px-4 rounded-xl font-semibold text-white
                transition-all duration-200
                ${
                  isLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 active:scale-[0.98]"
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                href="/sign-up"
                className="text-blue-500 hover:text-blue-600 font-semibold transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

       
      </div>
    </div>
  );
}
