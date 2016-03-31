(function(window, $, ajaxHelper) {
    'use strict';

    var cachedTasks = {},
        taskListID = location.pathname.substring(1),
        taskPrototype = {
            id: "",
            title: "",
            status: ['new', 'inprogress', 'done'],
            note: []
        };

    window.todo = window.todo || {};

    function createTaskObject(id, title, status, note) {
        return {
            id: id,
            title: title,
            status: status,
            note: note
        };
    }

    function isDefinedAndNotNull(val) {
        return typeof val !== 'undefined' && val !== null;
    }

    function isNullOrWhitespace(str) {
        if (typeof str === 'undefined' || str === null)
            return true;
        return str.replace(/\s/g, '').length < 1;
    }

    function throwException(message) {
        throw new Error(message);
    }

    /*------------------------------------------*/
    //             CRUD SECTION                 //
    /*------------------------------------------*/
    function createTask(title, successCallback, errorCallback) {
        if (isNullOrWhitespace(title)) {
            throwException("Must specify a task title");
        }

        ajaxHelper.createTask(taskListID, title, "New", "", function(id) {
            cachedTasks[id] = createTaskObject(id, title, "New", "");
            successCallback(id);
        }, errorCallback);
    }

    function getTask(id) {
        if (cachedTasks.hasOwnProperty(id)) {
            return cachedTasks[id];
        }

        return null;
    }

    function getAllTasks(successCallback, errorCallback) {
        ajaxHelper.getTasks(taskListID, function(tasks) {
            var _tasks = [];
            cachedTasks = {};

            $.each(tasks, function(index, task) {
                cachedTasks[task.id] = task;
                _tasks.push(task);
            });

            successCallback(_tasks);
        }, errorCallback);
    }

    function updateTask(id, title, status, note, successCallback, errorCallback) {
        var modifiedTask = createTaskObject(id, title, status, note);
        
        if (cachedTasks.hasOwnProperty(id)) {
            ajaxHelper.updateTask(
                taskListID,
                id,
                modifiedTask,
                function() {
                    cachedTasks[id] = modifiedTask;
                    successCallback();
                }, errorCallback);
        } else {
            errorCallback("Task not found id = " + id);
        }
    }

    function deleteTask(id, successCallback, errorCallback) {
        if (cachedTasks.hasOwnProperty(id)) {
            ajaxHelper.deleteTask(
                taskListID,
                id,
                function() {
                    delete cachedTasks[id];
                    successCallback();
                }, errorCallback);
        } else {
            errorCallback("Task not found id = " + id);
        }
    }

    window.todo.tasks = {
        createTask: createTask,
        getTask: getTask,
        getAllTasks: getAllTasks,
        updateTask: updateTask,
        deleteTask: deleteTask
    };

})(window, $, window.todo.ajaxHelper);