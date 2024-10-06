import got from 'got';
import crypto from 'crypto';

// Possible HTTP methods
type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD'
  | 'CONNECT'
  | 'TRACE';

// Comlink options
type ComlinkOptions = {
  url?: string;
  statsUrl?: string;
  accessKey?: string;
  secretKey?: string;
  log?: Console;
  compression?: boolean;
};

// Custom error
type ComlinkError = {
  response?: {
    body?: {
      message?: string;
      code?: string;
    };
  };
  gotMessage?: string;
  message?: string;
  code?: string;
  gotCode?: string;
};

// headers are modified in place
function signPostRequest(
  accessKey: string,
  secretKey: string,
  method: HttpMethod,
  uri: string,
  headers: Record<string, string>,
  body: Record<string, unknown> = {}
) {
  // no need to sign if access key and secret key are not present
  if (accessKey && secretKey) {
    const hmac = crypto.createHmac('sha256', secretKey);
    const reqTime = `${new Date().getTime()}`;
    headers['X-Date'] = reqTime;

    hmac.update(reqTime); // request time
    hmac.update(method); // verb e.g POST
    hmac.update(uri); // url e.g /metadata

    const hash = crypto.createHash('md5');
    hash.update(body ? JSON.stringify(body) : '');
    hmac.update(hash.digest('hex'));

    headers[
      'Authorization'
    ] = `HMAC-SHA256 Credential=${accessKey},Signature=${hmac.digest('hex')}`;
  }
}

class ComlinkStub {
  url: string;
  statsUrl: string;
  accessKey: string;
  secretKey: string;
  logger: Console;
  compression: boolean;

  constructor(options: ComlinkOptions = {}) {
    this.url = options.url || 'http://localhost:3000';
    this.statsUrl = options.statsUrl || 'http://localhost:3223';
    this.accessKey = options.accessKey || '';
    this.secretKey = options.secretKey || '';

    // use provided logger if specified
    this.logger = options.log || console;
    this.compression = options.compression ?? true;
  }

  _modifyErrorResponse(error: ComlinkError) {
    if (
      error &&
      error.response &&
      error.response.body &&
      typeof error.response.body === 'object'
    ) {
      if (error.response.body.message) {
        error.gotMessage = error.message;
        error.message = error.response.body.message;
      }

      if (error.response.body.code) {
        error.gotCode = error.code;
        error.code = error.response.body.code;
      }
    }
  }

  async getUnitStats(
    requestPayload: Record<string, unknown>[],
    flags: string[] = [],
    lang?: string
  ) {
    let params = flags && flags.length > 0 ? `?flags=${flags.join(',')}` : '';

    if (lang) {
      const langStr = `language=${lang}`;
      params = params ? `${params}&${langStr}` : `?${langStr}`;
    }

    return await got(`${this.statsUrl}/api${params}`, {
      method: 'POST',
      json: requestPayload,
      decompress: this.compression,
      responseType: 'json',
      resolveBodyOnly: true,
    }).catch((error) => {
      throw error;
    });
  }

  async _postRequestPromiseAPI(uri: string, payload?: Record<string, unknown>) {
    const headers = {};
    const method = 'POST';

    signPostRequest(
      this.accessKey,
      this.secretKey,
      method,
      uri,
      headers,
      payload
    );

    try {
      return await got(`${this.url}${uri}`, {
        method: method,
        headers: headers,
        json: payload,
        decompress: this.compression,
        responseType: 'json',
        resolveBodyOnly: true,
      });
    } catch (error) {
      this._modifyErrorResponse(error as ComlinkError);
      throw error;
    }
  }

  async _getRequestPromiseAPI(uri: string, json = true) {
    try {
      return await got(`${this.url}${uri}`, {
        method: 'GET',
        decompress: this.compression,
        responseType: 'json',
        resolveBodyOnly: true,
      });
    } catch (error) {
      this._modifyErrorResponse(error as ComlinkError);
      throw error;
    }
  }

  async getEnums() {
    return await this._getRequestPromiseAPI(`/enums`);
  }

  async getEvents() {
    return await this._postRequestPromiseAPI(`/getEvents`);
  }

  // segment 0 = all, segment 1 .. n include data split into self contained buckets
  // ie: data for a single collection doesn't span segments
  async getGameData(
    version: string,
    includePveUnits = true,
    requestSegment = 0
  ) {
    return await this._postRequestPromiseAPI(`/data`, {
      payload: {
        version: version,
        includePveUnits: includePveUnits,
        requestSegment: requestSegment,
      },
    }).catch((error) => {
      throw error;
    });
  }

  async getLocalizationBundle(id: string, unzip = false) {
    return await this._postRequestPromiseAPI(`/localization`, {
      unzip: unzip ? true : false,
      payload: {
        id,
      },
    });
  }

  async getMetaData() {
    return await this._postRequestPromiseAPI(`/metadata`);
  }

  async getPlayer(allyCode?: string, playerId?: string) {
    const requestObject = {
      payload: {
        allyCode: allyCode ?? undefined,
        playerId: !allyCode ? playerId : undefined,
      },
    };

    return await this._postRequestPromiseAPI(`/player`, requestObject);
  }

  async getGuild(guildId: string, includeRecentGuildActivityInfo = false) {
    const requestObject = {
      payload: {
        guildId,
        includeRecentGuildActivityInfo,
      },
    };

    return await this._postRequestPromiseAPI(`/guild`, requestObject);
  }

  async getGuildsByName(name: string, startIndex = 0, count = 10) {
    const requestObject = {
      payload: {
        filterType: 4,
        name,
        startIndex,
        count,
      },
    };

    return await this._postRequestPromiseAPI(`/getGuilds`, requestObject);
  }

  async getGuildsByCriteria(searchCriteria = {}, startIndex = 0, count = 10) {
    const requestObject = {
      payload: {
        filterType: 5,
        searchCriteria,
        startIndex,
        count,
      },
    };

    return await this._postRequestPromiseAPI(`/getGuilds`, requestObject);
  }

  async getPlayerArenaProfile(
    allyCode?: string,
    playerId?: string,
    playerDetailsOnly = false
  ) {
    const requestObject = {
      payload: {
        playerDetailsOnly,
        allyCode: allyCode ?? undefined,
        playerId: !allyCode ? playerId : undefined,
      },
    };

    return await this._postRequestPromiseAPI(`/playerArena`, requestObject);
  }
};

module.exports = ComlinkStub;