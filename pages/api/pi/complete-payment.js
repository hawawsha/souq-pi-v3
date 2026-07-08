/**
 * Souq Pi - Complete Payment (A2U)
 */

import { connectDB } from "../../../lib/db";
import { Order, Balance, Notification } from "../../../lib/models";
import piClient from "../../../lib/pi-client";
import { v4 as uuidv4 } from "uuid";
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

    const { paymentId, txid } = req.body;

    if (!paymentId || !txid) {
      return res.status(400).json({
        success: false,
        error: "paymentId and txid are required",
      });
    }

    const order = await Order.findOne({
      "payment.paymentId": paymentId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Complete payment on Pi Network
    await piClient.completePayment(paymentId);

    // Update order
    order.payment.status = "completed";
    order.payment.txid = txid;
    // تم تصحيح الحالة لتتوافق مع الـ Schema المسموح به
    order.status = "payment_received";

    await order.save();

    // Update buyer balance if exists
    const balance = await Balance.findOne({
      uid: order.buyer.uid,
    });

    if (balance) {
      balance.escrow.totalLocked = Math.max(
        0,
        balance.escrow.totalLocked - order.payment.amount
      );

      await balance.save();
    }

    // Notification
    await Notification.create({
      notificationId: uuidv4(),
      uid: order.buyer.uid,
      type: "payment",
      title: "Payment Completed",
      message: `Your payment for ${order.product.name} was completed successfully.`,
      data: {
        orderId: order.orderId,
        paymentId,
        txid,
      },
    });

    logger.info("Payment completed", {
      paymentId,
      txid,
      orderId: order.orderId,
    });

    return res.status(200).json({
      success: true,
      orderId: order.orderId,
      txid,
    });

  } catch (error) {

    logger.error("Complete payment failed", {
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
    });

  }
}
