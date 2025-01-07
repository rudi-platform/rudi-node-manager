/* eslint-disable no-console */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import rudiLogger, { RudiLogger, Severity as _Severity } from '@aqmo.org/rudi_logger'
const { Transport } = rudiLogger

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getHash, isDevEnv } from '../config/backOptions.js'
import { getConf } from '../config/config.js'
import { beautify, nowFormatted } from './utils.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
const APP_NAME = getConf('logging', 'app_name')
const SHOULD_SYSLOG = getConf('logging', 'log_style') === 'syslog' || !isDevEnv()

// Helper functions
/**
 * build ips array from the request
 * @param {*} req Request
 * @return {Array} Array of ip and redirections
 */
function extractIpRedirections(req) {
  const headers = req.headers
  if (!headers) return []
  const redirections = headers['x-forwarded-for'] || headers['X-Forwarded-For']
  let result = []
  if (Array.isArray(redirections)) {
    result = redirections
  }
  if (typeof redirections === 'string') {
    result = redirections.split(',')
  }
  return result
}
/**
 * build the logger option object
 * @return {Object} option for the logger
 */
function getRudiLoggerOptions() {
  let facility = 20
  if (getConf('syslog', 'syslog_facility').slice(0, 5) === 'local') {
    facility = 16 + parseInt(getConf('syslog', 'syslog_facility').slice(5, 1))
  }
  let transport
  let path = getConf('syslog', 'syslog_host')
  switch (getConf('syslog', 'syslog_protocol')) {
    case 'tcp':
      transport = Transport.Tcp
      break
    case 'udp':
      transport = Transport.Udp
      break
    case 'unix':
      transport = Transport.Unix
      path = getConf('syslog', 'syslog_socket')
      break
  }
  const rudiLoggerOpts = { log_server: { path, port: getConf('syslog', 'syslog_port'), facility, transport } }

  rudiLoggerOpts.log_local = {
    console: true,
    consoleData: false,
    directory: getConf('logging', 'log_dir'),
    prefix: 'rudiProd.manager.syslog',
  }
  return rudiLoggerOpts
}

const syslog = new RudiLogger(APP_NAME, getHash(), getRudiLoggerOptions())

const rplog = function (logLevel, srcMod, srcFun, msg, context) {
  const Severity = _Severity
  let severity = Severity.Critical

  const message = displayStr(srcMod, srcFun, msg)
  switch (logLevel) {
    case 'verbose':
      severity = 'notice'
      break
    case 'error':
    case 'warn':
    case 'info':
    case 'debug':
      severity = logLevel
      break
    default:
      severity = 'debug'
  }
  let ctx
  if (context) {
    ctx = {
      subject: context.subject,
      req_ip: context.ip,
      client_id: context.id,
    }
  }
  syslog[severity](message, logWhere(srcMod, srcFun), ctx)
}

// END RUDILOGGER configuration

const logWhere = (srcMod, srcFun) => (srcMod && srcFun ? `${srcMod}/${srcFun}` : srcMod || srcFun)

const toString = (...msg) => {
  if (!msg) return '<-'
  let str = ''
  for (let m of msg) {
    let mStr = `${m}`
    if (mStr === '[Object]: Object' || mStr === '[object Object]') mStr = beautify(m)
    str = str ? `${str} ${mStr}` : mStr
  }
  return str
}

const displayStr = (srcMod, srcFun, ...msg) => `${`[${logWhere(srcMod, srcFun)}]`} ${toString(...msg)}`

const createLogLine = (level, srcMod, srcFun, ...msg) =>
  `${nowFormatted()} ${level} ${displayStr(srcMod, srcFun, ...msg)}`

// Controllers
export function getContext(req, options = {}) {
  const ctx = {}
  if (!req) {
    ctx.auth = {
      userId: '',
      clientApp: APP_NAME,
      reqIP: [],
    }
  } else {
    ctx.auth = {
      userId: req.user ? req.user.id : '',
      clientApp: APP_NAME,
      reqIP: [req.ip, ...extractIpRedirections(req)],
    }
  }

  ctx.operation = {
    opType: options.opType || 'other',
    statusCode: options.statusCode || '',
    id: options.id || '',
  }
  return ctx
}

export const logE = (srcMod, srcFun, ...msg) =>
  SHOULD_SYSLOG
    ? sysError(srcMod, srcFun, toString(msg))
    : console.error(createLogLine('error', srcMod, srcFun, ...msg))

export const logW = (srcMod, srcFun, ...msg) =>
  SHOULD_SYSLOG ? sysWarn(srcMod, srcFun, toString(msg)) : console.warn(createLogLine('warn', srcMod, srcFun, ...msg))

export const logI = (srcMod, srcFun, ...msg) =>
  SHOULD_SYSLOG ? sysInfo(srcMod, srcFun, toString(msg)) : console.info(createLogLine('info', srcMod, srcFun, ...msg))

export const logV = (srcMod, srcFun, ...msg) =>
  SHOULD_SYSLOG
    ? sysVerbose(srcMod, srcFun, toString(msg))
    : console.log(createLogLine('verbose', srcMod, srcFun, ...msg))

export const logD = (srcMod, srcFun, ...msg) =>
  SHOULD_SYSLOG
    ? sysDebug(srcMod, srcFun, toString(msg))
    : console.debug(createLogLine('debug', srcMod, srcFun, ...msg))

// -------------------------------------------------------------------------------------------------
// Syslog functions
// -------------------------------------------------------------------------------------------------

// System-related "panic" conditions
export const sysEmerg = (srcMod, srcFun, msg, context) => rplog('emergency', srcMod, srcFun, msg, context)

// Something bad is about to happen, deal with it NOW!
export const sysCrit = (srcMod, srcFun, msg, context) => rplog('critical', srcMod, srcFun, msg, context)

// Events that are unusual but not error conditions - might be summarized in an email to developers
// or admins to spot potential problems - no immediate action required.
export const sysNotice = (srcMod, srcFun, msg, context) => rplog('notice', srcMod, srcFun, msg, context)

// -------------------------------------------------------------------------------------------------
// Syslog functions: app level
// -------------------------------------------------------------------------------------------------

// Something bad happened, deal with it NOW!
export const sysAlert = (srcMod, srcFun, msg, context) => rplog('alert', srcMod, srcFun, msg, context)

// A failure in the system that needs attention.
export const sysError = (srcMod, srcFun, msg, context) => rplog('error', srcMod, srcFun, msg, context)

// Something will happen if it is not dealt within a timeframe.
export const sysWarn = (srcMod, srcFun, msg, context) => rplog('warn', srcMod, srcFun, msg, context)

// Normal operational messages - may be harvested for reporting, measuring throughput, etc.
// No action required.
export const sysInfo = (srcMod, srcFun, msg, context) => rplog('info', srcMod, srcFun, msg, context)

// Events that are unusual but not error conditions - might be summarized in an email to developers
// or admins to spot potential problems - no immediate action required.
// No action required.
export const sysVerbose = (srcMod, srcFun, msg, context) => rplog('verbose', srcMod, srcFun, msg, context)

// Info useful to developers for debugging the application, not useful during operations.
// No action required.
export const sysDebug = (srcMod, srcFun, msg, context) => rplog('debug', srcMod, srcFun, msg, context)
