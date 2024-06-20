const mod = 'callApiSimple'

// Internal dependencies
const {
  getRudiApi,
  getAdminApi,
  getConsoleFormUrl,
  getRudiMediaUrl,
  getCompleteRudiApiUrl,
} = require('../config/config')
const { handleError } = require('./errorHandler')
const { getTags } = require('../config/backOptions')
const { rudiApiGet } = require('../utils/connect.js')

let cache = {}
// Helper functions

/**
 * This function makes a call to RUDI API module
 * It surrounds the API call with a local cache retrieval and also can be use either in a request
 * context (if req/reply are fulfilled, it will directly reply), or as a secondary function the
 * result of which one would wish to further process.
 *
 * This should be used preferably for persistant data, such as server URLs, not resources list
 * (or you'll need to invalidate the cache when a PUT occurred)
 * @param {*} url The external (relative) URL you wish to call on RUDI API server
 * @param {*} req Original request
 * @param {*} reply Original reply object, that will be used to return a result if it's provided
 * @returns
 */
const callApiModule = async (url, req, reply) => {
  const fun = 'callApiModule'
  try {
    if (cache[url]) return reply ? reply.status(200).send(cache[url]) : cache[url]
    const completeUrl = new URL(url, getRudiApi())
    if (req?.query) completeUrl.search = new URLSearchParams(req.query)

    const data = await rudiApiGet(getCompleteRudiApiUrl(url, req))
    cache[url] = data
    return reply ? reply.status(200).send(data) : data
  } catch (err) {
    // log.w(mod, fun, cleanErrMsg(err))
    if (reply) reply.status(err.statusCode).send(err.message)
    throw err
  }
}

// Controllers
exports.getVersion = (req, reply) => callApiModule('/api/version', req, reply)
exports.getEnum = (req, reply) => {
  const lang = req.params?.lang || req.query?.lang || 'fr'
  return callApiModule(getAdminApi(`enum?lang=${lang}`), req, reply)
}
exports.getLicences = (req, reply) => callApiModule(getAdminApi('licences'), req, reply)

exports.getThemeByLang = (req, reply) =>
  callApiModule(getAdminApi('enum/themes/', req.params?.lang || 'fr'), req, reply)

const getThemes = (req, reply) => {
  const lang = req.params?.lang || req.query?.lang || 'fr'
  return callApiModule(getAdminApi('enum/themes', lang), req, reply)
}

exports.getThemeByLang = (req, reply) => getThemes(req, reply)
exports.getApiExternalUrl = () => callApiModule(getAdminApi('check/node/url'))
exports.getPortalUrl = () => callApiModule(getAdminApi('check/portal/url'))

exports.getInitData = async (req, reply) => {
  try {
    const data = await Promise.all([getThemes(req), this.getApiExternalUrl(), this.getPortalUrl()])
    const tags = getTags()
    const initData = {
      appTag: tags?.tag,
      gitHash: tags?.hash,
      themeLabels: data[0],
      apiExtUrl: data[1],
      mediaExtUrl: getRudiMediaUrl(),
      formUrl: getConsoleFormUrl(),
      portalConnected: !!data[2],
    }
    return reply ? reply.status(200).json(initData) : initData
  } catch (e) {
    // log.e(mod, 'getInitData', cleanErrMsg(e))
    if (reply) handleError(req, reply, e, 500, 'getInitData', 'init_data')
    else throw new Error(`Couldn't get init data: ${e.message}`)
  }
}
