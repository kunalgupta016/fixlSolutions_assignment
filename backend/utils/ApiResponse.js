/**
 * Standardized API response wrapper.
 * Ensures every successful response has a consistent shape.
 */
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static ok(res, data, message = "Success") {
    return res.status(200).json(new ApiResponse(200, data, message));
  }

  static created(res, data, message = "Created successfully") {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
