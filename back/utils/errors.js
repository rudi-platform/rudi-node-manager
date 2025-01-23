export const STATUS_CODE = 'statusCode'

export class RudiError extends Error {
  constructor(message, code, name, desc, ctxMod, ctxFun) {
    super(message)
    this[STATUS_CODE] = code ?? 500
    this.name = name
    this.description = desc
    this.ctxMod = ctxMod
    this.ctxFun = ctxFun
  }

  toString() {
    return `Error ${this[STATUS_CODE]} (${this.name}): ${this.message}`
  }
  toJSON() {
    return {
      [STATUS_CODE]: this[STATUS_CODE],
      type: this.constructor.name,
      name: this.name,
      error: this.error,
      message: this.message,
    }
  }

  get code() {
    return this[STATUS_CODE]
  }

  static createRudiHttpError(code, message, ctxMod, ctxFun) {
    try {
      switch (parseInt(code)) {
        case 400:
          return new BadRequestError(message, ctxMod, ctxFun)
        case 460:
        case 401:
          return new UnauthorizedError(message, ctxMod, ctxFun)
        case 403:
          return new ForbiddenError(message, ctxMod, ctxFun)
        case 404:
          return new NotFoundError(message, ctxMod, ctxFun)
        case 405:
          return new MethodNotAllowedError(message, ctxMod, ctxFun)
        case 406:
          return new NotAcceptableError(message, ctxMod, ctxFun)
        case 501:
          return new NotImplementedError(message, ctxMod, ctxFun)
        case 503:
          return new ServiceUnavailableError(message, ctxMod, ctxFun)
        case 500:
        default:
          return new InternalServerError(message, ctxMod, ctxFun)
      }
    } catch (err) {
      throw new Error(`Uncaught error during error creation: ${err}`)
    }
  }
}

export class BadRequestError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(errMessage, 400, 'Bad request', 'The JSON (or the request) is not valid', ctxMod, ctxFun)
  }

  toString() {
    return `Error ${this[STATUS_CODE]} (${this.name}): ${this.message} [${this.path}]`
  }
}

export class UnauthorizedError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(errMessage, 401, 'Unauthorized', 'The request requires an user authentication', ctxMod, ctxFun)
  }
}

export class ForbiddenError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(errMessage, 403, 'Forbidden', 'The access is not allowed', ctxMod, ctxFun)
  }
}

export class NotFoundError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(errMessage, 404, 'Not Found', 'The resource was not found', ctxMod, ctxFun)
  }
}

export class MethodNotAllowedError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(
      errMessage,
      405,
      'Method Not Allowed',
      'Request method is not supported for the requested resource',
      ctxMod,
      ctxFun
    )
  }
}

export class NotAcceptableError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(
      errMessage,
      406,
      'Not Acceptable',
      'Headers sent in the request are not compatible with the service',
      ctxMod,
      ctxFun
    )
  }
}

export class InternalServerError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(errMessage, 500, 'Internal Server Error', 'Internal Server Error', ctxMod, ctxFun)
  }
}

export class NotImplementedError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(
      errMessage,
      501,
      'Not Implemented',
      'The server does not support the functionality required to fulfill the request',
      ctxMod,
      ctxFun
    )
  }
}

export class ServiceUnavailableError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(errMessage, 503, 'Service Unavailable', 'The server is unreachable', ctxMod, ctxFun)
  }
}

export class ConnectionError extends RudiError {
  constructor(errMessage, ctxMod, ctxFun) {
    super(
      errMessage,
      503,
      'Connection Failed',
      'Connection failed, target server is unreachable. Contact the RUDI admin ',
      ctxMod,
      ctxFun
    )
  }
}

export const statusOK = (message) => ({ status: 'OK', message })

export const STATUS_CODES = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a Teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  509: 'Bandwidth Limit Exceeded',
  510: 'Not Extended',
  511: 'Network Authentication Required',
}
