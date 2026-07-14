
import api from './api';
import { User } from '../types';

export const userService = {
    updateProfile: async (data: Partial<User>) => {
        const response = await api.put('/users/profile', data);
        return response.data.data;
    },

    setPin: async (pin: string, oldPin?: string) => {
        const response = await api.put('/users/pin', { pin, oldPin });
        return response.data.data;
    },

    changePassword: async (oldPassword: string, newPassword: string) => {
        const response = await api.put('/users/password', { oldPassword, newPassword });
        // Backend menaikkan tokenVersion saat ganti password (supaya sesi lain
        // yang mungkin sudah dicuri ikut ter-invalidate) dan mengirim token baru
        // khusus untuk device ini -- tanpa ini, token lama di localStorage jadi
        // tidak valid lagi di request berikutnya.
        const newToken = response.data.data?.token;
        if (newToken) localStorage.setItem('token', newToken);
        return response.data.data;
    },

    updatePreferences: async (preferences: any) => {
        const response = await api.put('/users/preferences', preferences);
        return response.data.data;
    },

    generateReferral: async () => {
        const response = await api.post('/users/referral');
        return response.data.data; // Returns { referralCode: '...' }
    },

    requestResignation: async (reason: string, description: string) => {
        const response = await api.post('/users/resignation', { reason, description });
        return response.data;
    },

    updateBankAccount: async (bankName: string, bankAccountNumber: string, bankAccountHolder: string) => {
        const response = await api.put('/users/bank-account', { bankName, bankAccountNumber, bankAccountHolder });
        return response.data.data;
    }
};
