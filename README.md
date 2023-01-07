# @swgoh-utils/comlink

Usage example:
```js
const ComlinkStub = require('@swgoh-utils/comlink');
const client = new ComlinkStub({
  url: 'http://localhost:3200', // swgoh-comlink service URL
  accessKey: process.env.ACCESS_KEY,
  secretKey: process.env.SECRET_KEY,
  statsUrl: 'http://localhost:3223', // swgoh-stats service URL
  compression: process.env.COMPRESSION,
});

const init = async () => {
  const response = await client.getMetaData();
};
init();
```
# Parameters

- url: the base URL (protocol, URI, and port) where the swgoh-comlink service is hosted. Defaults to `http://localhost:3000`
- accessKey: The "public" portion of the shared key used in HMAC request signing. Defaults to '' which disables HMAC signing of requests.
- secretKey: The "private" portion of the key used in HMAC request signing. Defaults to '' which disables HMAC signing of requests
- compression: Indicates whether the client will accept compressed responses and decompress them. Defaults to true
- statsUrl: the url of the swgoh-stats service, such as `http://localhost:3223`