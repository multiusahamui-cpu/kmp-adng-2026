import api from './api';
import { CoopStats } from '../types';

export const coopService = {
  getCoopStats: async (): Promise<CoopStats | null> => {
    try {
      const response = await api.get('/coop/stats');
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch coop stats", error);
      return null;
    }
  },

  getShuInfo: async () => {
    try {
        const response = await api.get('/coop/shu');
        return response.data.data;
    } catch (error) {
        console.error("Failed to fetch SHU info", error);
        return null;
    }
  }
};
