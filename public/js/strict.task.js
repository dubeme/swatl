(function(window, $){
    'strict mode';
    
    var tasks = {},
        ajaxHelper = {},
        taskPrototype = {
            id: "",
            title: "",
            status: ['new', 'inprogress', 'done'],
            notes: []
        };
        
    function createTaskCopy(original, copy) {
        var merged = null;
        
        if (isDefinedAndNotNull(original)) {
            merged = $.extend(true, {}, original, copy);
        }
        
        return merged;
    }
    
    function trimToMatchPrototype(task) {
        if(isDefinedAndNotNull(task)) {
            return {
                id: task.id,
                title: task.title,
                status: task.status,
                notes: task.notes
            };
        }
        
        return null;
    }
    
    function isDefinedAndNotNull(val) {
        return typeof val !== 'undefined' && val !== null;
    }
    
    function isNullOrWhitespace( str ) {
        if (typeof str === 'undefined' || str == null)
            return true;
        return str.replace(/\s/g, '').length < 1;
    }
    
    function throwException(message) {
        throw new Error(message);
    }
    
    /*------------------------------------------*/
    //             CRUD SECTION                 //
    /*------------------------------------------*/
    function createTask(title, status, notes, success, error) {
        if(isNullOrWhitespace(title)) {
            throwException("Must specify a task title");
        }
        
        if(isNullOrWhitespace(status)) {
            throwException("Must specify a task status");
        }
        
        ajaxHelper.createTask(title, status, notes);
    }
    
    function getTask(id) {
        if (tasks.hasOwnProperty(id)) {
            // Return a copy to avoid un authorized update
            return createTaskCopy(tasks[id]);
        }
        
        return null;
    }
    
    function getAllTasks() {
        var copy = [];
        
        $.each(tasks, function(index, val){
            copy.push();
        });
    }
    
    function updateTask(id, modifiedTask, success, error) {
        var task = null;
        
        if (tasks.hasOwnProperty(id)) {
            
            if (id !== modifiedTask.id) {
                throwException("Update failed, Id mismatch");
            }
            
            task = createTaskCopy(tasks[id], modifiedTask);
            task = trimToMatchPrototype(task);
            
            ajaxHelper.updateTask(id, task, function(){
                tasks[id] = task;
                success();
            }, error);
        }
    }
    
    function deleteTask(id, success, error) {
        if (tasks.hasOwnProperty(id)) {
            ajaxHelper.deleteTask(id, function(){
                delete tasks[id];
                success();
            }, error);
        }
    }
    
})(window, $);