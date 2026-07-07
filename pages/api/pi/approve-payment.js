/**
 * Souq Pi - Approve Payment (A2U)
 */

import { connectDB } from "../../../lib/db";
import { Order } from "../../../lib/models";
import piClient from "../../../lib/pi-client";
import logger from "../../../lib/logger";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    await connectDB();

    const { paymentId, orderId } = req.body;

    if (!paymentId || !orderId) {
      return res.status(400).json({
        success: false,
        error: "paymentId and orderId are required",
      });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // اعتماد الدفع في Pi
    await piClient.approvePayment(paymentId);

    // تحديث الطلب
    order.payment.paymentId = paymentId;
    order.payment.status = "approved";

    await order.save();

    logger.info("Payment approved", {
      orderId,
      paymentId,
    });

    return res.status(200).json({
      success: true,
      paymentId,
    });

  } catch (error) {

    logger.error("Approve payment failed", {
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
    });

  }
}
