import { Response } from 'express';

class ApiResponse {
  constructor(
    public statusCode: number,
    public data: unknown,
    public message: string = 'Success'
  ) {}

  send(res: Response) {
    res.status(this.statusCode).json({
      success: true,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    });
  }
}

export default ApiResponse;
