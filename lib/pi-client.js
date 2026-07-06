/**
 * Souq Pi - Pi Network API Client
 * تم تعديل التعامل مع المسارات لضمان استقرار الطلبات
 */

const axios = require('axios');
const { 
  getNetworkConfig, 
  validateNetwork 
} = require('./pi-config');
const logger = require('./logger');

class PiClient {
  constructor() {
    validateNetwork();
    const config = getNetworkConfig();

    this.client = axios.create({
      // نضع القاعدة الأساسية بدون نسخة الـ API هنا لنتحكم بها يدوياً في كل طلب
      baseURL: config.apiBaseUrl, 
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // ... (بقية الـ interceptors كما هي دون تغيير) ...
    this.client.interceptors.request.use(
      (request) => {
        const apiKey = process.env.PI_API_KEY;
        if (apiKey) {
          request.headers['Authorization'] = `Key ${apiKey}`;
        }
        return request;
      },
      (error) => Promise.reject(error)
    );
  }

  // دالة مساعدة لتحديد المسار الصحيح
  _getUrl(path) {
    const version = process.env.PI_API_VERSION || 'v2';
    return `/${version}${path}`;
  }

  async createPayment(paymentData) {
    try {
      const url = this._getUrl('/payments');
      const response = await this.client.post(url, paymentData);
      return response.data;
    } catch (error) {
      logger.error('Payment creation failed', { error: error.message, url: this._getUrl('/payments') });
      throw error;
    }
  }

  async getPayment(paymentId) {
    try {
      const url = this._getUrl(`/payments/${paymentId}`);
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      logger.error('Get payment failed', { paymentId, error: error.message });
      throw error;
    }
  }

  async approvePayment(paymentId) {
    try {
      const url = this._getUrl(`/payments/${paymentId}/approve`);
      const response = await this.client.post(url);
      return response.data;
    } catch (error) {
      logger.error('Payment approval failed', { paymentId, error: error.message });
      throw error;
    }
  }

  async completePayment(paymentId, txid) {
    try {
      const url = this._getUrl(`/payments/${paymentId}/complete`);
      const response = await this.client.post(url, { txid });
      return response.data;
    } catch (error) {
      logger.error('Payment completion failed', { paymentId, txid, error: error.message });
      throw error;
    }
  }
  
  // ... (بقية الدوال بنفس المنطق باستخدام this._getUrl) ...
}

module.exports = new PiClient();
