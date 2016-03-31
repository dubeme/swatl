var _tableService, _entityGenerator, _tableQuery,
    STATUS = ["new", "in progress", "done"],
    ALPAHA_NUM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    TABLE_NAME = "tasks",
    EMPTY_ID = "00000000-0000-0000-0000-000000000000",
    EMPTY_STRING = "";

var uuid = require('node-uuid');
var validator = require('validator');

function generateRandomWord(len) {
    var url = "";

    len = len || 6;

    for (var index = 0; index < len; index++) {
        url += ALPAHA_NUM[Math.round(Math.random() * (ALPAHA_NUM.length - 1))];
    }

    return url;
}

function generateHundredTasks(taskListID, _success) {
    var tasks = [],
        MAX = 100,
        success = function(res) {
            console.log(taskListID + " - Done");
            _success();
        },
        error = function(err) {
            console.log(taskListID + " - " + " - " + err);
            _success();
        };

    for (var index = 0; index < MAX; index++) {
        tasks.push({
            title: generateRandomWord(),
            status: STATUS[Math.round(Math.random() * (STATUS.length - 1))],
            note: generateRandomWord(Math.round(Math.random() * (200)))
        });
    }

    createTasks(taskListID, tasks, success, error);
}

function testGetTask(taskListID, id) {
    var success = function(res) {
        console.log(res);
    }, error = function(err) {
        console.error(err);
    };

    getTask(taskListID, id, success, error);
}

function createTaskRecord(taskListID, rowKey_TaskID, title, status, note) {
    return {
        PartitionKey: _entityGenerator.String(taskListID),
        RowKey: _entityGenerator.String(rowKey_TaskID),
        id: _entityGenerator.String(rowKey_TaskID),
        title: _entityGenerator.String(title),
        status: _entityGenerator.String(status),
        note: _entityGenerator.String(note)
    };
}

function cleanUpTask(taskFromTable) {
    return {
        id: taskFromTable.id._,
        title: taskFromTable.title._,
        status: taskFromTable.status._,
        note: taskFromTable.note._
    };
}

