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
    var State;
    (function (State) {
        State[State["Hidden"] = 0] = "Hidden";
        State[State["Shown"] = 1] = "Shown";
        State[State["Blink"] = 2] = "Blink";
    })(State = exports.State || (exports.State = {}));
    var VisibilityController = (function () {
        function VisibilityController(element, options, state) {
            this._blinkId = null;
            this._element = element;
            this._options = options;
            if (state) {
                this.state(state);
            }
            else {
                this.state(State.Hidden);
            }
        }
        VisibilityController.prototype.options = function (options) {
            if (options) {
                this._options = options;
                this.state(this._state);
                return this;
            }
            return this._options;
        };
        VisibilityController.prototype.state = function (state) {
            var _this = this;
            if (state) {
                this._state = state;
                this._stopBlink();
                switch (state) {
                    case State.Hidden:
                        this._element.style.visibility = "hidden";
                        this._visible = false;
                        break;
                    case State.Shown:
                        this._element.style.visibility = "visible";
                        this._visible = true;
                        break;
                    case State.Blink:
                        this._blinkId = window.setInterval(function () { return _this._toggleState(); }, this._options.intervalSecs * 1000);
                        break;
                }
            }
            return this._state;
        };
        VisibilityController.prototype._stopBlink = function () {
            if (this._blinkId) {
                window.clearInterval(this._blinkId);
            }
        };
        VisibilityController.prototype._toggleState = function () {
            if (this._visible) {
                this._element.style.visibility = "hidden";
                this._visible = false;
            }
            else {
                this._element.style.visibility = "visible";
                this._visible = true;
            }
        };
        return VisibilityController;
    }());
    exports.VisibilityController = VisibilityController;
});
//# sourceMappingURL=visibility.js.map