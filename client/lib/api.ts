const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const api = {
  // Get auth token from localStorage
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  // Get user from localStorage
  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // Logout - Clear all authentication data
  logout: () => {
    if (typeof window !== 'undefined') {
      // Remove all auth-related items from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Optional: Clear any other cached data
      localStorage.removeItem('lastActivity');
    }
  },

  // Save auth data (called after successful login)
  saveAuth: (user: any, token?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      if (token) {
        localStorage.setItem('token', token);
      }
      // Mark last activity time for reference (optional)
      localStorage.setItem('lastActivity', new Date().toISOString());
    }
  },

  // Auth endpoints
  auth: {
    login: async (username: string, password: string): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return response.json();
    },

    register: async (username: string, password: string, fullName: string): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, fullName }),
      });
      return response.json();
    },
  },

  // Statistics endpoints
  statistics: {
    getSummary: async (startDate?: string, endDate?: string): Promise<ApiResponse> => {
      const user = api.getUser();
      const params = new URLSearchParams();
      if (user?._id) params.append('userId', user._id);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`${API_URL}/api/statistics/summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    getMonthly: async (year: number, month?: number): Promise<ApiResponse> => {
      const params = new URLSearchParams({ year: year.toString() });
      if (month) params.append('month', month.toString());
      
      const response = await fetch(`${API_URL}/api/statistics/monthly?${params}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    getByCategory: async (type?: string, startDate?: string, endDate?: string): Promise<ApiResponse> => {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`${API_URL}/api/statistics/category?${params}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },
  },

  // Transactions endpoints
  transactions: {
    getAll: async (page = 1, limit = 20): Promise<ApiResponse> => {
      const user = api.getUser();
      const params = new URLSearchParams();
      if (user?._id) params.append('userId', user._id);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await fetch(`${API_URL}/api/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    getById: async (id: string): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/transactions/${id}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    create: async (data: any): Promise<ApiResponse> => {
      const user = api.getUser();
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ ...data, userId: user?._id }),
      });
      return response.json();
    },
  },

  // Categories endpoints
  categories: {
    getAll: async (type?: string): Promise<ApiResponse> => {
      const params = type ? `?type=${type}` : '';
      const response = await fetch(`${API_URL}/api/categories${params}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },
  },

  // Budgets endpoints
  budgets: {
    getAll: async (month?: number, year?: number): Promise<ApiResponse> => {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const response = await fetch(`${API_URL}/api/budgets?${params}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },
  },

  // Wallets endpoints
  wallets: {
    getAll: async (includeInactive = false): Promise<ApiResponse> => {
      const user = api.getUser();
      const params = new URLSearchParams();
      if (user?._id) params.append('userId', user._id);
      if (includeInactive) params.append('includeInactive', 'true');
      
      const response = await fetch(`${API_URL}/api/wallets?${params}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    getById: async (id: string): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/wallets/${id}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    create: async (data: any): Promise<ApiResponse> => {
      const user = api.getUser();
      const response = await fetch(`${API_URL}/api/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ ...data, userId: user?._id }),
      });
      return response.json();
    },

    update: async (id: string, data: any): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/wallets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/wallets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    getTransactions: async (id: string, page = 1, limit = 20): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/wallets/${id}/transactions?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },
  },

  // Savings endpoints
  savings: {
    getAll: async (): Promise<ApiResponse> => {
      const user = api.getUser();
      const response = await fetch(`${API_URL}/api/savings?userId=${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    getById: async (id: string): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/savings/${id}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    create: async (data: any): Promise<ApiResponse> => {
      const user = api.getUser();
      const response = await fetch(`${API_URL}/api/savings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ ...data, userId: user?._id }),
      });
      return response.json();
    },

    update: async (id: string, data: any): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/savings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/savings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    deposit: async (id: string, amount: number, walletId: string): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/savings/${id}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ amount, walletId }),
      });
      return response.json();
    },

    withdraw: async (id: string, amount: number, walletId: string): Promise<ApiResponse> => {
      const response = await fetch(`${API_URL}/api/savings/${id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ amount, walletId }),
      });
      return response.json();
    },

    getTransactions: async (id: string, page = 1, limit = 20, month?: number, year?: number): Promise<ApiResponse> => {
      let url = `${API_URL}/api/savings/${id}/transactions?page=${page}&limit=${limit}`;
      if (month && year) {
        url += `&month=${month}&year=${year}`;
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },
  },

  // User endpoints
  users: {
    getProfile: async (): Promise<ApiResponse> => {
      const user = api.getUser();
      const response = await fetch(`${API_URL}/api/users/profile?userId=${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },

    updateProfile: async (data: any): Promise<ApiResponse> => {
      const user = api.getUser();
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ ...data, userId: user?._id }),
      });
      return response.json();
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
      const user = api.getUser();
      const response = await fetch(`${API_URL}/api/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ userId: user?._id, currentPassword, newPassword }),
      });
      return response.json();
    },
  },

  // Settings endpoints
  settings: {
    resetData: async (): Promise<ApiResponse> => {
      const user = api.getUser();
      const response = await fetch(`${API_URL}/api/settings/reset-data?userId=${user?._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      return response.json();
    },
  },
};
