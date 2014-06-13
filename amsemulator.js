
/**
 * Module dependencies.
 */
    (function () {
	statusCodes = {OK: 200};
        var nconf = require('nconf');
        var express = require('express');
		var morgan = require('morgan');
        
        var login = require('./login.js');
        var http = require('http');
        var path = require('path');
		var bodyParser = require('body-parser');
		var methodOverride = require('method-override');
        var app = express();
        var fs = require('fs');
        var timers = require('timers');
        var spawn = require('child_process').spawn;
        
        /**
            rootDirPath - root of your mobile service (starting at 'service' folder)
            scheduledJobFrequencies -
            {   job1:60000,
                job2:20000
            }
            job names must match the schedule jobs you have in your azure mobile service
        **/
        module.exports.AMSEmulator = function AMSEmulator(rootDirPath, configuration) {
            return new AMSEmulator(rootPath, configuration, null);

        }
        module.exports.AMSEmulator = function AMSEmulator(rootDirPath, configuration, scheduledJobFrequencies) {
            this.rootPath = rootDirPath;

            for(var key in configuration){
                process.env[key] = configuration[key];

            }

            this.apiModules = new Array();
            if(scheduledJobFrequencies){
                this.jobFrequencies = scheduledJobFrequencies;
            }
            else{
                this.jobFrequencies = {};
            }
            app.set('port', process.env.PORT || 3000);
            app.use(morgan());
            app.use(bodyParser());
            app.use(methodOverride());
            app.use(express.static(path.join(__dirname, 'public')));

        }

        module.exports.AMSEmulator.prototype.initializeService = function (callback) {
            var path = this.rootPath;
            fs.readdir(this.rootPath + '/api', function (err, result) {
                
                if (err) {
                    throw err;
                }

                for (var i in result) {
                    if (endsWith(result[i],'.js')) {
                        var mod = require(path + '/api/' + result[i], '.js');
                        
                        //inspect the object for the standard http methods
                        if (mod.get) {
                            app.get('/api/' + result[i].replace('.js',''), mod.get);
                        }
                        if (mod.post) {
                            app.post('/api/' + result[i].replace('.js', ''), mod.post);
                        }
                        if (mod.delete) {
                            app.delete('/api/' + result[i].replace('.js', ''), mod.delete);
                        }
                        if (mod.patch) {
                            app.patch('/api/' + result[i].replace('.js', ''), mod.patch);
                        }
                    }
                    
                }

                //add the default dummy authenticate api
                app.post('/login/facebook', login.facebook);
                app.post('/login/google', login.google);
                app.post('/login/microsoftaccount', login.microsoftaccount);
                callback(null);
            });
        }

        module.exports.AMSEmulator.prototype.startService = function (callback) {
            //do the startup script
            var root = this.rootPath;
            var startServer = function(callback){
                http.createServer(app).listen(app.get('port'), function () {
                    console.log('Mobile Service sstarted on port: ' + app.get('port'));
                    callback(null);
                });
            }

            //look for startup script
            fs.exists(root + '/extensions/startup.js', function (exists) {
                if (exists) {

                    //execute startup script
                    var startupMod = require(root + '/extensions/startup.js');

                    if (startupMod.startup) {
                        startupMod.startup(app, function () {
                            startServer(function (err) {
                                callback(err);
                            });
                        });
                    }
                }
                else {
                    startServer(function (err) {
                        callback(err);
                    });
                }
            });
            
            //start scheduled jobs
            //we don't call back here
            var schedulerFunctions = new Array();
            scheduledJobFrequencies = this.jobFrequencies;
            fs.readdir(root + '/scheduler', function (err, result) {

                if (err) {
                    throw err;
                }

                for (var i in result) {
                    if (endsWith(result[i], '.js') && !endsWith(result[i], '_.js')) {


                        //add the js file for the job
                        schedulerFunctions.push({jobName: result[i].replace('.js',''), fileName: root + '/scheduler/' + result[i]});

                    }
                }
                //do a scheduled loop at specfieid freq
                //this is really hack. AMS doesn't use require or globals to find your function.
                //to be honest I don't know how they are doing it - this is my best guess :-)
                for (var z in schedulerFunctions) {
                    //check if a time is listed
                    if (scheduledJobFrequencies[schedulerFunctions[z].jobName]) {
                        fs.readFile(schedulerFunctions[z].fileName, {encoding:'UTF-8'}, function (err, data) {
                                if (err) {
                                    throw err;
                                }
                                //add call to job function
                                data = data + ' ' + schedulerFunctions[z].jobName + '();';
                                fs.writeFile(schedulerFunctions[z].fileName.replace('.js','_.js'), data, function(err){
                                    if(err){
                                        throw err;
                                    }

                                    //now actually schedule the job to ran at the specified freq
                                    timers.setInterval(function () {
                                        var proc = spawn('node', [schedulerFunctions[z].fileName.replace('.js', '_.js')], {stdio: 'inherit', stderr: 'inherit'});

                                    }, scheduledJobFrequencies[schedulerFunctions[z].jobName] * 1000);
                                    
                                });

                                
                            });
                        
                    }
                    else {
                        console.log('scheduled task ' + schedulerFunctions[z] + ' does not have a specified frequency. When creating the AMSEmulator object, call the constructor with the appropiate job frequency settings');
                    }
                
                }
            });
        };

        
        function endsWith(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }
       
})();