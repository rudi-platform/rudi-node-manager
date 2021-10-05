const { expect } = require('@jest/globals');
const axios = require('axios');
const { createRudiToken } = require('../utils/utils');
const controllers = require('./adminController');
const { Response } = require('jest-express/lib/response');

jest.mock('axios');
jest.mock('../utils/utils');
let response;

describe('AdminController', () => {
  beforeEach(() => {
    response = new Response();
    createRudiToken.mockImplementation(() => 'token');
  });

  afterEach(() => {
    response.resetMocked();
  });

  test('getEnum should return data', async () => {
    const data = { global_id: 'global', local_id: 'local', doi: 'string' };
    axios.get.mockImplementation(() => Promise.resolve({ data: data }));

    await controllers.getEnum({}, response, null);

    expect(response.body).toStrictEqual(data);
  });
  test('getEnum should return error', async () => {
    const error = new Error('Error: Request failed with status code 500');
    let axiosError = {
      status: 500,
      response: { error },
    };
    axiosError.toJSON = () => axiosError;
    axios.get.mockImplementation(() => Promise.reject(axiosError));

    await controllers.getEnum({}, response, null);

    expect(response.statusCode).toStrictEqual(501);
  });

  test('getLicences should return data', async () => {
    const data = { global_id: 'global', local_id: 'local', doi: 'string' };
    axios.get.mockImplementation(() => Promise.resolve({ data: data }));

    await controllers.getLicences(null, response, null);

    expect(response.body).toStrictEqual(data);
  });
  test('getLicences should return error', async () => {
    const error = new Error('Error: Request failed with status code 500');
    let axiosError = {
      status: 500,
      response: { error },
    };
    axiosError.toJSON = () => axiosError;
    axios.get.mockImplementation(() => Promise.reject(axiosError));

    await controllers.getLicences(null, response, null);

    expect(response.statusCode).toStrictEqual(501);
  });
});
