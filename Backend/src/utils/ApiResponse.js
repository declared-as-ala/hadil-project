/**
 * Standardized API response helper.
 */
class ApiResponse {
  constructor(statusCode, data, message) {
    this.statusCode = statusCode;
    this.success = true;
    this.data = data;
    this.message = message;
  }
}

module.exports = ApiResponse;
