import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function CookInterface() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, Pending, Preparing
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/cook/orders`);
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
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE}/cook/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            if (response.ok) {
                showMessage('success', `Order #${orderId} marked as ${newStatus}`);
                fetchOrders();
            } else {
                showMessage('error', data.error || 'Failed to update order');
            }
        } catch (error) {
            showMessage('error', 'Failed to update order status');
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status === filter);

    const pendingCount = orders.filter(o => o.status === 'Pending').length;
    const preparingCount = orders.filter(o => o.status === 'Preparing').length;
    const readyCount = orders.filter(o => o.status === 'Ready').length;

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Preparing': 'bg-blue-100 text-blue-800',
            'Ready': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getActionButton = (order) => {
        if (order.status === 'Pending') {
            return (
                <button
                    onClick={() => updateOrderStatus(order.id, 'Preparing')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Clock className="w-4 h-4" />
                    Start Cooking
                </button>
            );
        }

        if (order.status === 'Preparing') {
            return (
                <button
                    onClick={() => updateOrderStatus(order.id, 'Ready')}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Ready
                </button>
            );
        }

        if (order.status === 'Ready') {
            return (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Ready to Serve
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ChefHat className="w-8 h-8 text-orange-600" />
                            <h1 className="text-3xl font-bold text-gray-800">Kitchen Panel</h1>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Cooking</p>
                                <p className="text-2xl font-bold text-blue-600">{preparingCount}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Ready</p>
                                <p className="text-2xl font-bold text-green-600">{readyCount}</p>
                            </div>
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

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-6 py-2 rounded-lg font-medium transition ${filter === 'all'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Orders ({orders.length})
                        </button>
                        <button
                            onClick={() => setFilter('Pending')}
                            className={`px-6 py-2 rounded-lg font-medium transition ${filter === 'Pending'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Pending ({pendingCount})
                        </button>
                        <button
                            onClick={() => setFilter('Preparing')}
                            className={`px-6 py-2 rounded-lg font-medium transition ${filter === 'Preparing'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Cooking ({preparingCount})
                        </button>
                        <button
                            onClick={() => setFilter('Ready')}
                            className={`px-6 py-2 rounded-lg font-medium transition ${filter === 'Ready'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Ready ({readyCount})
                        </button>
                    </div>
                </div>

                {/* Orders Grid */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-spin" />
                            <p className="text-gray-500">Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No orders to display</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    className={`border-2 rounded-lg p-4 transition hover:shadow-lg ${order.status === 'Pending' ? 'border-yellow-300 bg-yellow-50' :
                                            order.status === 'Preparing' ? 'border-blue-300 bg-blue-50' :
                                                order.status === 'Ready' ? 'border-green-300 bg-green-50' :
                                                    'border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    {/* Order Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">
                                                Order #{order.id}
                                            </h3>
                                            <p className="text-sm text-gray-600 font-medium">
                                                {order.seat_number || 'No Table'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-2 mb-4">
                                        {order.items.map(item => (
                                            <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded">
                                                {item.menu_image_url && (
                                                    <img
                                                        src={item.menu_image_url}
                                                        alt={item.menu_name}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{item.menu_name}</p>
                                                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-3 border-t">
                                        {getActionButton(order)}
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