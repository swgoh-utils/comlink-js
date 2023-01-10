const got = require('got');
const crypto = require('crypto');

// headers are modified in place
function signPostRequest(accessKey, secretKey, method, uri, headers, body = {}) {
  // no need to sign if access key and secret key are not present
  if (accessKey && secretKey) {
    const hmac = crypto.createHmac('sha256', secretKey);
    const reqTime = `${new Date().getTime()}`;
    headers['X-Date'] = reqTime;

    hmac.update(reqTime); // request time
    hmac.update(method); // verb e.g POST
    hmac.update(uri); // url e.g /metadata

    const hash = crypto.createHash('md5');
    hash.update(body ? JSON.stringify(body) : "");
    hmac.update(hash.digest('hex'));

    headers['Authorization'] = `HMAC-SHA256 Credential=${accessKey},Signature=${hmac.digest('hex')}`;
  }
}

module.exports = class ComlinkStub {
  constructor(options = {}) {
    this.url = options.url || 'http://localhost:3000';
    this.statsUrl = options.statsUrl || 'http://localhost:3223';
    this.accessKey = options.accessKey || '';
    this.secretKey = options.secretKey || '';

    // use provided logger if specified
    this.logger = options.log || console;
    this.compression = (options.hasOwnProperty('compression')) ? options.compression : true;
  }

  _modifyErrorResponse(error) {
    if (error && error.response && error.response.body) {
      if (error.response.body.message)  {
        error.gotMessage = error.message;
        error.message = error.response.body.message;
      }

      if (error.response.body.code)  {
        error.gotCode = error.code;
        error.code = error.response.body.code;
      }
    }
  }

  async getUnitStats(requestPayload, flags = [], lang) {
    let params = (flags && flags.length > 0) ? `?flags=${flags.join(',')}` : '';

    if (lang) {
      const langStr = `language=${lang}`;
      params = (params) ? `${params}&${langStr}` : `?${langStr}`;
    }

    return await got(`${this.statsUrl}/api${params}`, {
      method: 'POST',
      json: requestPayload,
      decompress: this.compression,
      responseType: 'json',
      resolveBodyOnly: true
    }).catch((error) => {
      throw error;
    });
  }

  async _postRequestPromiseAPI(uri, payload) {
    const headers = {};
    const method = 'POST';

    signPostRequest(this.accessKey, this.secretKey, method, uri, headers, payload);

    return await got(`${this.url}${uri}`, {
      method: method,
      headers: headers,
      json: payload,
      decompress: this.compression,
      responseType: 'json',
      resolveBodyOnly: true
    }).catch((error) => {
      this._modifyErrorResponse(error);
      throw (error);
    });
  }

  async _getRequestPromiseAPI(uri, json = true) {
    return await got(`${this.url}${uri}`, {
      method: 'GET',
      decompress: this.compression,
      responseType: 'json',
      resolveBodyOnly: true
    }).catch((error) => {
      this._modifyErrorResponse(error);
      throw (error);
    });
  }

  async getEnums() {
    return await this._getRequestPromiseAPI(`/enums`).catch((error) => {
      throw (error);
    });
  }

  // segment 0 = all, segment 1 .. n include data split into self contained buckets
  // ie: data for a single collection doesn't span segments
  async getGameData(version, includePveUnits = true, requestSegment = 0) {
    return await this._postRequestPromiseAPI(`/data`, {
      "payload": {
        "version": version,
        "includePveUnits": includePveUnits,
        "requestSegment": requestSegment
      }
    }).catch((error) => {
      throw (error);
    });
  };

  async getLocalizationBundle(id, unzip = false) {
    return await this._postRequestPromiseAPI(`/localization`, {
      "unzip": unzip ? true : false,
      "payload": {
        "id": id
      }
    }).catch((error) => {
      throw (error);
    });
  };

  async getMetaData() {
    return await this._postRequestPromiseAPI(`/metadata`).catch((error) => {
      throw (error);
    });
  };

  async getPlayer(allyCode, playerId) {
    const requestObject = {
      "payload": {}
    };
    if (allyCode) {
      requestObject.payload.allyCode = allyCode;
    } else {
      requestObject.payload.playerId = playerId;
    }
    return await this._postRequestPromiseAPI(`/player`, requestObject).catch((error) => {
      throw (error);
    });
  };

  async getGuild(guildId) {
    const requestObject = {
      "payload": {
        guildId
      }
    };

    return await this._postRequestPromiseAPI(`/guild`, requestObject).catch((error) => {
      throw (error);
    });
  };

  async getGuildsByName(name, startIndex = 0, count = 10) {
    const requestObject = {
      "payload": {
        filterType: 4,
        name,
        startIndex,
        count
      }
    };

    return await this._postRequestPromiseAPI(`/getGuilds`, requestObject).catch((error) => {
      throw (error);
    });
  };

  async getGuildsByCriteria(searchCriteria = {}, startIndex = 0, count = 10) {
    const requestObject = {
      "payload": {
        filterType: 5,
        searchCriteria,
        startIndex,
        count
      }
    };

    return await this._postRequestPromiseAPI(`/getGuilds`, requestObject).catch((error) => {
      throw (error);
    });
  };

  async getPlayerArenaProfile(allyCode, playerId, playerDetailsOnly = false) {
    const requestObject = {
      "payload": {
        playerDetailsOnly
      }
    };
    if (allyCode) {
      requestObject.payload.allyCode = allyCode;
    } else {
      requestObject.payload.playerId = playerId;
    }
    return await this._postRequestPromiseAPI(`/playerArena`, requestObject).catch((error) => {
      throw (error);
    });
  };
};