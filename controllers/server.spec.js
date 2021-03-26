const {expect} = require('@jest/globals');
const axios = require('axios');
const controllers = require('./controllers');
const {Response} = require('jest-express/lib/response');


jest.mock('axios');
/* jest.mock('express', () => {
  return require('jest-express');
}); */
let response;

describe('Endpoint', () => {
  beforeEach(() => {
    response = new Response();
  });

  afterEach(() => {
    response.resetMocked();
  });

  test('GET api/v1/resources', async () => {
    const data = [{'global_id': 'global',
      'local_id': 'local',
      'doi': 'string'}];
    // axios.get.mockResolvedValue({data:data});
    axios.get.mockImplementation(() => Promise.resolve({data: data}));

    // let response = { status: jest.fn().mockReturnThis(), send: jest.fn() , json: jest.fn() };;

    await controllers.resourcesList({}, response, null);

    expect(response.body).toStrictEqual({body: data});
  });
});


/* axios.get.mockImplementation(() => Promise.resolve({data:[{"global_id": "global",
    "local_id": "local",
    "doi": "string"}]})); */
/* test("GET api/v1/resources", async () => {

  axios.get.mockResolvedValue({data:[{"global_id": "global",
  "local_id": "local",
  "doi": "string"}]});

  await supertest(app).get("api/v1/resources")
    .expect(200)
    .then((response) => {
      // Check type and length
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toEqual(1);

      // Check data
      expect(response.body[0].global_id).toBe("global");
      expect(response.body[0].local_id).toBe("local");
    });
}); */
