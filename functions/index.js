const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// Configure the email transport using SMTP (Gmail example)
// For production, use environment variables to store credentials securely
const gmailEmail = functions.config().gmail.email;
const gmailPass = functions.config().gmail.password;

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPass,
  },
});

// The email address to which orders will be sent
const ORDER_RECIPIENT = 'ruthaisuebeogun@gmail.com';

exports.sendOrderEmail = functions.https.onCall(async (data, context) => {
  const { userEmail, address, items, total, orderId } = data;

  let orderText = `New Order Placed!\n`;
  orderText += `User: ${userEmail}\n`;
  orderText += `Address: ${address}\n`;
  orderText += `Items:\n`;
  items.forEach(item => {
    orderText += `- ${item.name} (Qty: ${item.quantity})\n`;
  });
  orderText += `Total: $${total.toFixed(2)}\n`;
  orderText += `\nOrder ID: ${orderId}`;

  const mailOptions = {
    from: `Order Bot <${gmailEmail}>`,
    to: ORDER_RECIPIENT,
    subject: 'New Order Placed',
    text: orderText,
  };

  try {
    await mailTransport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending order email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});
