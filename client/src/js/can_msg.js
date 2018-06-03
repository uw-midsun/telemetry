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
    var CanMessage = (function () {
        function CanMessage(rawId, data) {
            this.rawId = rawId;
            this.rawData = data;
        }
        CanMessage.prototype.sourceDevice = function () {
            return (this.rawId & 0xF);
        };
        CanMessage.prototype.msgType = function () {
            return (this.rawId & (0x1 << 4)) >> 4;
        };
        CanMessage.prototype.msgId = function () {
            return (this.rawId & (0x3F << 5)) >> 5;
        };
        CanMessage.prototype.data64 = function () {
            return this.rawData;
        };
        CanMessage.prototype.data32 = function (field) {
            return this.extractData(field, 32, 0x00000000FFFFFFFF);
        };
        CanMessage.prototype.data16 = function (field) {
            return this.extractData(field, 16, 0x000000000000FFFF);
        };
        CanMessage.prototype.data8 = function (field) {
            return this.extractData(field, 8, 0x00000000000000FF);
        };
        CanMessage.prototype.extractData = function (field, size, mask) {
            var offset = field * size;
            return ((this.rawData >> offset) & mask);
        };
        return CanMessage;
    }());
    exports.CanMessage = CanMessage;
});
//# sourceMappingURL=can_msg.js.map