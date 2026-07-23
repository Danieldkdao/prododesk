import { GENERAL_ERROR_MESSAGE } from "./constants";

export class APIError extends Error {
  status: number = 500;
  constructor(message: string = GENERAL_ERROR_MESSAGE, status: number = 500) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}
