export const printReceipt = (
  order: any, 
  restaurantName?: string, 
  restaurantAddress?: string,
  restaurantPhone?: string,
  restaurantGstin?: string
) => {
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

  const resolvedRestaurantName = (restaurantName || order.restaurantName || order.restaurantId?.name || (typeof window !== 'undefined' ? localStorage.getItem('restaurantName') : '') || 'MISTORY FAMILY RESTAURANT').toUpperCase();
  const resolvedRestaurantAddress = restaurantAddress || order.restaurantAddress || order.restaurantId?.address || (typeof window !== 'undefined' ? localStorage.getItem('restaurantAddress') : '') || 'Bulahalli Gate, NH44, Avathi, Devanahalli,Karnataka-562164';
  const resolvedPhone = restaurantPhone || order.restaurantPhone || order.restaurantId?.phone || (typeof window !== 'undefined' ? localStorage.getItem('restaurantPhone') : '') || '+91 97433 99992';
  const resolvedGstin = restaurantGstin || order.gstNumber || order.restaurantId?.gstNumber || (typeof window !== 'undefined' ? localStorage.getItem('restaurantGstin') : '') || '29BVXPN5021P1ZL';

  const rawBillNo = order.bill?.billNumber || order.billNumber || order.orderNumber || '5374';
  const rawOrderNo = order.orderNumber || order.bill?.billNumber || '5374';
  const cleanBillNo = rawBillNo.replace(/^(INV-\d{4}-|RP-|ORD-)/i, '') || rawBillNo;
  const cleanOrderNo = rawOrderNo.replace(/^(RP-|ORD-|INV-\d{4}-)/i, '') || rawOrderNo;

  const orderDateObj = new Date(order.createdAt || order.billDate || Date.now());
  const day = String(orderDateObj.getDate()).padStart(2, '0');
  const month = String(orderDateObj.getMonth() + 1).padStart(2, '0');
  const year = orderDateObj.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  let hours = orderDateObj.getHours();
  const minutes = String(orderDateObj.getMinutes()).padStart(2, '0');
  const seconds = String(orderDateObj.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedTime = `${hours}:${minutes}:${seconds}${ampm}`;

  const operatorId = order.operatorId || order.operator || order.cashierName || order.issuedBy?.name || order.createdBy?.name || 'sa';
  const paymentMode = order.paymentMethod ? (order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1).toLowerCase()) : 'Cash';
  const tableName = order.tableName || order.tableId?.name || (typeof order.tableId === 'string' && order.tableId.length < 10 ? order.tableId : '') || order.tableNumber || '';
  const kotNo = order.kotNumber || `KOT-${cleanOrderNo}`;
  const billTitle = tableName ? '*Dine In Bill*' : (order.orderSource === 'ONLINE' ? '*Online Order Bill*' : '*Dine In Bill*');

  const items = order.items || [];
  let totalQty = 0;

  const itemsHtml = items.map((item: any) => {
    const name = (item.dish?.name || item.dishName || item.dishId?.name || item.name || 'Item').toUpperCase();
    const quantity = Number(item.quantity || 1);
    totalQty += quantity;
    const price = Number(item.dish?.price || item.unitPrice || item.dishId?.price || item.price || 0);
    const itemTotal = Number(item.lineTotal || (price * quantity));
    return `
      <tr>
        <td style="text-align: left; padding: 2px 0; word-break: break-word; font-size: 11px;">${name}</td>
        <td style="text-align: right; padding: 2px 0; white-space: nowrap; font-size: 11px;">${price.toFixed(2)}</td>
        <td style="text-align: center; padding: 2px 0; white-space: nowrap; font-size: 11px;">${quantity}</td>
        <td style="text-align: right; padding: 2px 0; white-space: nowrap; font-size: 11px;">${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const subtotal = order.subtotal !== undefined ? Number(order.subtotal) : items.reduce((sum: number, item: any) => sum + (Number(item.dish?.price || item.unitPrice || item.price || 0) * Number(item.quantity || 1)), 0);
  const cgst = order.cgst !== undefined ? Number(order.cgst) : (order.tax ? Number((order.tax / 2).toFixed(2)) : Number((subtotal * 0.025).toFixed(2)));
  const sgst = order.sgst !== undefined ? Number(order.sgst) : (order.tax ? Number((order.tax / 2).toFixed(2)) : Number((subtotal * 0.025).toFixed(2)));
  const discount = Number(order.discount || 0);
  const total = order.total !== undefined ? Number(order.total) : order.bill?.totalAmount !== undefined ? Number(order.bill.totalAmount) : Number((subtotal + cgst + sgst - discount).toFixed(2));

  // Address lines formatting
  const addressLines = resolvedRestaurantAddress.includes(',') 
    ? resolvedRestaurantAddress.split(',').map(s => s.trim()).filter(Boolean)
    : [resolvedRestaurantAddress];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt - ${cleanBillNo}</title>
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            line-height: 1.25;
            color: #000;
            background: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 4px;
          }
          .header .restaurant-name {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-style: italic;
          }
          .header .address-line {
            font-size: 10px;
            color: #111;
            margin: 1px 0;
          }
          .contact-section {
            font-size: 10.5px;
            margin-top: 4px;
            text-align: left;
          }
          .solid-line {
            border-top: 1px solid #000;
            margin: 4px 0;
          }
          .bill-title {
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            margin: 3px 0;
          }
          .meta-section {
            font-size: 11px;
            line-height: 1.3;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
          }
          table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 2px 0;
          }
          table.items-table th {
            font-size: 11px;
            font-weight: bold;
            padding: 3px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
          }
          .summary-bar {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 11px;
            padding: 2px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            margin: 2px 0;
          }
          .totals-section {
            font-size: 11px;
            margin-top: 4px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .final-total-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 12.5px;
            padding: 3px 0;
            margin-top: 3px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            margin-top: 8px;
            padding-top: 4px;
          }
          .footer .blunet {
            margin-top: 3px;
            font-size: 9.5px;
            font-weight: 600;
            letter-spacing: 0.3px;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">${resolvedRestaurantName}</div>
          ${addressLines.map(line => `<div class="address-line">${line}</div>`).join('')}
          <div class="contact-section">
            <div>Contact No. : ${resolvedPhone}</div>
            ${resolvedGstin ? `<div>GSTIN : ${resolvedGstin}</div>` : ''}
          </div>
        </div>

        <div class="solid-line"></div>

        <div class="bill-title">${billTitle}</div>

        <div class="meta-section">
          <div class="meta-row">
            <span>Bill No. : <strong>${cleanBillNo}</strong></span>
            <span>Order No. : <strong>${cleanOrderNo}</strong></span>
          </div>
          <div class="meta-row">
            <span>Bill Date : ${formattedDate}</span>
            <span>${formattedTime}</span>
          </div>
          <div class="meta-row">
            <span>Operator ID : ${operatorId}</span>
          </div>
          <div class="meta-row">
            <span>Payment Mode : ${paymentMode}</span>
          </div>
          ${tableName ? `
          <div class="meta-row">
            <span>Table No. : <strong>${tableName}</strong></span>
          </div>` : ''}
          <div class="meta-row">
            <span>KOT No. : ${kotNo}</span>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 44%; text-align: left;">Item</th>
              <th style="width: 18%; text-align: right;">Rate</th>
              <th style="width: 14%; text-align: center;">Qty.</th>
              <th style="width: 24%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary-bar">
          <span>Items : ${items.length}</span>
          <span>Qty. : ${totalQty}</span>
        </div>

        <div class="totals-section">
          <div class="total-row">
            <span>Cash/Card : ${total.toFixed(2)}</span>
            <span>Change : 0.00</span>
          </div>
          <div class="total-row">
            <span>Gross Total :</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          ${discount > 0 ? `
          <div class="total-row">
            <span>Discount :</span>
            <span>-${discount.toFixed(2)}</span>
          </div>` : ''}
          <div class="total-row">
            <span>CGST : @2.50 %</span>
            <span>${cgst.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>SGST : @2.50 %</span>
            <span>${sgst.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Net Total :</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Round Off :</span>
            <span>0.00</span>
          </div>
          <div class="final-total-row">
            <span>Total :</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <div>Thank you for visit</div>
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
