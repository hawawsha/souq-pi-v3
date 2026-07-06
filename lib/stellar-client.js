/**
 * Souq Pi - Stellar Blockchain Client
 * Dynamic - Supports both testnet and mainnet via env vars
 * Updated to use @stellar/stellar-sdk v13.5.0
 */

const StellarSdk = require('@stellar/stellar-sdk');
const { getHorizonUrl, getNetworkPassphrase } = require('./pi-config');
const logger = require('./logger');

class StellarClient {
  constructor() {
    this.horizonUrl = getHorizonUrl();
    this.networkPassphrase = getNetworkPassphrase();
    this.server = new StellarSdk.Horizon.Server(this.horizonUrl);
  }

  async loadAccount(publicKey) {
    try {
      const account = await this.server.accounts().accountId(publicKey).call();
      logger.info('Account loaded', { publicKey: publicKey.substring(0, 8) + '...' });
      return new StellarSdk.Account(account.id, account.sequence);
    } catch (error) {
      logger.error('Account load failed', { publicKey, error: error.message });
      throw error;
    }
  }

  async fetchBaseFee() {
    try {
      const response = await this.server.feeStats().call();
      const baseFee = response.last_ledger_base_fee || 100;
      logger.info('Base fee retrieved', { baseFee });
      return parseInt(baseFee);
    } catch (error) {
      logger.warn('Fetch base fee failed, using default', { error: error.message });
      // Return default fee if unable to fetch
      return 100;
    }
  }

  async buildPaymentTransaction({ sourcePublicKey, sourceSecretKey, destination, amount, paymentId }) {
    try {
      const account = await this.loadAccount(sourcePublicKey);
      const baseFee = await this.fetchBaseFee();

      const payment = StellarSdk.Operation.payment({
        destination: destination,
        asset: StellarSdk.Asset.native(),
        amount: amount.toString(),
      });

      // Stellar memo has a 28 character limit for text
      const memoText = paymentId.substring(0, 28);

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: baseFee,
        networkPassphrase: this.networkPassphrase,
        timebounds: {
          minTime: 0,
          maxTime: Math.floor(Date.now() / 1000) + 300, // 5 minute timeout
        },
      })
        .addOperation(payment)
        .addMemo(StellarSdk.Memo.text(memoText))
        .build();

      const keypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
      transaction.sign(keypair);

      logger.info('Transaction built and signed', {
        destination: destination.substring(0, 8) + '...',
        amount,
        memo: memoText,
      });

      return transaction;
    } catch (error) {
      logger.error('Transaction build failed', { error: error.message });
      throw error;
    }
  }

  async submitTransaction(transaction) {
    try {
      const result = await this.server.submitTransaction(transaction);
      logger.info('Transaction submitted', { txid: result.id });
      return result;
    } catch (error) {
      logger.error('Transaction submission failed', {
        error: error.message,
        response: error.response?.data,
      });
      throw error;
    }
  }

  async processRefund({ sourcePublicKey, sourceSecretKey, destination, amount, refundId }) {
    const transaction = await this.buildPaymentTransaction({
      sourcePublicKey,
      sourceSecretKey,
      destination,
      amount,
      paymentId: `REFUND-${refundId.substring(0, 20)}`,
    });

    return await this.submitTransaction(transaction);
  }

  async verifyTransaction(txid) {
    try {
      const transaction = await this.server.transactions().transactionId(txid).call();
      logger.info('Transaction verified', { txid, successful: transaction.successful });
      return transaction;
    } catch (error) {
      logger.error('Transaction verification failed', { txid, error: error.message });
      throw error;
    }
  }
}

module.exports = new StellarClient();
