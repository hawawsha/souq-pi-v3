// lib/pi/config.js

const PI_API_KEY = process.env.PI_API_KEY;
const PI_APP_ID = process.env.PI_APP_ID;

const PI_NETWORK_ENV = process.env.PI_NETWORK_ENV === "mainnet" ? "mainnet" : "testnet";

const PI_BASE_URL = "https://api.minepi.com/v2";

const piClient = {
  env: PI_NETWORK_ENV,
  appId: PI_APP_ID,

  async completePayment(paymentId, txid) {
    if (!paymentId || !txid) {
      throw new Error("completePayment: paymentId و txid مطلوبان");
    }

    const response = await fetch(`${PI_BASE_URL}/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${PI_API_KEY}`,
      },
      body: JSON.stringify({ paymentId, txid }),
    });

    console.log("HTTP Status (Pi completePayment):", response.status);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `فشل استدعاء completePayment من Pi Network: ${response.status} - ${JSON.stringify(data)}`
      );
    }

    return data;
  },

  async approvePayment(paymentId) {
    if (!paymentId) {
      throw new Error("approvePayment: paymentId مطلوب");
    }

    const response = await fetch(`${PI_BASE_URL}/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${PI_API_KEY}`,
      },
    });

    console.log("HTTP Status (Pi approvePayment):", response.status);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `فشل استدعاء approvePayment من Pi Network: ${response.status} - ${JSON.stringify(data)}`
      );
    }

    return data;
  },
};

module.exports = piClient;
