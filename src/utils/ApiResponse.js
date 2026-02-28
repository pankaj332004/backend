class ApiResponse {
    constructor(status, message="Success", statusCode) {
        this.status = status;
        this.message = message;
        this.statusCode = statusCode;
        this.success = statusCode  < 400;
    }
}

export { ApiResponse };