function stringify(str, trim) {
    if (str === null && typeof str === "undefined") {
        return EMPTY_STRING;
    }

    if (!trim) {
        return str.toString();
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    return str.toString().replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
}

function createTaskList(successCallback, errorCallback) {
    // Use time to minimize the possibility of collision 
    var taskListID = (new Date()).getTime().toString(36),
        task = createTaskRecord(taskListID, EMPTY_ID);

    var count = 0;
    var func = function(tl) {
        generateHundredTasks(tl, function() {
            if (count++ < 20) {
                func(tl);
            } else {
                successCallback(tl);
            }
        });
    };

    // Insert the dummy task for the new task list
    _tableService.insertEntity(TABLE_NAME, task, function(err, result, response) {
        if (!err) {
            // func(taskListID);
            successCallback(taskListID);
        } else {
            errorCallback(err);
        }
    });
}

function createTask(taskListID, title, status, note, successCallback, errorCallback) {

    try {
        var task, taskID, query;

        taskListID = stringify(taskListID);
        title = stringify(title);
        status = stringify(status);
        note = stringify(note);

        if (!taskListID.match(/^[a-zA-Z0-9]{8}$/)) {
            throw "Invalid task list id";
        }

        if (!title.match(/(\S){1,}/i)) {
            throw "Task title has to contain at least one non-whitespace character";
        }

        if (!status.match(/^(new|in progress|done)$/i)) {
            throw "Invalid task status";
        }

        // Query to check for the existence of the taskListID
        query = new _tableQuery().where('PartitionKey eq ?', taskListID);

        _tableService.queryEntities(TABLE_NAME, query, null, function(err, result, response) {

            // Error retrieving the tasks for the taskListID
            if (err) {
                errorCallback(err);
            } else {
                // No entries for the taskListID
                if (result.entries.length < 1) {
                    errorCallback("Unknown task list ID");
                } else {
                    taskID = uuid.v4();
                    task = createTaskRecord(taskListID, taskID, title, status, note);

                    _tableService.insertEntity(TABLE_NAME, task, function(err, result, response) {
                        if (!err) {
                            successCallback(taskID);
                        } else {
                            errorCallback(err);
                        }
                    });
                }
            }
        });
    } catch (ex) {
        errorCallback(ex);
    }
}

function createTasks(taskListID, tasks, successCallback, errorCallback) {
    try {
        var query, batch = new _tableBatch();

        if (!tasks || tasks.length > 100) {
            throw "Tasks must be between 0 and 100 items";
        }

        taskListID = stringify(taskListID);
        if (!taskListID.match(/^[a-zA-Z0-9]{8}$/)) {
            throw "Invalid task list id";
        }

        query = new _tableQuery().where('PartitionKey eq ?', taskListID);

        _tableService.queryEntities(TABLE_NAME, query, null, function(err, result, response) {

            // Error retrieving the tasks for the taskListID
            if (err) {
                errorCallback(err);
            } else {
                // No entries for the taskListID
                if (result.entries.length < 1) {
                    errorCallback("Unknown task list ID");
                } else {
                    try {

                        tasks.forEach(function(task) {
                            if (!stringify(task.title).match(/(\S){1,}/i)) {
                                throw "Task title has to contain at least one non-whitespace character";
                            }

                            if (!stringify(task.status).match(/^(new|in progress|done)$/i)) {
                                throw "Invalid task status";
                            }

                            batch.insertEntity(createTaskRecord(taskListID,
                                uuid.v4(),
                                stringify(task.title),
                                stringify(task.status),
                                stringify(task.note)));
                        });

                        _tableService.executeBatch(TABLE_NAME, batch, function(err, result, response) {
                            if (!err) {
                                successCallback(result);
                            } else {
                                errorCallback(err);
                            }
                        });
                    } catch (ex) {
                        errorCallback(ex);
                    }
                }
            }
        });
    } catch (ex) {
        errorCallback(ex);
    }
}

function getTask(taskListID, id, successCallback, errorCallback) {
    try {
        var query;

        taskListID = stringify(taskListID);
        id = stringify(id);

        if (!taskListID.match(/^[a-zA-Z0-9]{8}$/)) {
            throw "Invalid task list id";
        }

        if (!validator.isUUID(id)) {
            throw "Invalid task ID";
        }

        // Query for the task
        query = new _tableQuery().where('PartitionKey eq ? and id eq ?', taskListID, id);

        _tableService.queryEntities(TABLE_NAME, query, null, function(err, result, response) {

            // Error retrieving the task
            if (err) {
                errorCallback(err);
            } else {
                if (result.entries.length == 1)
                    successCallback(cleanUpTask(result.entries[0]));
                else
                    successCallback({});
            }
        });
    } catch (ex) {
        errorCallback(ex);
    }
}

function getTasks(taskListID, successCallback, errorCallback) {
    try {
        var query, querier;

        taskListID = stringify(taskListID);

        if (!taskListID.match(/^[a-zA-Z0-9]{8}$/)) {
            throw "Invalid task list id";
        }

        // Query for the tasks
        query = new _tableQuery().where('PartitionKey eq ? and RowKey ne ?', taskListID, EMPTY_ID);

        querier = function(tasks, continuationToken) {
            _tableService.queryEntities(TABLE_NAME, query, continuationToken, function(err, results, response) {

                // Error retrieving the task
                if (err) {
                    errorCallback(err);
                } else {
                    continuationToken = results.continuationToken;

                    // Concatinate new and old result
                    results.entries.forEach(function(task) {
                        tasks.push(cleanUpTask(task));
                    });

                    if (continuationToken) {
                        querier(tasks, continuationToken);
                    } else {
                        successCallback(tasks);
                    }
                }
            });
        };

        querier([], null);

    } catch (ex) {
        errorCallback(ex);
    }
}

function updateTask(taskListID, id, updatedTask, successCallback, errorCallback) {

    try {
        taskListID = stringify(taskListID);
        id = stringify(id);

        if (!taskListID.match(/^[a-zA-Z0-9]{8}$/)) {
            throw "Invalid task list id";
        }

        if (!validator.isUUID(id)) {
            throw "Invalid task ID";
        }

        if (updatedTask === null || typeof updatedTask === "undefined") {
            throw "Updated is invalid";
        }

        if (id !== updatedTask.id) {
            throw "Task ID mismatch";
        }

        if (!stringify(updatedTask.title).match(/(\S){1,}/i)) {
            throw "Task title has to contain at least one non-whitespace character";
        }

        if (!stringify(updatedTask.status).match(/^(new|in progress|done)$/i)) {
            throw "Invalid task status";
        }

        updatedTask = createTaskRecord(taskListID, id, updatedTask.title, updatedTask.status, updatedTask.note);
        _tableService.updateEntity(TABLE_NAME, updatedTask, function(err, result, response) {
            if (!err) {
                successCallback();
            } else {
                errorCallback(err);
            }
        });
    } catch (err) {
        errorCallback(err);
    }
}

function deleteTask(taskListID, id, successCallback, errorCallback) {
    try {
        taskListID = stringify(taskListID);
        id = stringify(id);

        if (!taskListID.match(/^[a-zA-Z0-9]{8}$/)) {
            throw "Invalid task list id";
        }

        if (!validator.isUUID(id)) {
            throw "Invalid task ID";
        }

        _tableService.deleteEntity(TABLE_NAME, createTaskRecord(taskListID, id), function(err, result, response) {
            if (!err) {
                successCallback();
            } else {
                errorCallback(err);
            }
        });
    } catch (err) {
        errorCallback(errerror);
    }
}

function init(tableService, entityGenerator, tableQuery, tableBatch) {
    _tableService = tableService;
    _entityGenerator = entityGenerator;
    _tableQuery = tableQuery;
    _tableBatch = tableBatch;
}

exports = module.exports = {
    createTask: createTask,
    getTask: getTask,
    getTasks: getTasks,
    updateTask: updateTask,
    deleteTask: deleteTask,
    createTaskList: createTaskList,
    init: init,
    tableName: TABLE_NAME
};




//*****************************************//
//          Look at these later
//*****************************************//

function createSession(params) {
    /*
    var id, code, session;

    // Use time to minimize the possibility of collision 
    id = (new Date()).getTime().toString(36);
    // code = generateRandomWord();
    session = {
        PartitionKey: _entityGenerator.String('session'),
        RowKey: _entityGenerator.String(id),
        code: _entityGenerator.String(code)
    };
    */
}