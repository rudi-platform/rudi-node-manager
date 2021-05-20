exports.error = (error) => {
  let errorToDisplay;
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
    errorToDisplay = error.response.data;
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
    errorToDisplay = error.request;
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message);
    errorToDisplay = error.message;
  }
  console.log(error.config);
  error = error.toJSON();
  error.moreInfo = errorToDisplay;
  return error;
};
