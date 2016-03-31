(function(window, $, tasks) {
    'use strict';

    var activeTask = {};

    function loadTaks() {
        var action = "Load all tasks";

        tasks.getAllTasks(function(tasks) {
            $.each(tasks, function(index, task) {
                generateTaskHTML(task.title, task.id, action);
            });
        }, function(errMsg) {
            displayErrorDialog(action, errMsg);
        });
    }

    function createNewTask(taskTitle_Name) {
        var action = 'creating new task';

        tasks.createTask(taskTitle_Name, function(id) {
            generateTaskHTML(taskTitle_Name, id, action);
        }, function(err) {
            displayErrorDialog(action, err);
        });
    }

    function generateTaskHTML(taskTitle_Name, id, action) {
        var taskHTML;

        try {
            taskHTML = $('<a>').addClass("list-group-item task").text(taskTitle_Name);
            taskHTML.attr("id", id);
            taskHTML.data("id", id);
            taskHTML.click(taskClicked);

            $("#allTasksSection").prepend(taskHTML);
            $("#tbxTask").val("");
        } catch (ex) {
            displayErrorDialog(action, ex);
        }
    }

    function displayErrorDialog(action, reason) {
        var errorAlert = '';

        errorAlert += '<div class="alert alert-danger alert-dismissible wraptext" role="alert">';
        errorAlert += '<button type="button" class="close" data-dismiss="alert" aria-label="Close">';
        errorAlert += '<span aria-hidden="true">&times;</span>';
        errorAlert += '</button>';
        errorAlert += '<strong>Error ' + action + '</strong> - ' + reason + '.';
        errorAlert += '</div>';

        $("#alertSection").html(errorAlert);
    }

    function taskClicked() {
        var status;

        activeTask = tasks.getTask($(this).data("id"));
        status = (activeTask.status || "").toString().toLowerCase();

        $('#modalTaskTitle').val(activeTask.title);
        $('#modalTaskNote').val(activeTask.note);

        $('#modalTaskNew').removeProp('checked');
        $('#modalTaskInProgress').removeProp('checked');
        $('#modalTaskDone').removeProp('checked');

        switch (status) {
            case "in progress":
                $('#modalTaskInProgress').prop('checked', true); break;

            case "done":
                $('#modalTaskDone').prop('checked', true); break;

            default: $('#modalTaskNew').prop('checked', true);
        }

        $('#myModal').modal('show');
    }

    $(function() {

        // Load old tasks
        loadTaks();

        $("#createTaskForm").submit(function(event) {
            createNewTask($("#tbxTask").val());
            event.preventDefault();
        });

        $('#modalForm').submit(function(event) {
            event.preventDefault();
        });

        $('#modalDelete').click(function() {
            tasks.deleteTask(activeTask.id, function() {
                $('#myModal').modal('hide');
                $('#' + activeTask.id).remove();
            }, function(err) {
                $('#myModal').modal('hide');
                displayErrorDialog("Update task", err);
            });
        });

        $('#modalSaveChanges').click(function() {
            tasks.updateTask(activeTask.id,
                $('#modalTaskTitle').val(),
                $('.taskStatusOption').filter(':checked').val(),
                $('#modalTaskNote').val(),
                function() {
                    $('#myModal').modal('hide');
                    activeTask = tasks.getTask(activeTask.id);
                    $('#' + activeTask.id).text(activeTask.title);
                }, function(err) {
                    $('#myModal').modal('hide');
                    displayErrorDialog("Update task", err);
                });
        });
    });
})(window, $, window.todo.tasks);