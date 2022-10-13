const axios = require('axios');
const config = require('../config/config');
const { createRudiApiToken } = require('../utils/jwt');
const { getApiUrl } = require('./adminController');
const errorHandler = require('./errorHandler');

const serveurMedia = (id) => {
  if (!config?.rudi_media?.media_url)
    throw new Error(
      `Server configuration error: config file should contain a parameter 'rudi_media.media_url'`,
    );
  const mediaUrl = `${config.media_url}/download/${id}`;
  return mediaUrl;
};

exports.getMediaById = (req, res, next) => {
  const { id } = req.params;
  return axios
    .get(serveurMedia(id))
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
    .get(serveurMedia(id), {
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
  const { mediaId, resourceId } = req.body;

  const url = getApiUrl(`media/${mediaId}/commit`);
  const token = createRudiApiToken(url, req);

  const mediaInfo = await axios.post(
    url,
    { global_id: resourceId },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
};
