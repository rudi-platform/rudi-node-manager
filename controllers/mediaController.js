const axios = require('axios');
const { getMediaDwnlUrl, getRudiApi, getRudiMediaUrl, getAdminApi } = require('../config/config');
const { createRudiApiToken, createPmHeadersForMedia } = require('../utils/jwt');
const errorHandler = require('./errorHandler');

exports.getMediaById = (req, res, next) => {
  const { id } = req.params;
  return axios
    .get(getMediaDwnlUrl(id))
    .then((resRUDI) => {
      const results = resRUDI.data;
      res.status(200).json(results);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_media', id: `media+${id}` });
      res.status(error.statusCode).json(error);
    });
};

// Deprecated ? now use direct access
exports.getDownloadById = (req, res, next) => {
  const { id } = req.params;
  return axios
    .get(getMediaDwnlUrl(id), {
      headers: { 'media-access-method': 'Direct', 'media-access-compression': true },
    })
    .then((resRUDI) => {
      const results = resRUDI.data;
      res.status(200).contentType(resRUDI.headers['content-type']).json(results);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_download', id: `media+${id}` });
      res.status(error.statusCode).json(error);
    });
};

exports.commitMedia = async (req, res, next) => {
  // const fun = 'commitMedia';
  // console.log('T (commitMedia) req.body', req.body);
  const {
    media_id: mediaId,
    global_id: metadataId,
    commit_uuid: commitId,
    zone_name: zoneName,
  } = req.body;

  // Let's commit the media on Media module
  const pmMediaHeaders = createPmHeadersForMedia();

  try {
    const commitMediaRes = await axios.post(
      getRudiMediaUrl(`commit/?zone_name=${zoneName}&commit_uuid=${commitId}`),
      JSON.stringify({ commit_uuid: commitId, zone_name: zoneName }),
      pmMediaHeaders,
    );
    console.log(
      'T (commitMedia) commitMediaRes',
      commitMediaRes?.statusText || commitMediaRes?.data || commitMediaRes,
    );
  } catch (err) {
    console.error(
      `T (commitMedia) ERR${err.response?.status} Media commit:`,
      err.response?.data || err.response?.statusText,
    );
    return res
      .status(err.response?.status || 500)
      .send('ERR Media commit: ' + err.response?.data || err.response?.statusText);
  }
  const url = getAdminApi(`media/${mediaId}/commit`);
  const token = createRudiApiToken(url, { method: 'POST' });
  const apiHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const mediaInfo = await axios.post(getRudiApi(url), { metadataId, commitId }, apiHeaders);
    console.log('T (commitMedia) commit API OK:', mediaInfo.data);
    return res.status(200).send({ status: 'OK' });
  } catch (err) {
    console.error(
      `T (commitMedia) ERR${err.response?.status} Api commit:`,
      err.response?.data || err.response?.statusText || err.response,
    );
    return res
      .status(err.response?.status || 500)
      .send('ERR Api commit: ' + err.response?.data || err.response?.statusText || err.response);
  }
};
