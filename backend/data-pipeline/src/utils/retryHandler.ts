import logger from './logger';

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export class RetryHandler {
  private options: RetryOptions;

  constructor(options: RetryOptions) {
    this.options = {
      exponentialBackoff: true,
      ...options,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;
    let attempt = 0;

    while (attempt < this.options.maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt >= this.options.maxAttempts) {
          logger.error(`Max retry attempts (${this.options.maxAttempts}) reached`);
          throw error;
        }

        const delay = this.options.exponentialBackoff
          ? this.options.delay * Math.pow(2, attempt - 1)
          : this.options.delay;

        if (this.options.onRetry) {
          this.options.onRetry(attempt, error);
        }

        logger.warn(`Retry attempt ${attempt}/${this.options.maxAttempts} after ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
