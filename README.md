azure-mobile-emulator
=====================

This is a library that runs your Azure Mobile Service locally on your computer for debugging purposes. Because azure mobile is based on express, this library uses Express to simulate the apis you would have in your mobile service.

#Running your mobile service

Use source control on your mobile service and clone the git repo provided by Azure. Add packages required by amsemulator in the package.json to your Azure Mobile package.json.

Copy and past amsemulator to the root of your service directory in the mobile service git repo.

Do npm install at the root of the directory.

See the comments in amsemulator.js and the example in exampleMobileSerivceStart.ns.

#Known issues:

Server-directed Oauth is not implemented. Use a provider-specific access token and the library will return a dummy value.

No unit tests available

Tables are not implemented

Scheduled tasks are ran in child node processes and should be ran in in a Sandbox.