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
  
  const subtotal = order.subtotal ?? items.reduce((sum: number, item: any) => sum + (Number(item.dish?.price || item.unitPrice || item.price || 0) * Number(item.quantity || 1)), 0);
  const cgst = order.cgst !== undefined ? order.cgst : (order.tax ? Number((order.tax / 2).toFixed(2)) : Number((subtotal * 0.025).toFixed(2)));
  const sgst = order.sgst !== undefined ? order.sgst : (order.tax ? Number((order.tax / 2).toFixed(2)) : Number((subtotal * 0.025).toFixed(2)));
  const tax = order.tax !== undefined ? order.tax : Number((cgst + sgst).toFixed(2));
  const discount = order.discount || 0;
  const total = order.total || order.bill?.totalAmount || Number((subtotal + tax - discount).toFixed(2));
  const paymentMethod = order.paymentMethod || 'CASH';

  const itemsHtml = items.map((item: any) => {
    const name = item.dish?.name || item.dishName || item.dishId?.name || 'Item';
    const quantity = item.quantity || 1;
    const price = item.dish?.price || item.unitPrice || item.dishId?.price || item.price || 0;
    const itemTotal = item.lineTotal || (price * quantity);
    return `
      <tr>
        <td style="text-align: left; padding: 4px 0;">${name}</td>
        <td style="text-align: center; padding: 4px 0;">${quantity}</td>
        <td style="text-align: right; padding: 4px 0;">₹${Number(price).toFixed(2)}</td>
        <td style="text-align: right; padding: 4px 0;">₹${Number(itemTotal).toFixed(2)}</td>
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
          .info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; font-size: 13px; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
          th { border-bottom: 1px dashed #000; padding-bottom: 5px; text-align: left; font-weight: normal; }
          th.center { text-align: center; }
          th.right { text-align: right; }
          .total-section { border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 20px; }
          .line-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #000; }
          .footer { text-align: center; font-size: 12px; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>RestoPilot</h2>
          <p style="margin: 5px 0;">Tax Invoice / Receipt</p>
        </div>
        <div class="info">
          <div><strong>Order #:</strong> ${orderNumber}</div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Customer:</strong> ${customerName}${customerPhone ? ` (${customerPhone})` : ''}</div>
          <div><strong>Payment Method:</strong> ${paymentMethod}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="center">Qty</th>
              <th class="right">Rate</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="total-section">
          <div class="line-row">
            <span>Subtotal:</span>
            <span>₹${Number(subtotal).toFixed(2)}</span>
          </div>
          ${discount > 0 ? `
          <div class="line-row">
            <span>Discount:</span>
            <span>-₹${Number(discount).toFixed(2)}</span>
          </div>` : ''}
          <div class="line-row">
            <span>CGST (2.5%):</span>
            <span>₹${Number(cgst).toFixed(2)}</span>
          </div>
          <div class="line-row">
            <span>SGST (2.5%):</span>
            <span>₹${Number(sgst).toFixed(2)}</span>
          </div>
          <div class="line-row" style="font-weight: 600;">
            <span>Total GST (5%):</span>
            <span>₹${Number(tax).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Grand Total:</span>
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
