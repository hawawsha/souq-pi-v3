/**
 * Souq Pi - Approve Payment
 */

import piClient from "../../../lib/pi-client";
import { validateNetwork } from "../../../lib/pi-config";
import logger from "../../../lib/logger";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  try {
    validateNetwork();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Network configuration error",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: "paymentId is required",
      });
    }

    await piClient.approvePayment(paymentId);

    logger.info("Payment approved", {
      paymentId,
    });

    return res.status(200).json({
      success: true,
      message: "Payment approved",
    });
  } catch (error) {
    logger.error("Approve payment failed", {
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      error: "Approve payment failed",
      message: error.message,
    });
  }
}
