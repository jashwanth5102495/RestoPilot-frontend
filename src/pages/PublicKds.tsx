import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';

const PublicKds = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Use polling for public KDS since we might not have a socket connection without auth
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000); // 10 seconds polling

    return () => clearInterval(interval);
  }, [slug]);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/public/kds/${slug}/orders`);
      setOrders(res.data.data);
    } catch (err) {
      // toast({ title: 'Error fetching orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/public/kds/${slug}/orders/${orderId}/status`, { status });
      toast({ title: `Order status updated to ${status}` });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Error updating status', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Kitchen Display System (KDS)</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Updates
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map(order => (
            <Card key={order._id} className={order.orderStatus === 'PREPARING' ? 'border-orange-500 shadow-md ring-1 ring-orange-500' : 'border-gray-200 shadow-sm'}>
              <CardHeader className="flex flex-row items-center justify-between bg-white border-b px-4 py-3">
                <CardTitle className="text-base font-bold text-gray-800">
                  {order.tableId ? `Table Order` : `Order #${order.orderNumber}`}
                </CardTitle>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.orderStatus === 'PREPARING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.orderStatus}
                </span>
              </CardHeader>
              <CardContent className="p-4 bg-white">
                <ul className="space-y-3 mb-6 min-h-[150px]">
                  {order.items.map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex gap-3">
                        <span className="font-bold text-gray-900 min-w-[24px]">{item.quantity}x</span>
                        <span className="font-medium text-gray-700">{item.dishName}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                  {order.orderStatus === 'PLACED' && (
                    <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" onClick={() => updateStatus(order._id, 'PREPARING')}>
                      Start Preparing
                    </Button>
                  )}
                  {order.orderStatus === 'PREPARING' && (
                    <Button size="lg" className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold" onClick={() => updateStatus(order._id, 'READY')}>
                      Mark Ready
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {orders.length === 0 && (
          <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-12 mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No active orders</h3>
            <p className="text-gray-500">The kitchen is clear. Waiting for new orders to arrive.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicKds;
