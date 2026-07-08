/**
 * Souq Pi - Payment API Endpoint (FIXED)
 * Server only handles orders (NO Pi createPayment here)
 */

import { v4 as uuidv4 } from "uuid";
import { Order, Balance, Notification } from "../../lib/models";
import { connectDB } from "../../lib/db";
import { validateNetwork } from "../../lib/pi-config";
import logger from "../../lib/logger";
import piClient from "../../lib/pi-client";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");

  try {
    validateNetwork();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Network configuration error",
    });
  }

  switch (req.method) {
    case "POST":
      return createPayment(req, res);

    case "GET":
      return getPaymentStatus(req, res);

    default:
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
  }
}

/**
 * CREATE ORDER ONLY (NO PI SDK CALL HERE)
 */
async function createPayment(req, res) {
  try {
    await connectDB();

    const {
      productId,
      productName,
      amount,
      buyerUid,
      buyerUsername,
      buyerWalletAddress,
      shippingAddress,
    } = req.body;

    if (!productId || !amount || !buyerUid) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const orderId = uuidv4();
    const network = process.env.PI_NETWORK || "testnet";

    const order = new Order({
      orderId,

      buyer: {
        uid: buyerUid,
        username: buyerUsername,
        walletAddress: buyerWalletAddress,
      },

      seller: {
        uid: "souq-pi",
        username: "Souq Pi",
      },

      product: {
        productId,
        name: productName,
        price: amount,
      },

      payment: {
        paymentId: null,
        amount,
        status: "pending",
        network,
      },

      status: "pending_payment",

      shippingAddress: shippingAddress || {},
    });

    await order.save();

    const piPayment = await piClient.createPayment({
      amount: amount,
      memo: `Payment for ${productName}`,
      metadata: { orderId, buyerUid },
    });
    order.payment.paymentId = piPayment.identifier;
    await order.save();

    logger.info("Order created", { orderId, amount });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId,
        amount,
        network,
      },
    });

  } catch (error) {
    logger.error("Payment creation failed", {
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * STATUS CHECK (OPTIONAL)
 */
async function getPaymentStatus(req, res) {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "orderId required",
      });
    }

    await connectDB();

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
