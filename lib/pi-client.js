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
    try {

      logger.info("Creating payment", paymentData);

      const { data } = await api.post(
        "/v2/payments",
        paymentData
      );

      return data;

    } catch (err) {

      logger.error("Pi createPayment failed", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      throw err;
    }
  }

  async getPayment(paymentId) {
    try {

      logger.info("Getting payment", { paymentId });

      const { data } = await api.get(
        `/v2/payments/${paymentId}`
      );

      return data;

    } catch (err) {

      logger.error("Pi getPayment failed", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      throw err;
    }
  }

  async approvePayment(paymentId) {
    try {

      logger.info("Approving payment", { paymentId });

      const { data } = await api.post(
        `/v2/payments/${paymentId}/approve`
      );

      return data;

    } catch (err) {

      logger.error("Pi approvePayment failed", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      throw err;
    }
  }

  async completePayment(paymentId) {
    try {

      logger.info("Completing payment", { paymentId });

      const { data } = await api.post(
        `/v2/payments/${paymentId}/complete`
      );

      return data;

    } catch (err) {

      logger.error("Pi completePayment failed", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      throw err;
    }
  }

  async cancelPayment(paymentId) {
    try {

      logger.info("Cancelling payment", { paymentId });

      const { data } = await api.post(
        `/v2/payments/${paymentId}/cancel`
      );

      return data;

    } catch (err) {

      logger.error("Pi cancelPayment failed", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      throw err;
    }
  }

}

export default new PiClient();
