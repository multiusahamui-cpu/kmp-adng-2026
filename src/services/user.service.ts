
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
    }
};
