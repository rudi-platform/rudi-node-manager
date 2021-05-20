const { expect } = require('@jest/globals');
const axios = require('axios');
const controllers = require('./controllers');
const { Response } = require('jest-express/lib/response');

jest.mock('axios');
let response;

describe('Controllers', () => {
  beforeEach(() => {
    response = new Response();
  });

  afterEach(() => {
    response.resetMocked();
  });

  test('resourcesList should return data', async () => {
    const data = [{ global_id: 'global', local_id: 'local', doi: 'string' }];
    axios.get.mockImplementation(() => Promise.resolve({ data: data }));

    await controllers.resourcesList({}, response, null);

    expect(response.body).toStrictEqual(data);
  });
  test('getResourceById should return data', async () => {
    const data = { global_id: 'global', local_id: 'local', doi: 'string' };
    axios.get.mockImplementation(() => Promise.resolve({ data: data }));

    await controllers.getResourceById({ params: { id: 'aaaa' } }, response, null);

    expect(response.body).toStrictEqual(data);
  });
});
