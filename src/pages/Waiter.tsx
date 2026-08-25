import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const Waiter = () => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
  const { toast } = useToast();
  const [tables, setTables] = useState<any[]>([]);
  const [activeTable, setActiveTable] = useState<any | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<any[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    fetchTables();
    fetchMenu();

    const newSocket = io(API_URL.replace('/api/v1', ''), {
      auth: { token: localStorage.getItem('token') }
    });
    
    newSocket.on('tables_updated', () => fetchTables());
    newSocket.on('table_status_updated', (data) => {
      setTables(prev => prev.map(t => t._id === data.tableId ? { ...t, status: data.status } : t));
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, []);

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data.data);
    } catch (err) {
      toast({ title: 'Error fetching tables', variant: 'destructive' });
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await api.get('/dishes');
      const allDishes = res.data.data;
      setDishes(allDishes);
      
      const cats = Array.from(new Set(allDishes.map((d: any) => d.categoryId?.name || 'Uncategorized')));
      setCategories(['All', ...cats]);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  };

  const openTable = async (table: any) => {
    try {
      setCart([]);
      if (table.status === 'FREE') {
        const res = await api.post('/orders/table', { tableId: table._id });
        setActiveTable({ ...table, activeOrder: res.data.data });
      } else {
        // Find existing active order for this table
        // For simplicity right now, if it's occupied, we just fetch it or create a new order session if not found.
        // Waiter can just append items to a new order session for now.
        const res = await api.post('/orders/table', { tableId: table._id });
        setActiveTable({ ...table, activeOrder: res.data.data });
      }
    } catch (err: any) {
      toast({ title: 'Error opening table', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const addToCart = (dish: any) => {
    const existing = cart.find(item => item.dishId === dish._id);
    if (existing) {
      setCart(cart.map(item => item.dishId === dish._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { dishId: dish._id, name: dish.name, price: dish.price, quantity: 1, notes: '' }]);
    }
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.dishId === dishId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setOrderLoading(true);
    try {
      const items = cart.map(item => ({
        dishId: item.dishId,
        quantity: item.quantity,
        notes: item.notes
      }));
      await api.patch(`/orders/${activeTable.activeOrder._id}/items`, { updates: items });
      await api.post(`/orders/${activeTable.activeOrder._id}/send`); // Send to kitchen
      toast({ title: 'Order sent to Kitchen!' });
      setCart([]);
      setActiveTable(null);
      fetchTables();
    } catch (err: any) {
      toast({ title: 'Failed to send order', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Waiter Interface</h1>
      
      {!activeTable ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map(table => (
            <Card 
              key={table._id} 
              className={`cursor-pointer transition-colors ${table.status === 'OCCUPIED' ? 'bg-red-50 hover:bg-red-100 border-red-200' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}
              onClick={() => openTable(table)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <span className="text-xl font-bold">{table.tableNumber}</span>
                <span className="text-sm text-gray-500 mt-2">{table.status}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Table {activeTable.name || activeTable.tableNumber} Order</h2>
            <Button onClick={() => setActiveTable(null)} variant="outline">Back to Tables</Button>
          </div>
          
          <div className="flex gap-6 h-full overflow-hidden">
            {/* Menu Section */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex gap-2 overflow-x-auto bg-gray-50/50">
                {categories.map(cat => (
                  <Button 
                    key={cat} 
                    variant={activeCategory === cat ? 'default' : 'outline'}
                    onClick={() => setActiveCategory(cat)}
                    className="whitespace-nowrap"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {dishes
                  .filter(d => activeCategory === 'All' || (d.categoryId?.name || 'Uncategorized') === activeCategory)
                  .map(dish => (
                  <Card key={dish._id} className="cursor-pointer hover:border-primary transition-colors flex flex-col" onClick={() => addToCart(dish)}>
                    <div className="h-32 bg-gray-100 w-full rounded-t-xl bg-cover bg-center" style={{ backgroundImage: `url(${dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'})`}}></div>
                    <CardContent className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 leading-tight mb-1">{dish.name}</h3>
                      <p className="text-primary font-bold mt-auto">₹{dish.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Cart Section */}
            <div className="w-80 lg:w-96 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> Current Order</h3>
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Tap items to add to order</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.dishId} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm pr-2">{item.name}</span>
                        <span className="font-bold text-sm text-primary whitespace-nowrap">₹{item.price * item.quantity}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-3 bg-white rounded-md border border-gray-200">
                          <button onClick={() => updateQuantity(item.dishId, -1)} className="p-1 hover:text-primary transition-colors"><Minus className="w-4 h-4"/></button>
                          <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.dishId, 1)} className="p-1 hover:text-primary transition-colors"><Plus className="w-4 h-4"/></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between font-bold text-lg mb-4">
                  <span>Total</span>
                  <span className="text-primary">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 0).toFixed(2)}</span>
                </div>
                <Button 
                  className="w-full h-12 text-lg" 
                  disabled={cart.length === 0 || orderLoading}
                  onClick={placeOrder}
                >
                  {orderLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send to Kitchen'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Waiter;
