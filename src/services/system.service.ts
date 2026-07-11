
import api from './api';
import { SystemConfig } from '../types';
import { DEFAULT_SYSTEM_CONFIG } from '../constants';

export const systemService = {
  checkHealth: async () => {
    try {
      // Panggil endpoint health check backend
      await api.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  },

  getConfig: async (): Promise<SystemConfig | null> => {
    try {
      // Tambahkan timestamp untuk menghindari 304 Not Modified (Stuck on You)
      // Kita memaksa server memberikan data segar (200 OK)
      const response = await api.get(`/admin/config?t=${Date.now()}`);
      return response.data.data;
    } catch (error) {
      console.warn("System Service: Backend unreachable or Config Error. Using Default Config.");
      return DEFAULT_SYSTEM_CONFIG;
    }
  }
};
