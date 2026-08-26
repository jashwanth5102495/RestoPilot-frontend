import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const Kitchen = () => {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
  const [orders, setOrders] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isKdsEnabled, setIsKdsEnabled] = useState(false);
  const [kdsSlug, setKdsSlug] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchKdsSettings();

    const newSocket = io(API_URL.replace('/api/v1', ''), {
      auth: { token: localStorage.getItem('token') }
    });
    
    newSocket.on('order_sent', () => fetchOrders());
    newSocket.on('order_status_updated', () => fetchOrders());

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, []);

  const fetchKdsSettings = async () => {
    try {
      const res = await api.get('/auth/me');
      const rest = res.data.data.user.restaurant;
      if (rest) {
        setIsKdsEnabled(rest.isKdsEnabled || false);
        setKdsSlug(rest.kdsSlug || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      const res = await api.post('/public/settings/kds', { enabled: checked });
      setIsKdsEnabled(res.data.data.isKdsEnabled);
      setKdsSlug(res.data.data.kdsSlug || '');
      toast({
        title: checked ? "Public KDS Enabled" : "Public KDS Disabled",
        description: checked ? "The public KDS link is now active." : "The public KDS link is now inactive.",
      });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    }
  };

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

  const publicUrl = kdsSlug ? `${window.location.origin}/kds/${kdsSlug}` : '';

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Kitchen Display System (KDS)</h1>
        <Card className="w-full md:w-auto bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-semibold text-sm">Public KDS Portal</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{isKdsEnabled ? 'Active' : 'Disabled'}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isKdsEnabled} onChange={(e) => handleToggle(e.target.checked)} disabled={settingsLoading} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
            {isKdsEnabled && kdsSlug && (
              <div className="flex gap-2">
                <code className="flex-1 bg-white p-2 rounded border border-slate-200 text-sm font-mono text-slate-600 truncate">
                  {publicUrl}
                </code>
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  toast({ title: "Copied!" });
                }}>Copy</Button>
                <Button variant="outline" size="sm" onClick={() => window.open(publicUrl, '_blank')}>Open</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
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
