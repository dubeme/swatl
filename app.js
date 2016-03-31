var express = require('express');
var azure = require('azure-storage');
var validator = require('validator');
var bodyParser = require('body-parser');
var tasks = require('./tasks');

var appName = "Simple To-Do List app";
var app = express();
var azureTableService = azure.createTableService("UseDevelopmentStorage=true");

var taskListIDChecker = function(req, res, next) {
    var taskListID = req.params.taskListID;

    if (!taskListID || !taskListID.match(/^[a-zA-Z0-9]{8}$/)) {
        console.error('Invalid task list - ' + taskListID);
        res.status(500).send('Invalid task list - ' + taskListID);
    } else {
        next();
    }
};

var taskIDChecker = function(req, res, next) {
    var taskID = req.params.taskID;

    if (!taskID || !validator.isUUID(taskID)) {
        console.error('Invalid task id - ' + taskID);
        res.status(500).send('Invalid task ID - ' + taskID);
    } else {
        next();
    }
};

if (process.env.NODE_ENV !== 'production') {
    require('longjohn');
}

app.use(bodyParser.json());

azureTableService.createTableIfNotExists(tasks.tableName, function(error, result, response) {
    if (!error) {
        tasks.init(azureTableService,
            azure.TableUtilities.entityGenerator,
            azure.TableQuery,
            azure.TableBatch);

        // Create a new task list   
        app.get('/', function(req, res) {
            tasks.createTaskList(function(taskListID) {
                // Nice to have, for security. Can only edit/view task if valid code
                // res.cookie("code", taskListSessionCode);
                res.redirect(301, '/' + taskListID);
            }, function(err) {
                res.status(500).send(err);
            });
        });

        // Create new task
        app.post('/create/:taskListID', taskListIDChecker, function(req, res) {

            tasks.createTask(req.params.taskListID,
                req.body.title,
                req.body.status,
                req.body.note,
                function(taskID) {
                    res.send(taskID);
                }, function(errMsg) {
                    res.status(500).send(errMsg);
                });
        });

        // Get a task
        app.get('/task/:taskListID/:taskID',
            taskListIDChecker,
            taskIDChecker,
            function(req, res) {
                tasks.getTask(req.params.taskListID, req.params.taskID, function(task) {
                    res.json(task);
                }, function(errMsg) {
                    res.status(500).send(errMsg);
                });
            }
        );

        // Get all tasks
        app.get('/tasks/:taskListID', taskListIDChecker, function(req, res) {
            tasks.getTasks(req.params.taskListID, function(tasks) {
                res.json(tasks);
            }, function(errMsg) {
                res.status(500).send(errMsg);
            });
        });

        // Update a task
        app.post('/update/:taskListID/:taskID',
            taskListIDChecker,
            taskIDChecker,
            function(req, res) {
                tasks.updateTask(req.params.taskListID,
                    req.params.taskID,
                    req.body,
                    function() {
                        res.send();
                    }, function(errMsg) {
                        res.status(500).send(errMsg);
                    }
                );
            }
        );

        // Delete a task
        app.post('/delete/:taskListID/:taskID',
            taskListIDChecker,
            taskIDChecker,
            function(req, res) {
                tasks.deleteTask(req.params.taskListID,
                    req.params.taskID,
                    function() {
                        res.send();
                    }, function(errMsg) {
                        res.status(500).send(errMsg);
                    }
                );
            }
        );

        // Visiting an existing task list
        app.get('/:taskListID', taskListIDChecker, function(req, res) {
            res.sendFile(__dirname + "/public/index.html");
        });

        app.use(express.static('public'));
    } else {
        app.get('/', function(req, res) {
            res.send('<h1><i>' + appName + '</i> not available at the moment, please try again later.</h1>');
        });
    }
});

app.listen(3000, function() {
    console.log(appName + ' listening on port 3000!');
});