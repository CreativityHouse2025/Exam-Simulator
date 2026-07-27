import { validate } from "uuid";
import { AppError } from "../errors/AppError.js";

export function validateUuid(value: string, fieldName: string): string {
  if (!validate(value)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: `${fieldName} must be a valid UUID`,
    });
  }
  return value;
}
