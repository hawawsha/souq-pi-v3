/**
 * Souq Pi - Dynamic Pi Network Configuration
 * Reads all settings from environment variables
 * Supports both testnet and mainnet via PI_NETWORK env var
 * Updated: June 2026 - Latest verified configuration
 */

/**
 * Get active network configuration dynamically from environment
 * @returns {Object} Current network configuration
 */
function getNetworkConfig() {
  const network = process.env.PI_NETWORK || 'testnet';

  // Dynamic configuration based on PI_NETWORK
  const config = {
    network,
    isProduction: network === 'mainnet',

    // API Base URL - unified endpoint for both networks
    apiBaseUrl: process.env.PI_API_BASE_URL || 'https://api.minepi.com',

    // Horizon URL - from env or default based on network
    horizonUrl: process.env.PI_HORIZON_URL || 
      (network === 'mainnet' ? 'https://api.mainnet.minepi.com' : 'https://api.testnet.minepi.com'),

    // Network Passphrase - from env or default based on network
    networkPassphrase: process.env.PI_NETWORK_PASSPHRASE || 
      (network === 'mainnet' ? 'Pi Network' : 'Pi Testnet'),

    apiVersion: process.env.PI_API_VERSION || 'v2',
    maxRetries: parseInt(process.env.REFUND_MAX_RETRIES) || 2,
    retryDelay: parseInt(process.env.REFUND_RETRY_DELAY_MS) || 5000,
  };

  return config;
}

/**
 * Get Pi API headers with proper authentication
 * Using PI_API_KEY for all requests (PI_APP_SECRET is deprecated)
 * @param {string} token - Optional access token for user-specific requests
 * @returns {Object} Headers object
 */
function getPiApiHeaders(token = null) {
  const apiKey = process.env.PI_API_KEY;

  if (!apiKey && !token) {
    throw new Error('API Key or access token is required');
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (apiKey) {
    headers['Authorization'] = `Key ${apiKey}`;
  }

  return headers;
}

/**
 * Get full API endpoint URL
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full URL
 */
function getApiUrl(endpoint) {
  const config = getNetworkConfig();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${config.apiBaseUrl}/${config.apiVersion}${cleanEndpoint}`;
}

/**
 * Get Horizon server URL for blockchain operations
 * @returns {string} Horizon URL
 */
function getHorizonUrl() {
  return getNetworkConfig().horizonUrl;
}

/**
 * Get network passphrase for transaction signing
 * @returns {string} Network passphrase
 */
function getNetworkPassphrase() {
  return getNetworkConfig().networkPassphrase;
}

/**
 * Validate that required environment variables are set
 * PI_APP_SECRET is no longer required - only PI_API_KEY
 * @throws {Error} If required variables are missing
 */
function validateNetwork() {
  const requiredVars = ['PI_APP_ID', 'PI_API_KEY'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get retry configuration for refund operations
 * @returns {Object} Retry settings
 */
function getRetryConfig() {
  return {
    maxRetries: parseInt(process.env.REFUND_MAX_RETRIES) || 2,
    retryDelay: parseInt(process.env.REFUND_RETRY_DELAY_MS) || 5000,
    manualTimeout: parseInt(process.env.REFUND_MANUAL_TIMEOUT_MS) || 30000,
  };
}

module.exports = {
  getNetworkConfig,
  getPiApiHeaders,
  getApiUrl,
  getHorizonUrl,
  getNetworkPassphrase,
  validateNetwork,
  getRetryConfig,
};
