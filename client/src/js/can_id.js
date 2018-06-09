(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CanId = (function () {
        function CanId(rawId) {
            this.rawId = rawId;
        }
        CanId.prototype.sourceId = function () {
            return this.rawId & 0xF;
        };
        CanId.prototype.msgType = function () {
            return (this.rawId >> 4) & 0x1;
        };
        CanId.prototype.msgId = function () {
            return (this.rawId >> 5) & 0x3F;
        };
        return CanId;
    }());
    exports.CanId = CanId;
});
//# sourceMappingURL=can_id.js.map