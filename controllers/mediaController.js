const axios = require('axios');
const { getMediaDwnlUrl, getRudiApi } = require('../config/config');
const { createRudiApiToken, createPmHeadersJwtForMedia } = require('../utils/jwt');
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
  const { mediaId, metadataId, commitId, zoneName } = req.body;

  // Let's commit the media on Media module
  const pmMediaHeaders = createPmHeadersJwtForMedia();

  const commitMediaRes = await axios.post(
    getRudiMediaUrl('commit/'),
    { commitId, zoneName },
    pmMediaHeaders,
  );
  console.log('T (commitMedia) commitMediaRes', commitMediaRes?.response?.data);

  const url = getRudiApi(`media/${mediaId}/commit`);
  const token = createRudiApiToken(url, req);
  const apiHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const mediaInfo = await axios.post(url, { metadataId, commitId }, apiHeaders);

  res.send(200).send(mediaInfo);
};
