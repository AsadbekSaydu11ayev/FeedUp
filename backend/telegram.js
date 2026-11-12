// Telegram Bot Notification Service for FeedUp Fast Food
// Sends instant alert to Kitchen/Cashier Telegram group when an order is created

async function sendTelegramNotification(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // If not configured, silent return
    return;
  }

  try {
    const itemsList = order.items
      ? order.items.map(it => `• <b>${it.quantity}x</b> ${it.product_name} (${new Intl.NumberFormat('uz-UZ').format(it.total_price)} so'm)`).join('\n')
      : 'Taomlar mavjud emas';

    const message = `
🔥 <b>YANGI BUYURTMA #${order.order_number}</b>
───────────────────
👤 <b>Mijoz:</b> ${order.customer_name}
📞 <b>Telefon:</b> ${order.customer_phone}
📍 <b>Manzil:</b> ${order.customer_address}
🏬 <b>Filial:</b> ${order.branch_name || 'Markaziy'}
💳 <b>To'lov turi:</b> ${order.payment_method.toUpperCase()}
⏱️ <b>Tayyorlanish vaqti:</b> ${order.prep_time_min} daqiqa

📋 <b>Tarkibi:</b>
${itemsList}

${order.notes ? `💬 <b>Izoh:</b> <i>"${order.notes}"</i>\n` : ''}
💰 <b>JAMI SUMMA:</b> <b>${new Intl.NumberFormat('uz-UZ').format(order.total_price)} so'm</b>
    `.trim();

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    if (!result.ok) {
      console.warn('Telegram API notification failed:', result.description);
    }
  } catch (err) {
    console.warn('Telegram notification network error:', err.message);
  }
}

module.exports = {
  sendTelegramNotification
};

