const moment = require('moment');

const LOG_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss SSS';
const logWhere = (srcMod, srcFun) => {
  return !srcMod ? srcFun : !srcFun ? srcMod : `${srcMod} . ${srcFun}`;
};

const displayStr = (srcMod, srcFun, msg) => {
  return `[ ${logWhere(srcMod, srcFun)} ] ${msg !== '' ? msg : '<-'}`;
};
const createLogLine = (level, srcMod, srcFun, msg) => {
  return `${moment().format(LOG_DATE_FORMAT)} ${level} ${displayStr(srcMod, srcFun, msg)}`;
};

exports.e = (srcMod, srcFun, msg) => {
  console.error(createLogLine('error', srcMod, srcFun, msg));
};

exports.w = (srcMod, srcFun, msg) => {
  console.warn(createLogLine('warn', srcMod, srcFun, msg));
};

exports.i = (srcMod, srcFun, msg) => {
  console.info(createLogLine('info', srcMod, srcFun, msg));
};

exports.v = (srcMod, srcFun, msg) => {
  console.log(createLogLine('verbose', srcMod, srcFun, msg));
};

exports.d = (srcMod, srcFun, msg) => {
  console.debug(createLogLine('debug', srcMod, srcFun, msg));
};

// ------------------------------------------------------------------------------------------------
// Syslog functions
// ------------------------------------------------------------------------------------------------
exports.displaySyslog = (srcMod, srcFun, msg) => {
  return `[ ${logWhere(srcMod, srcFun)} ] ${msg !== '' ? msg : '<-'}`;
};

// System-related "panic" conditions
exports.sysEmerg = (msg, info) => {
  if (info) sysLogger.emerg(msg, info);
  else sysLogger.emerg(msg);
};

// Something bad happened, deal with it NOW!
exports.sysAlert = (msg, info) => {
  if (info) sysLogger.alert(msg, info);
  else sysLogger.alert(msg);
};

// Something bad is about to happen, deal with it NOW!
exports.sysCrit = (msg, info) => {
  if (info) sysLogger.crit(msg, info);
  else sysLogger.crit(msg);
};

// A failure in the system that needs attention.
exports.sysError = (msg, info) => {
  if (info) sysLogger.error(msg, info);
  else sysLogger.error(msg);
};

// Something will happen if it is not dealt within a timeframe.
exports.sysWarn = (msg, info) => {
  if (info) sysLogger.warn(msg, info);
  else sysLogger.warn(msg);
};

// Events that are unusual but not error conditions - might be summarized in an email to developers
// or admins to spot potential problems - no immediate action required.
exports.sysNotice = (msg, info) => {
  if (info) sysLogger.notice(msg, info);
  else sysLogger.notice(msg);
};

// Normal operational messages - may be harvested for reporting, measuring throughput, etc.
// No action required.
exports.sysInfo = (msg, info) => {
  if (info) sysLogger.info(msg, info);
  else sysLogger.info(msg);
};

// Normal operational messages - may be harvested for reporting, measuring throughput, etc.
// No action required.
exports.sysDebug = (msg, info) => {
  if (info) sysLogger.debug(msg, info);
  else sysLogger.debug(msg);
};
