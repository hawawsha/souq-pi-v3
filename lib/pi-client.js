import axios from "axios";
import logger from "./logger";

const API_BASE =
  process.env.PI_API_BASE_URL || "https://api.minepi.com";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    Authorization: `Key ${process.env.PI_API_KEY}`,
    "Content-Type": "application/json",
  },
});

class PiClient {

  async approvePayment(paymentId) {
    logger.info("Approving payment", { paymentId });

    const { data } = await api.post(
      `/v2/payments/${paymentId}/approve`
    );

    return data;
  }

  async completePayment(paymentId, txid) {
    logger.info("Completing payment", {
      paymentId,
      txid,
    });

    const { data } = await api.post(
      `/v2/payments/${paymentId}/complete`,
      {
        txid,
      }
    );

    return data;
  }

  async cancelPayment(paymentId) {
    logger.info("Cancelling payment", {
      paymentId,
    });

    const { data } = await api.post(
      `/v2/payments/${paymentId}/cancel`
    );

    return data;
  }
    async getPayment(paymentId) {
    logger.info("Getting payment", {
      paymentId,
    });

    const { data } = await api.get(
      `/v2/payments/${paymentId}`
    );

    return data;
  }

  async createPayment(paymentData) {
    logger.info("Creating payment through Pi API", {
      paymentData,
    });

    const { data } = await api.post(
      "/v2/payments",
      paymentData
    );

    return data;
  }

}

export default new PiClient();
