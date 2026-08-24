import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { API_URL } from '../config';

const Kitchen = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetchOrders();

    const newSocket = io(API_URL.replace('/api/v1', ''), {
      auth: { token: localStorage.getItem('token') }
    });
    
    newSocket.on('order_sent', () => fetchOrders());
    newSocket.on('order_status_updated', () => fetchOrders());

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders?status=PLACED,PREPARING');
      setOrders(res.data.data.filter((o: any) => o.orderStatus === 'PLACED' || o.orderStatus === 'PREPARING'));
    } catch (err) {
      toast({ title: 'Error fetching orders', variant: 'destructive' });
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast({ title: `Order status updated to ${status}` });
    } catch (err: any) {
      toast({ title: 'Error updating status', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Kitchen Display System (KDS)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <Card key={order._id} className={order.orderStatus === 'PREPARING' ? 'border-orange-500 shadow-md' : 'border-gray-200'}>
            <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
              <CardTitle className="text-lg">
                {order.tableId ? `Table Order` : `Order #${order.orderNumber}`}
              </CardTitle>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.orderStatus === 'PREPARING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {order.orderStatus}
              </span>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 mb-6">
                {order.items.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <span className="font-medium">{item.quantity}x {item.dishName}</span>
                  </li>
                ))}
              </ul>
              
              <div className="flex gap-2">
                {order.orderStatus === 'PLACED' && (
                  <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => updateStatus(order._id, 'PREPARING')}>
                    Start Preparing
                  </Button>
                )}
                {order.orderStatus === 'PREPARING' && (
                  <Button className="w-full bg-green-500 hover:bg-green-600" onClick={() => updateStatus(order._id, 'READY')}>
                    Mark Ready
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {orders.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          No active orders in kitchen
        </div>
      )}
    </div>
  );
};

export default Kitchen;
