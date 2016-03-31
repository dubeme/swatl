(function(window, $) {
    'use strict';

    var index = 0;
    window.todo = window.todo || {};

    function performPOST(url, data, successCallback, errorCallback) {
        data = data || {};
        
        $.ajax({
            method: "POST",
            contentType: "application/json",
            url: url,
            data: JSON.stringify(data),
            error: function(err) {
                errorCallback(err.responseText);
            },
            success: successCallback
        });
    }

    function createTask(taskListID, title, status, note, success, error) {
        // '/create/:taskListID'
        performPOST(
            "/create/" + taskListID,
            {
                title: title,
                status: status,
                note: note
            },
            success,
            error
        );
    }

    function getTask(taskListID, taskID, successCallback, errorCallback) {
        // '/task/:taskListID/:taskID'
        $.get("/task/" + taskListID + "/" + taskID)
            .done(successCallback)
            .fail(function(err) {
                errorCallback(err.responseText);
            });
    }

    function getTasks(taskListID, successCallback, errorCallback) {
        // '/tasks/:taskListID'
        $.get("/tasks/" + taskListID)
            .done(successCallback)
            .fail(function(err) {
                errorCallback(err.responseText);
            });
    }

    function updateTask(taskListID, id, modifiedTask, success, error) {
        // '/update/:taskListID/:taskID'
        performPOST(
            "/update/" + taskListID + "/" + id,
            modifiedTask,
            success,
            error
        );
    }

    function deleteTask(taskListID, id, success, error) {
        // '/delete/:taskListID/:taskID'
        performPOST(
            "/delete/" + taskListID + "/" + id,
            null,
            success,
            error
        );
    }

    window.todo.ajaxHelper = {
        createTask: createTask,
        getTask: getTask,
        getTasks: getTasks,
        updateTask: updateTask,
        deleteTask: deleteTask
    };
})(window, window.$);