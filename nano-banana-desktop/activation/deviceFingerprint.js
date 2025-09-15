const crypto = require('crypto');
const os = require('os');

class DeviceFingerprint {
  /**
   * Generate a unique device fingerprint based on hardware characteristics
   * @returns {Object} Object containing deviceId and deviceInfo
   */
  static generate() {
    const info = {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpus: os.cpus()[0]?.model || 'unknown',
      totalmem: os.totalmem(),
      // Add network interface fingerprint
      networkInterfaces: this.getNetworkFingerprint(),
      // Add OS release info
      release: os.release(),
      // Add CPU count
      cpuCount: os.cpus().length
    };
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(info))
      .digest('hex');
      
    return {
      deviceId: fingerprint,
      deviceInfo: info
    };
  }
  
  /**
   * Get network interface fingerprint (MAC addresses)
   * @returns {Array} Sorted array of MAC addresses
   */
  static getNetworkFingerprint() {
    const interfaces = os.networkInterfaces();
    const macs = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal interfaces and invalid MAC addresses
        if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
          macs.push(iface.mac);
        }
      }
    }
    
    return macs.sort();
  }
  
  /**
   * Generate a simplified device fingerprint for display purposes
   * @param {string} deviceId Full device fingerprint
   * @returns {string} Shortened device ID for display
   */
  static getDisplayId(deviceId) {
    return deviceId.substring(0, 8).toUpperCase();
  }
  
  /**
   * Validate if current device matches the stored fingerprint
   * @param {string} storedDeviceId Previously stored device fingerprint
   * @returns {boolean} True if device matches
   */
  static validateDevice(storedDeviceId) {
    const current = this.generate();
    return current.deviceId === storedDeviceId;
  }
  
  /**
   * Get device info for display purposes
   * @returns {Object} Human-readable device information
   */
  static getDeviceInfo() {
    const info = {
      platform: this.getPlatformName(os.platform()),
      architecture: os.arch(),
      hostname: os.hostname(),
      cpu: os.cpus()[0]?.model || 'Unknown CPU',
      memory: this.formatMemory(os.totalmem()),
      osVersion: os.release()
    };
    
    return info;
  }
  
  /**
   * Convert platform code to human-readable name
   * @param {string} platform OS platform code
   * @returns {string} Human-readable platform name
   */
  static getPlatformName(platform) {
    const platformNames = {
      'win32': 'Windows',
      'darwin': 'macOS',
      'linux': 'Linux',
      'freebsd': 'FreeBSD',
      'openbsd': 'OpenBSD'
    };
    
    return platformNames[platform] || platform;
  }
  
  /**
   * Format memory size in human-readable format
   * @param {number} bytes Memory size in bytes
   * @returns {string} Formatted memory size
   */
  static formatMemory(bytes) {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  }
}

module.exports = DeviceFingerprint;
