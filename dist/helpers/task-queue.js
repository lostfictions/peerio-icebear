'use strict';

var _dec, _dec2, _desc, _value, _class, _descriptor, _descriptor2;

function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

const { computed, observable, action } = require('mobx');

/**
 * Observable task queue implementation
 * @param {number} [parallelism=1] - how many tasks can run(wait to be finished) at the same time
 * @param {number} [throttle=0] - how many milliseconds delay to make before running every task
 * @class TaskQueue
 * @public
 */
let TaskQueue = (_dec = action.bound, _dec2 = action.bound, (_class = class TaskQueue {
    /**
     * Amount of currently running tasks + tasks in queue
     * @member {Computed<number>} length
     * @memberof TaskQueue
     * @instance
     * @public
     */
    get length() {
        return this.tasks.length + this.runningTasks;
    }
    /**
     * Amount of currently running tasks
     * @member {Observable<number>} runningTasks
     * @memberof TaskQueue
     * @instance
     * @public
     */


    constructor(parallelism, throttle) {
        _initDefineProp(this, 'tasks', _descriptor, this);

        _initDefineProp(this, 'runningTasks', _descriptor2, this);

        this.parallelism = parallelism || 1;
        this.throttle = throttle || 0;
    }

    /**
     * Adds task to the queue.
     * Depending on return value task will be considered finished right after exit from the function or
     * after returned promise is fulfilled.
     * @function addTask
     * @param {function} task - function to run
     * @param {Object} [context] - 'this' context to execute the task with
     * @param {Array<any>} [args] - arguments to pass to the task
     * @param {callback} [onSuccess] - callback will be executed as soon as task is finished without error
     * @param {callback<Error>} [onError] - callback will be executed if task throws or rejects promise
     * @returns {Promise}
     * @memberof TaskQueue
     * @instance
     * @public
     */
    addTask(task, context, args, onSuccess, onError) {
        return new Promise((resolve, reject) => {
            this.tasks.push({
                task,
                context,
                args,
                onSuccess: (...finishArgs) => {
                    resolve(...finishArgs);
                    if (onSuccess) onSuccess(...finishArgs);
                },
                onError: (...errArgs) => {
                    reject(...errArgs);
                    if (onError) onError(...errArgs);
                }
            });
            setTimeout(this.runTask, this.throttle);
        });
    }

    /**
     * Runs the next task in queue if it is possible
     * @function runTask
     * @memberof TaskQueue
     * @instance
     * @private
     */
    runTask() {
        // if reached the limit of parallel running tasks or no tasks left - doing nothing
        if (this.parallelism <= this.runningTasks || this.tasks.length === 0) return;
        this.runningTasks++;
        let t;
        try {
            t = this.tasks.shift();
            let ret = t.task.apply(t.context, t.args);
            if (ret instanceof Promise) {
                // task is considered done when promise is complete
                ret = ret.then(t.onSuccess);
                ret = ret.catch(t.onError);
                ret = ret.finally(this.onTaskComplete);
                return;
            }
            // otherwise we assume the task was synchronous
            if (t.onSuccess) t.onSuccess();
            this.onTaskComplete();
        } catch (ex) {
            // in case something went wrong we schedule next task
            console.error(ex);
            if (t.onError) t.onError(ex);
            this.onTaskComplete();
        }
    }

    /**
     * Performs necessary actions when a task is finished
     * @function onTaskComplete
     * @memberof TaskQueue
     * @instance
     * @private
     */
    onTaskComplete() {
        this.runningTasks--;
        for (let i = this.runningTasks; i < this.parallelism; i++) {
            setTimeout(this.runTask, this.throttle);
        }
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'tasks', [observable], {
    enumerable: true,
    initializer: function () {
        return observable.shallowArray([]);
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'runningTasks', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
}), _applyDecoratedDescriptor(_class.prototype, 'length', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'length'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'addTask', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'addTask'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'runTask', [_dec], Object.getOwnPropertyDescriptor(_class.prototype, 'runTask'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'onTaskComplete', [_dec2], Object.getOwnPropertyDescriptor(_class.prototype, 'onTaskComplete'), _class.prototype)), _class));


module.exports = TaskQueue;