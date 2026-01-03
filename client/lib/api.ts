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

  // Logout
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
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
      const params = new URLSearchParams();
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
      const response = await fetch(`${API_URL}/api/transactions?page=${page}&limit=${limit}`, {
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
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify(data),
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
};
