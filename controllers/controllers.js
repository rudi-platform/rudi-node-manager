const https = require('https')
const http = require('http')
const axios = require('axios')

const resourcesList = (req, res, next) => {
    const serveur = 'http://localhost:3001';
    axios.get(serveur+'/resources',{ params: req.query }).then((resRUDI) => {
        const metadatas = resRUDI.data;
        res.status(200).json({
            body: metadatas
        });
      })
      .catch(error => {
          res.status(501).json(error);
      });
   
};
exports.getResourceById = (req, res, next) => {
    const { id } = req.params;
    const options = {
        hostname: '0.0.0.0',
        port: 3001,
        path: '/resources/' + id,
        method: 'GET'
    }
    const reqRUDI = http.request(options, resRUDI => {
        console.log(`statusCode: ${resRUDI.statusCode}`)

        resRUDI.on('data', d => {
            let data = '';
            data += d;
            res.status(resRUDI.statusCode).json({
                body: JSON.parse(data)
            });
        })
    })

    reqRUDI.on('error', error => {
        console.error(error);
        res.status(501).json(error);
    })

    reqRUDI.end()
};



module.exports.resourcesList = resourcesList;