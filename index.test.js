jest.mock('got');
const got = require('got');
const ComlinkStub = require('./index');

const accessKey = 'my-access-key';
const secretKey = 'my-secret-key';
const currentTime = 1660422866714;

let clientStub;
const defaultOptions = {
  url: 'http://localhost:3000',
  accessKey: '',
  secretKey: '',
  compression: true
};
const successResponse = 'Success!';

const postMethodArray = [
  [{
    method: 'getGameData',
    path: '/data',
    parameters: ['versionString', 'false', 2]
  }], [{
    method: 'getLocalizationBundle',
    path: '/localization',
    parameters: ['idString'],
  }], [{
    method: 'getLocalizationBundle',
    path: '/localization',
    parameters: ['idString', true],
  }], [{
    method: 'getEvents',
    path: '/getEvents',
    parameters: []
  }], [{
    method: 'getGuild',
    path: '/guild',
    parameters: ['idString']
  }], [{
    method: 'getGuild',
    path: '/guild',
    parameters: ['idString', true]
  }], [{
    method: 'getGuildsByName',
    path: '/getGuilds',
    parameters: ['name', 1, 5]
  }], [{
    method: 'getGuildsByCriteria',
    path: '/getGuilds',
    parameters: [{ "foo": "bar" }, 1, 5]
  }], [{
    method: 'getMetaData',
    path: '/metadata',
    parameters: []
  }], [{
    method: 'getPlayer',
    path: '/player',
    parameters: ['123456789']
  }], [{
    method: 'getPlayer',
    path: '/player',
    parameters: [null, 'aPlayerId']
  }], [{
    method: 'getPlayerArenaProfile',
    path: '/playerArena',
    parameters: ['123456789']
  }], [{
    method: 'getPlayerArenaProfile',
    path: '/playerArena',
    parameters: [null, 'aPlayerId', true]
  }], [{
    method: 'getGuildLeaderboard',
    path: '/getGuildLeaderboard',
    parameters: [3, null, 0, 10, false]
  }]
];

const getMethodArray = [
  [{
    method: 'getEnums',
    path: '/enums'
  }]
];

describe('swgoh-stats binding', () => {
  beforeEach(() => {
    got.mockImplementation(() => {
      return Promise.resolve(successResponse);
    });

    clientStub = new ComlinkStub({
      statsUrl: 'abc://xyz:42'
    });
  });

  test("it should call the stats API", async () => {
    const response = await clientStub.getUnitStats([{foo:'bar'}]);

    expect(got.mock.calls.length).toBe(1);
    expect(got.mock.calls[0]).toMatchSnapshot();
    expect(response).toEqual(successResponse);
  });

  test("it should handle flags", async () => {
    await clientStub.getUnitStats([{foo:'bar'}], ['calcGP', 'gameStyle']);

    expect(got.mock.calls.length).toBe(1);
    expect(got.mock.calls[0]).toMatchSnapshot();
  });

  test("it should handle languages", async () => {
    await clientStub.getUnitStats([{foo:'bar'}], [], 'eng_us');

    expect(got.mock.calls.length).toBe(1);
    expect(got.mock.calls[0]).toMatchSnapshot();
  });

  test("it should handle flags and languages", async () => {
    await clientStub.getUnitStats([{foo:'bar'}], ['onlyGP'], 'eng_us');

    expect(got.mock.calls.length).toBe(1);
    expect(got.mock.calls[0]).toMatchSnapshot();
  });

  test("it should bubble up errors", async () => {
    const someError = new Error('D-:');
    got.mockImplementationOnce(() => {
      return Promise.reject(someError);
    });

    await clientStub.getUnitStats([{foo:'bar'}], ['onlyGP'], 'eng_us').catch((error) => {
      expect(error).toBe(someError);
    });

    expect.assertions(1);
  });
});

describe('ComlinkStub API bindings', () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, 'getTime').mockImplementation(() => {
      return currentTime;
    });

    got.mockImplementation(() => {
      return Promise.resolve(successResponse);
    });

    clientStub = new ComlinkStub({
      accessKey: accessKey,
      secretKey: secretKey
    });
  });

  test("it should accept initialization parameters", () => {
    const initOptions = {
      url: 'abc://xyz:42',
      accessKey: 'tHe-AcCeSs-KeY',
      secretKey: 'ThE-sEcReT-kEy',
      compression: false
    };
    clientStub = new ComlinkStub(initOptions);

    for (const [key, value] of Object.entries(initOptions)) {
      expect(clientStub[key]).toEqual(value);
    }
  });

  test("it should use default initialization parameters", () => {
    clientStub = new ComlinkStub();

    for (const [key, value] of Object.entries(defaultOptions)) {
      expect(clientStub[key]).toEqual(value);
    }
  });

  describe('it should disable asking for compressed responses if specified', () => {
    beforeEach(() => {
      clientStub = new ComlinkStub({compression: false});
    });

    test('it should disable compression for POST methods', async () => {
      await clientStub.getMetaData();

      expect(got.mock.calls.length).toBe(1);
      expect(got.mock.calls[0]).toMatchSnapshot();
    });

    test('it should disable compression for GET methods', async () => {
      await clientStub.getEnums();

      expect(got.mock.calls.length).toBe(1);
      expect(got.mock.calls[0]).toMatchSnapshot();
    });
  });

  describe.each(postMethodArray)('post stub method', (testOptions) => {
    test(`${testOptions.method} should create the payload, and send it`, async () => {
      const response = await clientStub[testOptions.method](...testOptions.parameters);

      expect(got.mock.calls.length).toBe(1);
      expect(got.mock.calls[0]).toMatchSnapshot();
      expect(got.mock.calls[0][0]).toEqual(`${clientStub.url}${testOptions.path}`);
      expect(response).toEqual(successResponse);
    });

    test(`${testOptions.method} should throw an error if there's an error`, async () => {
      const rpcError = new Error('D-:');
      got.mockImplementationOnce(() => {
        return Promise.reject(rpcError);
      });

      await clientStub[testOptions.method](...testOptions.parameters).catch((error) => {
        expect(error).toBe(rpcError);
      });

      expect.assertions(1);
    });
  });

  describe.each(getMethodArray)('get stub method', (testOptions) => {
    test(`${testOptions.method} should get the appropriate path`, async () => {
      const response = await clientStub[testOptions.method]();

      expect(got.mock.calls.length).toBe(1);
      expect(got.mock.calls[0]).toMatchSnapshot();
      expect(got.mock.calls[0][0]).toEqual(`${clientStub.url}${testOptions.path}`);
      expect(response).toEqual(successResponse);
    });

    test(`${testOptions.method} should throw an error if there's an error`, async () => {
      const rpcError = new Error('D-:');
      got.mockImplementationOnce(() => {
        return Promise.reject(rpcError);
      });

      await clientStub[testOptions.method]().catch((error) => {
        expect(error).toBe(rpcError);
      });

      expect.assertions(1);
    });
  });
});
