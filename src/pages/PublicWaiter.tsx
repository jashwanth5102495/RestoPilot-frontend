import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Plus, Minus, ShoppingCart, Loader2, Receipt, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const PublicWaiter = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  
  const [restaurantName, setRestaurantName] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  const [activeTable, setActiveTable] = useState<any | null>(null);
  
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<any[]>([]);
  const [existingOrder, setExistingOrder] = useState<any | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [slug]);

  const fetchInitialData = async () => {
    setPageLoading(true);
    try {
      const [tablesRes, menuRes] = await Promise.all([
        axios.get(`${API_URL}/public/waiter/${slug}/tables`),
        axios.get(`${API_URL}/public/waiter/${slug}/menu`)
      ]);
      
      setRestaurantName(tablesRes.data.data.restaurant.name);
      setTables(tablesRes.data.data.tables);
      
      const allDishes = menuRes.data.data.dishes;
      setDishes(allDishes);
      
      const cats = Array.from(new Set(allDishes.map((d: any) => d.categoryId?.name || 'Uncategorized')));
      setCategories(['All', ...cats]);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load Waiter Portal');
    } finally {
      setPageLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const tablesRes = await axios.get(`${API_URL}/public/waiter/${slug}/tables`);
      setTables(tablesRes.data.data.tables);
    } catch (err) {
      console.error(err);
    }
  };

  const openTable = async (table: any) => {
    setCart([]);
    setActiveTable(table);
    setShowMobileCart(false);
    
    if (table.status === 'OCCUPIED') {
      try {
        const res = await axios.get(`${API_URL}/public/waiter/${slug}/tables/${table._id}/order`);
        setExistingOrder(res.data.data || null);
      } catch (err) {
        console.error('Failed to fetch existing order', err);
        setExistingOrder(null);
      }
    } else {
      setExistingOrder(null);
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
    if (cart.length === 0 || !activeTable) return;
    setOrderLoading(true);
    try {
      const items = cart.map(item => ({
        dishId: item.dishId,
        quantityChange: item.quantity,
        notes: item.notes
      }));
      await axios.post(`${API_URL}/public/waiter/${slug}/tables/${activeTable._id}/order`, { items });
      toast({ title: 'Order sent to Kitchen!' });
      setCart([]);
      fetchTables();
      
      // Refresh the existing order so the waiter sees the updated state without closing the table
      try {
        const res = await axios.get(`${API_URL}/public/waiter/${slug}/tables/${activeTable._id}/order`);
        setExistingOrder(res.data.data || null);
      } catch (e) {}
      
    } catch (err: any) {
      toast({ title: 'Failed to send order', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setOrderLoading(false);
    }
  };

  const generateBill = async () => {
    if (!activeTable) return;
    setBillLoading(true);
    try {
      await axios.post(`${API_URL}/public/waiter/${slug}/tables/${activeTable._id}/bill`);
      toast({ title: 'Bill Generated!' });
      setActiveTable(null);
      setShowMobileCart(false);
      fetchTables();
    } catch (err: any) {
      toast({ title: 'Failed to generate bill', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setBillLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
      <p className="text-gray-600">{error}</p>
    </div>;
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{restaurantName} <span className="text-gray-400 font-normal">| Waiter POS</span></h1>
      </div>

      {!activeTable ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tables.map(table => (
            <Card 
              key={table._id} 
              className={`cursor-pointer hover:shadow-md transition-shadow h-32 flex flex-col items-center justify-center border-2 ${
                table.status === 'OCCUPIED' ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-gray-300 bg-white'
              }`}
              onClick={() => openTable(table)}
            >
              <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full w-full">
                <span className="text-xl font-bold">{table.name || `Table ${table.tableNumber}`}</span>
                <span className={`text-xs font-semibold uppercase mt-2 px-2 py-1 rounded-full ${table.status === 'OCCUPIED' ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                  {table.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-100px)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-bold">{activeTable.name || `Table ${activeTable.tableNumber}`} Order</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowMobileCart(!showMobileCart)} variant="outline" className="gap-2 bg-white text-gray-700 border-gray-300 lg:hidden">
                {showMobileCart ? <ArrowLeft className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                {showMobileCart ? 'Back to Menu' : `Current Order (${cart.reduce((a, b) => a + b.quantity, 0)})`}
              </Button>
              {activeTable.status === 'OCCUPIED' && (
                <Button onClick={generateBill} disabled={billLoading} variant="secondary" className="gap-2 bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">
                  {billLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                  Generate Bill
                </Button>
              )}
              <Button onClick={() => setActiveTable(null)} variant="outline">Back to Tables</Button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            {/* Menu Section */}
            <div className={`flex-1 flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${showMobileCart ? 'hidden lg:flex' : 'flex'}`}>
              <div className="p-3 md:p-4 border-b border-gray-100 flex gap-2 overflow-x-auto bg-gray-50/50 scrollbar-hide">
                {categories.map(cat => (
                  <Button 
                    key={cat} 
                    variant={activeCategory === cat ? 'default' : 'outline'}
                    onClick={() => setActiveCategory(cat)}
                    className="whitespace-nowrap"
                    size="sm"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-3 md:p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {dishes
                  .filter(d => activeCategory === 'All' || (d.categoryId?.name || 'Uncategorized') === activeCategory)
                  .map(dish => (
                  <Card key={dish._id} className="cursor-pointer hover:border-primary transition-colors flex flex-col shadow-sm" onClick={() => addToCart(dish)}>
                    <div className="h-24 md:h-32 bg-gray-100 w-full rounded-t-xl bg-cover bg-center" style={{ backgroundImage: `url(${dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'})`}}></div>
                    <CardContent className="p-3 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 leading-tight mb-1 text-sm md:text-base">{dish.name}</h3>
                      <p className="text-primary font-bold mt-auto text-sm md:text-base">₹{dish.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Cart Section */}
            <div id="cart-section" className={`w-full lg:w-96 flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-[500px] lg:h-auto lg:mt-0 ${showMobileCart ? 'flex mt-4' : 'hidden lg:flex'}`}>
              <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> Current Order</h3>
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {existingOrder && existingOrder.items?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Already Sent to Kitchen</h4>
                    <div className="space-y-2">
                      {existingOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start p-2 bg-orange-50/50 rounded border border-orange-100">
                          <span className="font-medium text-sm text-gray-700">{item.quantity}x {item.dishName}</span>
                          <span className="font-bold text-sm text-gray-700">₹{item.lineTotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {cart.length > 0 && existingOrder && existingOrder.items?.length > 0 && (
                  <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider mt-4">New Items</h4>
                )}
                
                {cart.length === 0 && (!existingOrder || !existingOrder.items || existingOrder.items.length === 0) ? (
                  <div className="text-center text-gray-400 mt-10">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Tap items to add to order</p>
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
                          <button onClick={() => updateQuantity(item.dishId, -1)} className="p-1 md:p-2 hover:text-primary transition-colors"><Minus className="w-4 h-4"/></button>
                          <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.dishId, 1)} className="p-1 md:p-2 hover:text-primary transition-colors"><Plus className="w-4 h-4"/></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between font-bold text-lg mb-4">
                  <span>Total</span>
                  <span className="text-primary">₹{((existingOrder?.total || 0) + cart.reduce((a, b) => a + (b.price * b.quantity), 0)).toFixed(2)}</span>
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

export default PublicWaiter;
