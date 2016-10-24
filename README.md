# ʕ•ᴥ•ʔ 
# peerio-icebear
Peerio Icebear is a client library supporting Peerio apps

## Development configuration

To get started, set the `PEERIO_STAGING_SOCKET_SERVER` environment variable. Run `npm install` and `npm start` to run Karma. 

## Development policy
### Errors

#### Always use `Error` object when:   
throwing an exception

```
throw new Error()
```
rejecting a Promise
```
reject(new Error())
```
or returning an error value
```
return new Error()
```

#### Use `instanceof` to detect error type
```
catch(ex){
  if(ex instanceof MyCustomError){
   // do smth.
  }
}
```

#### Create custom errors and wrap any other caught ones
Create custom errors only when you need to handle this error type specifically.
Otherwise just use `new Error('message')` 
```
function CustomError(message, nestedError, otherData) {
  var error = Error.call(this, message);
  this.name = 'CustomError';
  this.message = error.message;
  this.stack = error.stack;
  this.nestedError = nestedError;
  this.otherData = otherData;
}

CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.constructor = CustomError;

```
