var amsEmulator = require('./amsemulator.js');
//Use the configuration settings from the 'configuration' tab in your mobile 
//service
var configuration = {
  "Key1":"Value1",
  "Key2":"Value2",
  "Key3":"Value 3"
}

//First parameter is the root of your mobile service
//configuration is the object containng all key value pairs
//and the last parameter is the scheduled task object which a key value object
//with the keys being the name of the task and the value being how long to
//wait between invokations. (in seconds).
var emulator = new amsEmulator.AMSEmulator('.', configuration, null);

emulator.initializeService(function (err) {
    if (!err) {
        console.log('hello');
        console.log('Initailized!');

    }

    emulator.startService(function (err) {
      if(!err){
          console.log('Service started!');
      }
    });
});

