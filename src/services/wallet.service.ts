
import api from './api';

export const walletService = {
  // CRITICAL FIX: Removed try-catch block that returned cached/mock data.
  // Balance must always come from the server to ensure transaction integrity.
  getWalletInfo: async () => {
      // Direct API call with CACHE BUSTER (?t=timestamp). 
      // This forces the server to return 200 OK and fresh data, preventing 304 Not Modified.
      const response = await api.get(`/wallet?t=${Date.now()}`);
      return response.data.data; // Expect { balance, savings, transactions }
  },

  topup: async (amount: number) => {
      const response = await api.post('/wallet/topup', { amount });
      return response.data.data;
  },

  transfer: async (amount: number, targetPhone: string, pin: string, description?: string) => {
      const response = await api.post('/wallet/transfer', { 
        amount, 
        targetPhone, 
        pin, 
        description 
      });
      return response.data.data;
  },

  withdrawVoluntary: async (amount: number, pin: string) => {
      const response = await api.post('/wallet/withdraw/voluntary', { amount, pin });
      return response.data;
  },
  
  payment: async (_type: string, _amount: number, _description: string, _pin: string) => {
      // Placeholder for generic payment if needed, currently handled by specific endpoints
      return null; 
  }
};
