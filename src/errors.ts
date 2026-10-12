export interface V1ErrorContext {
  status?: number;
  code?: string;
  requestId?: string;
  body?: unknown;
  [key: string]: unknown;
}

export class BctrlError extends Error {
  readonly code: string;
  readonly context?: V1ErrorContext;

  constructor(message: string, code: string, context?: V1ErrorContext) {
    super(message);
    this.name = 'BctrlError';
    this.code = code;
    this.context = context;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      ...(this.context ? { context: this.context } : {}),
    };
  }
}

export class BctrlApiError extends BctrlError {
  constructor(message: string, code = 'api.error', context?: V1ErrorContext) {
    super(message, code, context);
    this.name = 'BctrlApiError';
  }

  get status(): number | undefined {
    return typeof this.context?.status === 'number' ? this.context.status : undefined;
  }

  get requestId(): string | undefined {
    return typeof this.context?.requestId === 'string' ? this.context.requestId : undefined;
  }
}

export class BctrlAuthenticationError extends BctrlApiError {
  constructor(message: string, code = 'auth.error', context?: V1ErrorContext) {
    super(message, code, context);
    this.name = 'BctrlAuthenticationError';
  }
}

export class BctrlPermissionError extends BctrlApiError {
  constructor(message: string, code = 'permission.denied', context?: V1ErrorContext) {
    super(message, code, context);
    this.name = 'BctrlPermissionError';
  }
}

export class BctrlNotFoundError extends BctrlApiError {
  constructor(message: string, code = 'resource.not_found', context?: V1ErrorContext) {
    super(message, code, context);
    this.name = 'BctrlNotFoundError';
  }
}

export class BctrlConflictError extends BctrlApiError {
  constructor(message: string, code = 'resource.conflict', context?: V1ErrorContext) {
    super(message, code, context);
    this.name = 'BctrlConflictError';
  }
}

export class BctrlRateLimitError extends BctrlApiError {
  constructor(message: string, code = 'rate_limit.exceeded', context?: V1ErrorContext) {
    super(message, code, context);
    this.name = 'BctrlRateLimitError';
  }
}

export class BctrlValidationError extends BctrlApiError {
  constructor(message: string, code = 'validation.error', context?: V1ErrorContext) {
    super(message, code, context);
    this.name = 'BctrlValidationError';
  }
}

export class BctrlNetworkError extends BctrlError {
  constructor(message: string, context?: V1ErrorContext) {
    super(message, 'network.error', context);
    this.name = 'BctrlNetworkError';
  }
}

export class BctrlNotReadyError extends BctrlError {
  constructor(message: string, context?: V1ErrorContext) {
    super(message, 'runtime.not_ready', context);
    this.name = 'BctrlNotReadyError';
  }
}

export class BctrlUnsupportedError extends BctrlError {
  constructor(message: string, context?: V1ErrorContext) {
    super(message, 'sdk.unsupported', context);
    this.name = 'BctrlUnsupportedError';
  }
}

export function createV1HttpError(input: {
  status: number;
  message: string;
  code?: string;
  requestId?: string;
  body?: unknown;
}): BctrlApiError {
  const context: V1ErrorContext = {
    status: input.status,
    requestId: input.requestId,
    body: input.body,
  };
  const code = input.code;
  if (code) context.code = code;

  if (input.status === 401) {
    return new BctrlAuthenticationError(input.message, code, context);
  }
  if (input.status === 403) {
    return new BctrlPermissionError(input.message, code, context);
  }
  if (input.status === 404) {
    return new BctrlNotFoundError(input.message, code, context);
  }
  if (input.status === 409) {
    return new BctrlConflictError(input.message, code, context);
  }
  if (input.status === 422 || input.status === 400) {
    return new BctrlValidationError(input.message, code, context);
  }
  if (input.status === 429) {
    return new BctrlRateLimitError(input.message, code, context);
  }
  return new BctrlApiError(input.message, code, context);
}

export function isControllerBusy(error: unknown): boolean {
  if (!(error instanceof BctrlError)) {
    return false;
  }
  const code = error.code.toLowerCase();
  return code.includes('controller') && code.includes('busy');
}
