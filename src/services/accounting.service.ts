
import api from './api';

export interface Account {
    id: string;
    code: string;
    name: string;
    type: 'Aktiva' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'Beban';
}

export interface JournalEntry {
    id: string;
    date: string;
    ref: string;
    description: string;
    lines: JournalLine[];
    total: number;
}

export interface JournalLine {
    accountId: string;
    debit: number;
    credit: number;
}

export const accountingService = {
    getCOA: async (): Promise<Account[]> => {
        const response = await api.get('/accounting/coa');
        return response.data.data;
    },

    seedCOA: async (): Promise<void> => {
        await api.post('/accounting/coa/seed');
    },

    createAccount: async (account: Partial<Account>): Promise<Account> => {
        const response = await api.post('/accounting/coa', account);
        return response.data.data;
    },

    updateAccount: async (id: string, account: Partial<Account>): Promise<Account> => {
        const response = await api.put(`/accounting/coa/${id}`, account);
        return response.data.data;
    },

    deleteAccount: async (id: string): Promise<void> => {
        await api.delete(`/accounting/coa/${id}`);
    },

    getJournals: async (): Promise<JournalEntry[]> => {
        const response = await api.get('/accounting/journal');
        return response.data.data;
    },

    createJournal: async (journal: any): Promise<JournalEntry> => {
        const response = await api.post('/accounting/journal', journal);
        return response.data.data;
    },

    getBalanceSheet: async () => {
        const response = await api.get('/accounting/reports/balance-sheet');
        return response.data.data;
    }
};
