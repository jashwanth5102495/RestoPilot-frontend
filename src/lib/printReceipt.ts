export const printReceipt = (order: any, restaurantName?: string) => {
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

  const resolvedRestaurantName = restaurantName || order.restaurantName || order.restaurantId?.name || (typeof window !== 'undefined' ? localStorage.getItem('restaurantName') : '') || 'Mystery Roaster Cafe';
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
        <td style="text-align: left; padding: 3px 0; word-break: break-word;">${name}</td>
        <td style="text-align: center; padding: 3px 0; white-space: nowrap;">${quantity}</td>
        <td style="text-align: right; padding: 3px 0; white-space: nowrap;">₹${Number(price).toFixed(2)}</td>
        <td style="text-align: right; padding: 3px 0; white-space: nowrap;">₹${Number(itemTotal).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt - ${orderNumber}</title>
        <style>
          @page {
            size: 72mm auto;
            margin: 0;
          }
          @media print {
            html, body {
              width: 72mm !important;
              max-width: 72mm !important;
              margin: 0 !important;
              padding: 2mm 3mm !important;
            }
          }
          * {
            box-sizing: border-box;
          }
          body {
            width: 72mm;
            max-width: 72mm;
            margin: 0 auto;
            padding: 3mm 2mm;
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            background: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
          }
          .header h2 {
            margin: 0;
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header p {
            margin: 2px 0 0 0;
            font-size: 10px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .info {
            font-size: 11px;
            line-height: 1.35;
          }
          .info div {
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
            font-size: 11px;
          }
          th {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 4px 0;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
          }
          th.center { text-align: center; }
          th.right { text-align: right; }
          .total-section {
            border-top: 1px dashed #000;
            padding-top: 6px;
            font-size: 11px;
          }
          .line-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 13px;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px dashed #000;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed #000;
          }
          .footer .blunet {
            margin-top: 4px;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${resolvedRestaurantName}</h2>
          <p>Tax Invoice / Receipt</p>
        </div>

        <div class="divider"></div>

        <div class="info">
          <div><span>Order #:</span> <strong>${orderNumber}</strong></div>
          <div><span>Date:</span> <span>${date}</span></div>
          <div><span>Customer:</span> <span>${customerName}${customerPhone ? ` (${customerPhone})` : ''}</span></div>
          <div><span>Payment:</span> <strong>${paymentMethod}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 44%;">Item</th>
              <th class="center" style="width: 14%;">Qty</th>
              <th class="right" style="width: 20%;">Rate</th>
              <th class="right" style="width: 22%;">Amt</th>
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
          <div class="line-row" style="font-weight: bold;">
            <span>Total GST (5%):</span>
            <span>₹${Number(tax).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Grand Total:</span>
            <span>₹${Number(total).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <div>Thank you for dining with us!</div>
          <div class="blunet">BluNet IT Services</div>
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
