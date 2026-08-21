export const printReceipt = (order: any) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const orderNumber = order.orderNumber || order.bill?.billNumber || 'N/A';
  const customerName = order.customerInfo?.name || 'Walk-in';
  const customerPhone = order.customerInfo?.phone || '';
  const date = new Date(order.createdAt || new Date()).toLocaleString();
  const items = order.items || [];
  const total = order.total || order.bill?.totalAmount || 0;
  const paymentMethod = order.paymentMethod || 'CASH';

  const itemsHtml = items.map((item: any) => {
    const name = item.dish?.name || item.dishId?.name || 'Item';
    const quantity = item.quantity || 1;
    const price = item.dish?.price || item.dishId?.price || item.price || 0;
    const itemTotal = price * quantity;
    return `
      <tr>
        <td style="text-align: left; padding: 4px 0;">${name}</td>
        <td style="text-align: center; padding: 4px 0;">${quantity}</td>
        <td style="text-align: right; padding: 4px 0;">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; padding: 10px; font-size: 14px; color: #000; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
          .info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { border-bottom: 1px dashed #000; padding-bottom: 5px; text-align: left; font-weight: normal; }
          th.center { text-align: center; }
          th.right { text-align: right; }
          .total-section { border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 20px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-bottom: 5px; }
          .footer { text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>RestoPilot</h2>
          <p style="margin: 5px 0;">Receipt</p>
        </div>
        <div class="info">
          <div>Order #: ${orderNumber}</div>
          <div>Date: ${date}</div>
          <div>Customer: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}</div>
          <div>Payment: ${paymentMethod}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="center">Qty</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="total-section">
          <div class="total-row">
            <span>Total:</span>
            <span>₹${Number(total).toFixed(2)}</span>
          </div>
        </div>
        <div class="footer">
          Thank you for dining with us!
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};
