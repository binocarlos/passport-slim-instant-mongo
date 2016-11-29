# passport-slim-instant-mongo

A connector for [passport-slim](http://github.com/binocarlos/passport-slim) that saves user state in [instant-mongo-rest](http://github.com/binocarlos/instant-mongo-rest)

## install

```bash
$ docker pull binocarlos/passport-slim-instant-mongo
```

## CLI options

When running in standalone mode from the command line:

 * --port - PORT - the port to listen on (default = 80)
 * --mountpoint - MOUNTPOINT - the path to mount the router on (default = '/userstorage/v1')
 * --storagehost - STORAGE_SERVICE_HOST - the hostname of the storage service
 * --storageport - STORAGE_SERVICE_PORT - the port of the storage service (default = 80)
 * --storagepath - STORAGE_SERVICE_PATH - the path of the storage service api (default = '/api/v1')


## license

MIT