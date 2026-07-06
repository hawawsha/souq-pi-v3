/**
 * Pi Client
 * A2U version
 * لا يستخدم REST API لإنشاء الدفع.
 */

class PiClient {
  async createPayment(data) {
    return {
      identifier: data.payment.metadata.orderId,
      status: "pending"
    };
  }

  async getPayment(paymentId) {
    return {
      identifier: paymentId,
      status: "pending"
    };
  }

  async approvePayment(paymentId) {
    return {
      identifier: paymentId,
      status: "approved"
    };
  }

  async completePayment(paymentId, txid) {
    return {
      identifier: paymentId,
      txid,
      status: "completed"
    };
  }

  async cancelPayment(paymentId) {
    return {
      identifier: paymentId,
      status: "cancelled"
    };
  }
}

module.exports = new PiClient();
