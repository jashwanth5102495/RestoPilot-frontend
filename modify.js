const fs = require('fs');
let content = fs.readFileSync('src/pages/CustomerTableOrder.tsx', 'utf8');

content = content.replace('export default function CustomerOrder()', 'export default function CustomerTableOrder()');
content = content.replace('const { slug } = useParams()', 'const { slug, tableId } = useParams()');
content = content.replace('const res = await api.get(/public/restaurants/\)', 'const res = await api.get(/public/table-qr/\/tables/\/menu)');

const oldSubmit =       const payload = {
        customerInfo,
        items: cart.map(c => ({ dishId: c.dish._id, quantity: c.quantity }))
      }
      await api.post(\/public/restaurants/\/orders\, payload);

const newSubmit =       const payload = {
        items: cart.map(c => ({ dishId: c.dish._id, quantity: c.quantity }))
      }
      await api.post(\/public/table-qr/\/tables/\/order\, payload);
content = content.replace(oldSubmit, newSubmit);

const oldValidation =     if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      return toast({ title: 'Please fill all details', variant: 'destructive' })
    };
content = content.replace(oldValidation, "");

content = content.replace('Your order has been sent to {restaurant.name}. You pay on delivery/pickup.', 'Your order has been sent to the kitchen. It will be served at your table shortly.');

const oldForm =               <form onSubmit={handleSubmitOrder} className="mt-8 space-y-4 border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900">Delivery Details</h3>
                <Input placeholder="Full Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} required />
                <Input placeholder="Phone Number" type="tel" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} required />
                <Input placeholder="Delivery Address" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} required />
                
                <Button type="submit" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Place Order (Pay on Delivery)'}
                </Button>
              </form>;

const newForm =               <div className="mt-8 pt-6">
                <Button onClick={handleSubmitOrder} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Place Order for this Table'}
                </Button>
              </div>;
content = content.replace(oldForm, newForm);
content = content.replace('Order online for delivery or pickup', 'Order for your table directly to the kitchen');

fs.writeFileSync('src/pages/CustomerTableOrder.tsx', content);
