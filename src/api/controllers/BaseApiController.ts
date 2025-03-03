import express, { Router } from 'express';

export abstract class BaseApiController {
  public router: Router;
  public basePath: string;

  constructor(basePath: string) {
    this.router = express.Router();
    this.basePath = basePath;
  }

  abstract bootRoutes(): void;

  public formatPaginatedResponse(
    page: number,
    limit: number,
    totalPages: number,
    data: any
  ): Object {
    return {
      data: data,
      pagination: {
        page,
        limit,
        totalPages,
      },
    };
  }

  public successResponse(): Object {
    return {
      success: true,
    };
  }

  public failResponse(message: string): Object {
    return {
      success: false,
      message,
    };
  }
}
