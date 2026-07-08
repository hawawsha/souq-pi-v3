import axios from "axios";
import logger from "./logger";

const API_BASE =
  process.env.PI_API_BASE_URL || "https://api.testnet.minepi.com";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    Authorization: `Key ${process.env.PI_API_KEY}`,
    "Content-Type": "application/json",
  },
});

class PiClient {

  async createPayment(paymentData) {
    logger.info("Creating payment", paymentData);

    const { data } = await api.post(
      "/v2/payments",
      paymentData
    );

    return data;
  }

  async getPayment(paymentId) {
    logger.info("Getting payment", { paymentId });

    const { data } = await api.get(
      `/v2/payments/${paymentId}`
    );

    return data;
  }

  async approvePayment(paymentId) {
    logger.info("Approving payment", { paymentId });

    const { data } = await api.post(
      `/v2/payments/${paymentId}/approve`
    );

    return data;
  }

  async completePayment(paymentId) {
    logger.info("Completing payment", { paymentId });

    const { data } = await api.post(
      `/v2/payments/${paymentId}/complete`
    );

    return data;
  }

  async cancelPayment(paymentId) {
    logger.info("Cancelling payment", { paymentId });

    const { data } = await api.post(
      `/v2/payments/${paymentId}/cancel`
    );

    return data;
  }

}

export default new PiClient();
