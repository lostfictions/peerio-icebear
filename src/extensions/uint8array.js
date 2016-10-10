// @flow
/* eslint-disable no-param-reassign */
/**
 * Uint8Array extensions and polyfills.
 */

if (typeof (Uint8Array.prototype.slice) === 'undefined') {
    // $FlowBug
    Uint8Array.prototype.slice = function(begin?: number, end?: number) {
        begin = begin || 0;
        if (begin < 0) begin = Math.max(0, this.length + begin);
        end = typeof (end) === 'number' ? Math.min(this.length, end) : this.length;
        if (end < 0) end = this.length + end;

        const size = end - begin;
        if (size <= 0) return new Uint8Array();

        const ret = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            ret[i] = this[begin + i];
        }
        return ret;
    };
}
