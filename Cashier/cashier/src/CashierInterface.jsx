import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function CashierInterface() {
    const [orders, setOrders] = useState([]);
    const [selectedTable, setSelectedTable] = useState('all');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const url = selectedTable === 'all'
                ? `${API_BASE}/cashier/orders`
                : `${API_BASE}/cashier/orders?seat_number=${selectedTable}`;

            const response = await fetch(url);
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            showMessage('error', 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Poll for updates every 3 seconds
        const interval = setInterval(fetchOrders, 3000);

        return () => clearInterval(interval);
    }, [selectedTable]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handlePayment = async (orderId) => {
        try {
            const response = await fetch(`${API_BASE}/cashier/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'pay' })
            });

            const data = await response.json();
            if (response.ok) {
                showMessage('success', `Payment successful! Total: ₱${data.total_paid.toFixed(2)}`);
                fetchOrders();
            } else {
                showMessage('error', data.error || 'Payment failed');
            }
        } catch (error) {
            showMessage('error', 'Failed to process payment');
        }
    };

    // Group orders by table
    const groupedOrders = orders.reduce((acc, order) => {
        const table = order.seat_number || 'No Table';
        if (!acc[table]) acc[table] = [];
        acc[table].push(order);
        return acc;
    }, {});

    // Calculate table totals
    const tableStats = Object.entries(groupedOrders).map(([table, tableOrders]) => {
        const unpaidOrders = tableOrders.filter(o => !o.is_paid);
        const total = unpaidOrders.reduce((sum, o) => sum + o.total_amount, 0);
        const hasReady = unpaidOrders.some(o => o.status === 'Ready');
        const allPaid = tableOrders.every(o => o.is_paid);
        return { table, total, hasReady, allPaid, orderCount: unpaidOrders.length };
    });

    const getStatusBadge = (status, isPaid) => {
        if (isPaid) return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Paid</span>;

        const badges = {
            'Pending': <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>,
            'Preparing': <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Preparing</span>,
            'Ready': <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Ready to Serve</span>,
            'Cancelled': <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Cancelled</span>
        };
        return badges[status] || null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-indigo-600" />
                            <h1 className="text-3xl font-bold text-gray-800">Cashier Panel</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Active Tables</p>
                            <p className="text-2xl font-bold text-indigo-600">
                                {tableStats.filter(t => !t.allPaid && t.orderCount > 0).length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Table Filter */}
                <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setSelectedTable('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${selectedTable === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Tables
                        </button>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map(num => {
                            const tableKey = `Table ${num}`;
                            const stats = tableStats.find(s => s.table === tableKey);
                            const hasOrders = stats && stats.orderCount > 0;

                            return (
                                <button
                                    key={num}
                                    onClick={() => setSelectedTable(tableKey)}
                                    className={`px-4 py-2 rounded-lg font-medium transition relative ${selectedTable === tableKey
                                            ? 'bg-indigo-600 text-white'
                                            : hasOrders
                                                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {num}
                                    {stats?.hasReady && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Table Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                    {tableStats
                        .filter(stats => !stats.allPaid && stats.orderCount > 0)
                        .map(stats => (
                            <div
                                key={stats.table}
                                className={`bg-white rounded-lg shadow-lg p-4 cursor-pointer transition hover:shadow-xl ${stats.hasReady ? 'ring-2 ring-green-500' : ''
                                    }`}
                                onClick={() => setSelectedTable(stats.table)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-800">{stats.table}</h3>
                                    {stats.hasReady && (
                                        <AlertCircle className="w-5 h-5 text-green-500 animate-pulse" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{stats.orderCount} order(s)</p>
                                <p className="text-2xl font-bold text-indigo-600">₱{stats.total.toFixed(2)}</p>
                            </div>
                        ))}
                </div>

                {/* Orders List */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        {selectedTable === 'all' ? 'All Orders' : `${selectedTable} Orders`}
                    </h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-spin" />
                            <p className="text-gray-500">Loading orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No orders found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div
                                    key={order.id}
                                    className={`border rounded-lg p-4 ${order.is_paid
                                            ? 'bg-gray-50 border-gray-300'
                                            : order.status === 'Ready'
                                                ? 'bg-green-50 border-green-300'
                                                : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-800">
                                                Order #{order.id} - {order.seat_number || 'No Table'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {getStatusBadge(order.status, order.is_paid)}
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-2 mb-3">
                                        {order.items.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-gray-700">
                                                    {item.quantity}x {item.menu_name}
                                                </span>
                                                <span className="font-medium text-gray-800">
                                                    ₱{item.subtotal.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t">
                                        <div>
                                            <p className="text-sm text-gray-500">Total Amount</p>
                                            <p className="text-2xl font-bold text-indigo-600">
                                                ₱{order.total_amount.toFixed(2)}
                                            </p>
                                        </div>

                                        {!order.is_paid && order.status === 'Ready' && (
                                            <button
                                                onClick={() => handlePayment(order.id)}
                                                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Mark as Paid
                                            </button>
                                        )}

                                        {!order.is_paid && order.status !== 'Ready' && (
                                            <div className="flex items-center gap-2 text-yellow-600">
                                                <Clock className="w-5 h-5" />
                                                <span className="text-sm font-medium">Not ready yet</span>
                                            </div>
                                        )}

                                        {order.is_paid && (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="text-sm font-medium">Paid</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}