import mongoose from 'mongoose';

type HttpError = { statusCode: number; code: string; message: string };

// Driver errors that mean "the database could not answer now", not "the request is wrong".
const transientNames = new Set([
  'MongoNetworkError',
  'MongoNetworkTimeoutError',
  'MongoServerSelectionError',
  'MongoTopologyClosedError',
  'MongoNotConnectedError',
  'MongoWaitQueueTimeoutError',
  'MongoOperationTimeoutError',
  'MongoServerClosedError',
]);
const transientLabels = ['TransientTransactionError', 'UnknownTransactionCommitResult', 'RetryableWriteError'];
// WriteConflict, NoSuchTransaction, MaxTimeMSExpired, primary step-down/shutdown codes.
const transientCodes = new Set([112, 251, 50, 91, 189, 10107, 11600, 11602, 13435, 13436]);

function hasLabel(error: object, label: string): boolean {
  const candidate = error as { hasErrorLabel?: (value: string) => boolean; errorLabels?: unknown };
  if (typeof candidate.hasErrorLabel === 'function' && candidate.hasErrorLabel(label)) return true;
  return Array.isArray(candidate.errorLabels) && candidate.errorLabels.includes(label);
}

export function isTransientDbError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { name, code, message } = error as { name?: unknown; code?: unknown; message?: unknown };
  if (typeof name === 'string' && transientNames.has(name)) return true;
  if (typeof code === 'number' && transientCodes.has(code)) return true;
  if (transientLabels.some(label => hasLabel(error, label))) return true;
  // Mongoose buffers commands while disconnected and fails them with this message.
  return typeof message === 'string' && message.includes('buffering timed out');
}

/**
 * Maps an error thrown out of a transaction wrapper. Domain errors (with statusCode), Zod and
 * CastError pass through to the central error handler; Mongoose validation becomes 400;
 * only transient driver failures become the caller's 503. Anything else stays a 500 bug.
 */
export function mapTransactionError(error: unknown, unavailable: () => HttpError): unknown {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) return error;
  if (error instanceof mongoose.Error.ValidationError) {
    return { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Dữ liệu gửi lên không hợp lệ' };
  }
  if (isTransientDbError(error)) return unavailable();
  return error;
}
