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
const callApiModule = async (req, reply, url, opType) => {
  const fun = 'callApiModule'
  try {
    if (cache[opType]) return reply ? reply.status(200).send(cache[opType]) : cache[opType]
    const completeUrl = new URL(url, getRudiApi())
    if (req?.query) completeUrl.search = new URLSearchParams(req.query)

    const data = await rudiApiGet(getCompleteRudiApiUrl(url, req))
    cache[opType] = data
    return reply ? reply.status(200).send(data) : data
  } catch (err) {
    // log.w(mod, fun, cleanErrMsg(err))
    if (reply) reply.status(err.statusCode).send(err.message)
    throw err
  }
}

// Controllers
exports.getVersion = (req, reply) => callApiModule(req, reply, '/api/version', 'get_version')
exports.getEnum = (req, reply) => {
  const lang = req.params?.lang || req.query?.lang || 'fr'
  return callApiModule(req, reply, getAdminApi(`enum?lang=${lang}`), `get_enum_${lang}`)
}
exports.getLicences = (req, reply) =>
  callApiModule(req, reply, getAdminApi('licences'), 'get_licences')

exports.getThemeByLang = (req, reply) =>
  callApiModule(
    req,
    reply,
    getAdminApi('enum/themes/', req.params?.lang || 'fr'),
    'get_theme_by_lg'
  )

const getThemes = (req, reply) => {
  const lang = req.params?.lang || req.query?.lang || 'fr'
  return callApiModule(
    reply ? req : null,
    reply,
    getAdminApi('enum/themes', lang),
    `get_theme_by_lg_${lang}`
  )
}

exports.getThemeByLang = (req, reply) => getThemes(req, reply)
exports.getApiExternalUrl = () =>
  callApiModule(null, null, getAdminApi('check/node/url'), 'get_api_url')
exports.getPortalUrl = () =>
  callApiModule(null, null, getAdminApi('check/portal/url'), 'get_portal_url')

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
