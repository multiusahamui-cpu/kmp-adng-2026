
import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    FileText, 
    RefreshCw, 
    AlertTriangle, 
    CheckCircle, 
    Loader2,
    Database
} from 'lucide-react';
import api from '../services/api';

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

export const SolidAccountingDashboard: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rawResponse, setRawResponse] = useState<any>(null);

    const fetchCOA = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching COA from /accounting/coa...");
            const response = await api.get('/accounting/coa');
            console.log("Raw API Response:", response);
            
            // Store raw response for debugging
            setRawResponse(response.data);

            if (response.data && Array.isArray(response.data.data)) {
                setAccounts(response.data.data);
            } else if (Array.isArray(response.data)) {
                setAccounts(response.data);
            } else {
                throw new Error("Invalid data format received from server");
            }
        } catch (err: any) {
            console.error("Fetch Error:", err);
            setError(err.message || "Failed to fetch COA");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCOA();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Database className="text-blue-600" />
                        Solid Accounting Dashboard
                    </h1>
                    <p className="text-slate-500">Direct Data View from 'accounts' Table</p>
                </div>
                <button 
                    onClick={fetchCOA} 
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                    Force Refresh Data
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" />
                    <div>
                        <h3 className="font-bold text-red-700">Error Loading Data</h3>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Data Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-slate-700">Chart of Accounts ({accounts.length})</h2>
                        <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Table: accounts
                        </span>
                    </div>
                    
                    {accounts.length === 0 && !loading ? (
                        <div className="p-8 text-center text-gray-500">
                            No accounts found in database.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                    <tr>
                                        <th className="p-3 pl-4">Code</th>
                                        <th className="p-3">Account Name</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">ID (UUID)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {accounts.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="p-3 pl-4 font-mono font-bold text-blue-600">{acc.code}</td>
                                            <td className="p-3 font-medium text-slate-800">{acc.name}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                                    ${acc.type === 'Aktiva' ? 'bg-green-100 text-green-700' : 
                                                      acc.type === 'Kewajiban' ? 'bg-red-100 text-red-700' : 
                                                      acc.type === 'Ekuitas' ? 'bg-blue-100 text-blue-700' : 
                                                      acc.type === 'Pendapatan' ? 'bg-emerald-100 text-emerald-700' : 
                                                      'bg-orange-100 text-orange-700'}`}>
                                                    {acc.type}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono text-xs text-gray-400">{acc.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Debug Panel */}
                <div className="bg-slate-900 text-slate-300 rounded-xl shadow-lg p-4 overflow-hidden flex flex-col h-[600px]">
                    <div className="flex items-center gap-2 mb-4 text-white font-mono text-sm border-b border-slate-700 pb-2">
                        <FileText size={16} />
                        Raw JSON Response
                    </div>
                    <div className="flex-1 overflow-auto font-mono text-xs bg-slate-950 p-4 rounded-lg border border-slate-800">
                        {rawResponse ? (
                            <pre>{JSON.stringify(rawResponse, null, 2)}</pre>
                        ) : (
                            <span className="text-slate-600 italic">Waiting for data...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
