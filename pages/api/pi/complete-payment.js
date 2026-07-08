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

    // التحقق لمنع إرسال طلب تكراري إذا كانت العملية مكتملة بالفعل
    if (order.payment.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Order already completed",
        orderId: order.orderId,
      });
    }

    // إتمام الدفع على خادم Pi Network مع تمرير الـ txid المصحح
    await piClient.completePayment(paymentId, txid);

    // تحديث حالة الطلب
    order.payment.status = "completed";
    order.payment.txid = txid;
    order.status = "payment_received";

    await order.save();

    // تحديث رصيد المشتري إذا وجد
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

    // إنشاء إشعار للمستخدم
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

    logger.info("Payment completed successfully", {
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
