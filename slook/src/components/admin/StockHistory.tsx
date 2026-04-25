'use client';

import React, { useEffect, useState } from 'react';
import { client as api } from '@/lib/api/client';
// Removing date-fns to avoid dependency issues in slook
import { Package, ArrowUp, ArrowDown } from 'lucide-react';

interface StockLog {
  _id: string;
  previousStock: number;
  newStock: number;
  reason: string;
  note?: string;
  createdAt: string;
  variant?: {
    size: string;
    color: string;
  };
  adminUser?: {
    firstName: string;
    email: string;
  };
  referenceId?: string;
}

interface StockHistoryProps {
  productId: string;
}

const StockHistory: React.FC<StockHistoryProps> = ({ productId }) => {
    const [logs, setLogs] = useState<StockLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data } = await api.get(`/products/${productId}/stock-logs`);
                setLogs(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch stock logs", err);
                setError("Failed to load history");
                setLoading(false);
            }
        };

        if (productId) {
            fetchLogs();
        }
    }, [productId]);

    if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading history...</div>;
    if (error) return <div className="text-sm text-red-500">{error}</div>;
    if (logs.length === 0) return <div className="text-sm text-gray-500">No stock history recorded.</div>;

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Stock History
                </h3>
                <span className="text-xs text-gray-500">{logs.length} entries</span>
            </div>

            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Change</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="px-4 py-3">Reason</th>
                            <th className="px-4 py-3">Ref</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => {
                            const change = log.newStock - log.previousStock;
                            const isPositive = change > 0;

                            return (
                                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                        {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        <span className={`inline-flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {change > 0 ? `+${change}` : change}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {log.newStock}
                                        {log.variant && (
                                            <div className="text-xs text-gray-400">
                                                {log.variant.size} / {log.variant.color}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <div className="font-medium text-gray-800">{log.reason}</div>
                                        <div className="text-xs text-gray-400">{log.note}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                                        {log.adminUser ? (
                                            <span className="text-blue-500" title={log.adminUser.email}>
                                                {log.adminUser.firstName} (Admin)
                                            </span>
                                        ) : (
                                            log.referenceId || '-'
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockHistory;
