define(
    function (require) {
        var View = require('er/View');

        /**
         * 与ESUI结合的`View`基类
         *
         * @constructor
         * @extends er/View
         */
        function UIView() {
            View.apply(this, arguments);
        }

        /**
         * 替换元素属性中的特殊值
         *
         * @param {string} value 需要处理的值
         * @return {*} 处理完的值
         * @public
         */
        UIView.prototype.replaceValue = function (value) {
            var prefix = value.charAt(0);
            var actualValue = value.substring(1);

            if (prefix === '@') {
                return this.model.get(actualValue);
            }
            else {
                return value;
            }
        };

        /**
         * 根据id获取当前视图下的控件
         *
         * @param {string} id 控件的id
         * @return {Control=} 对应的控件
         * @protected
         */
        UIView.prototype.get = function (id) {
            return this.viewContext.get(id);
        };

        /**
         * 绑定控件的事件
         *
         * @override
         * @protected
         */
        UIView.prototype.bindEvents = function () {
            if (!this.uiEvents) {
                return;
            }

            for (var key in this.uiEvents) {
                if (this.uiEvents.hasOwnProperty(key)) {
                    // 可以用`submit:click`的形式在指定控件上绑定指定类型的控件
                    var segments = key.split(':');
                    if (segments.length > 1) {
                        var id = segments[0];
                        var type = segments[1];
                        var control = this.get(id);
                        var handler = this.uiEvents[key];
                        if (control) {
                            control.on(type, handler);
                        }
                    }
                    // 也可以是一个控件的id，值是对象，里面每一项都是一个事件类型
                    else {
                        var map = this.uiEvents[key];
                        var control = this.get(key);
                        if (control && typeof map === 'object') {
                            for (var type in map) {
                                var handler = map[type];
                                // 值也可以是个字符串，
                                // 那么用当前实例上的对应属性作为处理函数
                                if (typeof handler === 'string') {
                                    handler = this[handler];
                                }
                                control.on(type, handler);
                            }
                        }
                    }
                }
            }
        };

        /**
         * 当容器渲染完毕后触发，用于控制元素可见性及绑定事件等DOM操作
         *
         * @override
         * @protected
         */
        UIView.prototype.enterDocument = function () {
            var ViewContext = require('esui/ViewContext');
            this.viewContext = new ViewContext();

            var container = document.getElementById(this.container);
            var options = {
                viewContext: this.viewContext,
                properties: this.uiProperties,
                valueReplacer: require('er/util').bind(this.replaceValue, this)
            };
            require('esui').init(container, options);

            this.bindEvents();
        };

        /**
         * 销毁当前视图
         *
         * @override
         * @protected
         */
        UIView.prototype.dispose = function () {
            if (this.viewContext) {
                this.viewContext.dispose();
                this.viewContext = null;
            }
            View.prototype.dispose.apply(this, arguments);
        };

        require('er/util').inherits(UIView, View);
        return UIView;
    }
);