
import api from './api';

export interface Location {
    code: string;
    name: string;
    type: string;
    parentCode: string | null;
}

export const locationService = {
    getRegions: async (): Promise<Location[]> => {
        const response = await api.get('/locations/regions');
        return response.data.data;
    },

    getProvinces: async (regionCode: string): Promise<Location[]> => {
        const response = await api.get(`/locations/provinces/${regionCode}`);
        return response.data.data;
    },

    getChildren: async (parentCode: string, type?: string): Promise<Location[]> => {
        const response = await api.get('/locations/children', {
            params: { parentCode, type }
        });
        return response.data.data;
    }
};
