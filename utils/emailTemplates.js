// Escape dynamic values before inserting them into HTML emails.
const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const money = (value) => {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} EGP`;
};

const getCustomerName = (user) => {
  return escapeHtml(
    user?.name ||
      user?.fullName ||
      user?.username ||
      user?.email ||
      'Customer'
  );
};

const getOrderId = (order) => {
  return escapeHtml(order?._id || order?.id || '');
};

// Confirmation email sent after successful Stripe payment.
const orderConfirmationEmail = (order, user) => {
  const customerName = getCustomerName(user);
  const orderId = getOrderId(order);
  const items = Array.isArray(order?.items) ? order.items : [];

  const itemRows = items
    .map((item) => {
      const name = escapeHtml(item?.name || 'Product');
      const quantity = Number(item?.quantity || 0);
      const price = Number(item?.price || 0);
      const lineTotal = quantity * price;

      return `
        <tr>
          <td>${name}</td>
          <td>${quantity}</td>
          <td>${money(price)}</td>
          <td>${money(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  const subtotal = Number(order?.subtotal || 0);
  const shippingFee = Number(order?.shippingFee || 0);
  const tax = Number(order?.tax || 0);
  const discount = Number(order?.discount || 0);
  const totalPrice = Number(order?.totalPrice || 0);

  const textItems = items
    .map((item) => {
      const name = String(item?.name || 'Product');
      const quantity = Number(item?.quantity || 0);
      const price = Number(item?.price || 0);
      const lineTotal = quantity * price;

      return `${name} | Quantity: ${quantity} | Price: ${money(
        price
      )} | Line total: ${money(lineTotal)}`;
    })
    .join('\n');

  return {
    subject: `Order confirmation - ${orderId}`,

    text: `
Hello ${customerName},

Your order has been confirmed successfully.

Order ID: ${orderId}

Items:
${textItems || 'No items available'}

Subtotal: ${money(subtotal)}
Shipping: ${money(shippingFee)}
Tax: ${money(tax)}
Discount: ${money(discount)}
Total: ${money(totalPrice)}

Thank you for shopping with SEF Commerce.
`.trim(),

    html: `
      <div>
        <h2>Order confirmed</h2>

        <p>Hello ${customerName},</p>

        <p>Your order has been confirmed successfully.</p>

        <p>
          <strong>Order ID:</strong> ${orderId}
        </p>

        <h3>Order items</h3>

        <table border="1" cellpadding="8" cellspacing="0">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Line total</th>
            </tr>
          </thead>

          <tbody>
            ${
              itemRows ||
              '<tr><td colspan="4">No items available</td></tr>'
            }
          </tbody>
        </table>

        <h3>Order summary</h3>

        <p>Subtotal: ${money(subtotal)}</p>
        <p>Shipping: ${money(shippingFee)}</p>
        <p>Tax: ${money(tax)}</p>
        <p>Discount: ${money(discount)}</p>
        <p><strong>Total: ${money(totalPrice)}</strong></p>

        <p>Thank you for shopping with SEF Commerce.</p>
      </div>
    `.trim(),
  };
};

const statusMessages = {
  confirmed: 'Your payment was confirmed and your order is being prepared.',
  processing: 'Your order is now being processed.',
  shipped: 'Your order has been shipped.',
  delivered: 'Your order has been delivered.',
  cancelled: 'Your order has been cancelled.',
  returned: 'Your order has been marked as returned.',
};

// Status email sent after an order status update.
const orderStatusEmail = (order, user) => {
  const customerName = getCustomerName(user);
  const orderId = getOrderId(order);
  const status = String(order?.status || 'updated').toLowerCase();

  const message =
    statusMessages[status] ||
    `Your order status is now: ${status}.`;

  return {
    subject: `Order status update - ${orderId}`,

    text: `
Hello ${customerName},

${message}

Order ID: ${orderId}
New status: ${status}

Thank you for shopping with SEF Commerce.
`.trim(),

    html: `
      <div>
        <h2>Order status update</h2>

        <p>Hello ${customerName},</p>

        <p>${escapeHtml(message)}</p>

        <p>
          <strong>Order ID:</strong> ${orderId}
        </p>

        <p>
          <strong>New status:</strong> ${escapeHtml(status)}
        </p>

        <p>Thank you for shopping with SEF Commerce.</p>
      </div>
    `.trim(),
  };
};

module.exports = {
  escapeHtml,
  orderConfirmationEmail,
  orderStatusEmail,
};