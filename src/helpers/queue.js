const BPromise = require('bluebird');
const { computed, observable, action, asFlat } = require('mobx');

class Queue {
    @observable tasks = asFlat([]);
    @observable runningTasks = 0;
    @computed get queueLength() {
        return this.tasks.length + this.runningTasks;
    }

    constructor(parallelism, throttle) {
        this.parallelism = parallelism || 1;
        this.throttle = throttle || 0;
        this.runTask = this.runTask.bind(this);
        this.onTaskComplete = this.onTaskComplete.bind(this);
    }

    @action addTask(task, context, args) {
        this.tasks.push({ task, context, args });
        setTimeout(this.runTask, this.throttle);
    }
    // runs next task if it is possible
    @action runTask() {
        // if reached the limit of parallel running tasks or no tasks left - doing nothing
        if (this.parallelism <= this.runningTasks || this.tasks.length === 0) return;
        this.runningTasks++;
        try {
            const t = this.tasks.shift();
            const ret = t.task.call(t.context, t.args);
            if (ret instanceof Promise || ret instanceof BPromise) {
                // task is considered done when promise is complete
                ret.finally(this.onTaskComplete);
                return;
            }
            // otherwise we assume the task was synchronous
            this.onTaskComplete();
        } catch (ex) {
            // in case smth went wrong we schedule next task
            console.error(ex);
            this.onTaskComplete();
        }
    }

    @action onTaskComplete() {
        this.runningTasks--;
        for (let i = this.runningTasks; i < this.parallelism; i++) {
            setTimeout(this.runTask, this.throttle);
        }
    }

}

module.exports = Queue;
