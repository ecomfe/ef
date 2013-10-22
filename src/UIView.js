define(
    function (require) {
        var View = require('er/View');
        var util = require('er/util');

        /**
         * 与ESUI结合的`View`基类
         *
         * @constructor
         * @extends er/View
         */
        function UIView() {
            View.apply(this, arguments);
        }

        function getProperty(target, path) {
            var value = target;
            for (var i = 0; i < path.length; i++) {
                value = value[path[i]];
            }

            return value;
        }

        /**
         * 替换元素属性中的特殊值
         *
         * @param {string} value 需要处理的值
         * @return {*} 处理完的值
         * @public
         */
        UIView.prototype.replaceValue = function (value) {
            if (typeof value !== 'string') {
                return value;
            }

            var prefix = value.charAt(0);
            var actualValue = value.substring(1);

            if (prefix === '@' || prefix === '*') {
                var path = actualValue.split('.');
                var value = this.model.get(path[0]);
                return path.length > 1
                    ? getProperty(value, path.slice(1))
                    : value;
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
         * 根据name获取当前视图下的控件组
         *
         * @param {string} name 控件组的名称
         * @return {ControlGroup} 对应的控件组
         * @protected
         */
        UIView.prototype.getGroup = function (name) {
            return this.viewContext.getGroup(name);
        };

        /**
         * 创建一个控件实例
         *
         * @param {string} type 控件的类型
         * @param {Obejct=} options 创建控件时的选项
         * @return {Control}
         * @proceted
         */
        UIView.prototype.create = function (type, options) {
            options = options || {};
            if (!options.viewContext) {
                options.viewContext = this.viewContext;
            }
            return require('esui').create(type, options);
        };

        /**
         * 显示一条提示信息
         *
         * @param {string | Object} content 提示的内容或完整的配置项
         * @param {string=} title 提示框的标题，如`content`提供配置项则无此参数
         * @return {esui/Dialog}
         * @protected
         */
        UIView.prototype.alert = function (content, title) {
            var options = typeof content === 'string'
                ? { title: title || document.title, content: content }
                : util.extend({}, content);
            if (!options.viewContext) {
                options.viewContext = this.viewContext;
            }

            var Dialog = require('esui/Dialog');
            return Dialog.alert(options);
        };

        /**
         * 显示一条确认信息
         *
         * @param {string | Object} content 提示的内容或完整的配置项
         * @param {string=} title 提示框的标题，如`content`提供配置项则无此参数
         * @return {esui/Dialog}
         * @protected
         */
        UIView.prototype.confirm = function (content, title) {
            var options = typeof content === 'string'
                ? { title: title || document.title, content: content }
                : util.mix({}, content);
            if (!options.viewContext) {
                options.viewContext = this.viewContext;
            }

            var Dialog = require('esui/Dialog');
            return Dialog.confirm(options);
        };

        /**
         * 显示ActionDialog
         *
         * @param {Object} options 参数
         * @return {esui/Dialog}
         * @protected
         */
        UIView.prototype.popActionDialog = function (options) {
            //创建main
            var main = document.createElement('div');
            document.body.appendChild(main);
            options = util.mix({ 
                width: 600,
                needFoot: false,
                draggable: true,
                closeOnHide: true,
                autoClose: true,
                main: main
            }, options);
            if (!options.viewContext) {
                options.viewContext = this.viewContext;
            }
            require('ef/ActionDialog');
            var ui = require('esui/main');
            var dialog = ui.create('ActionDialog', options);

            dialog.render();
            dialog.show();
            return dialog;
        };

        /*
         * 声明控件的事件。该属性有2种方式：
         * 
         * - 以`id:eventName`为键，以处理函数为值。
         * - 以`id`为键，值为一个对象，对象中以`eventName`为键，处理函数为值。
         * 
         * 在此处声明的事件，运行时的`this`对象均是`View`实例，而非控件的实例。
         * 
         * 同时，在运行期，`UIView`会克隆该属性，将其中所有的处理函数都进行一次`bind`，
         * 将`this`指向自身，因此运行时的`uiEvents`与类声明时的不会相同。
         * 
         * 如果需要解除某个事件的绑定，可以使用`.on('type', this.uiEvents.xxx)`进行。
         *
         * @type {Object}
         * @public
         */
        UIView.prototype.uiEvents = null;

        /**
         * 声明控件的额外属性。
         *
         * 这个属性以控件的id为键，以一个对象为值。对象表示要额外附加到控件上的属性。
         * 当控件实例化时，会把DOM中声明的属性与此处声明的合并在一起，此处声明的为优先。
         *
         * @type {Object}
         * @public
         */
        UIView.prototype.uiProperties = null;

        /**
         * 深度克隆一个对象
         *
         * @param {*} source 待复制的对象
         * @return {*}
         * @inner
         */
        function clone(source) {
            var type = Object.prototype.toString.call(source);

            if (type === '[object Array]') {
                var result = [];
                for (var i = 0; i < source.length; i++) {
                    result.push(clone(source[i]));
                }
                return result;
            }
            else if (type === '[object Object]') {
                var result = {};
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        result[key] = clone(source[key]);
                    }
                }
                return result;
            }
            else {
                return source;
            }
        }

        /**
         * 给指定的控件绑定事件
         *
         * @param {UIView} view View对象实例
         * @param {string} id 控件的id
         * @param {string} eventName 事件名称
         * @param {function | string} handler 事件处理函数，或者对应的方法名
         * @return {function} 绑定到控件上的事件处理函数，不等于`handler`参数
         * @inner
         */
        function bindEventToControl(view, id, eventName, handler) {
            if (typeof handler === 'string') {
                handler = view[handler];
            }

            if (typeof handler !== 'function') {
                return handler;
            }

            handler = util.bind(handler, view);
            var control = view.get(id);
            if (control) {
                control.on(eventName, handler);
            }

            return handler;
        }

        /**
         * 绑定控件的事件。
         *
         * @override
         * @protected
         */
        UIView.prototype.bindEvents = function () {
            if (!this.uiEvents) {
                return;
            }

            // 由于需要修改保存在`uiEvents`里的函数，所以必须克隆一份，
            // 不然会影响到`prototype`上的内容导致错乱
            this.uiEvents = clone(this.uiEvents);

            for (var key in this.uiEvents) {
                if (!this.uiEvents.hasOwnProperty(key)) {
                    // 下面逻辑太长了，在这里先中断
                    continue;
                }

                // 可以用`submit:click`的形式在指定控件上绑定指定类型的控件
                var segments = key.split(':');
                if (segments.length > 1) {
                    var id = segments[0];
                    var type = segments[1];
                    var handler = this.uiEvents[key];
                    // 为了还能用`xxx.un('click', this.uiEvents.xxx)`解除，
                    // 因此这里要把值再设置回去
                    this.uiEvents[key] = 
                        bindEventToControl(this, id, type, handler);
                }
                // 也可以是一个控件的id，值是对象，里面每一项都是一个事件类型
                else {
                    var map = this.uiEvents[key];

                    if (typeof map !== 'object') {
                        return;
                    }

                    for (var type in map) {
                        if (map.hasOwnProperty(type)) {
                            var handler = map[type];
                            map[type] =
                                bindEventToControl(this, key, type, handler);
                        }
                    }
                }
            }
        };

        var counter = 0x861005;
        function getGUID() {
            return 'ef-' + counter++;
        }

        /**
         * 创建当前`UIView`使用的`ViewContext`对象
         *
         * @return {ViewContext}
         * @public
         */
        UIView.prototype.createViewContext = function () {
            var ViewContext = require('esui/ViewContext');
            var name = this.name;

            if (name) {
                return new ViewContext(name);
            }

            // 从构造函数把名字猜出来
            if (!name) {
                name = this.constructor && this.constructor.name;
            }
            if (!name && this.constructor) {
                // 用正则猜名字
                var functionString = this.constructor.toString();
                var match = /function\s+([^\(]*)/.exec(functionString);
                name = match && match[1];
            }
            if (!name) {
                name = getGUID();
            }

            // 以下代码是一个洁癖和强近症患者所写：

            // 如果名字是XxxView，把最后的View字样去掉
            name = name.replace(/View$/, '');
            // 从PascalCase转为横线分隔
            name = name.replace(
                /[A-Z]/g, 
                function (match) { return '-' + match.toLowerCase(); }
            );
            if (name.charAt(0) === '-') {
                name = name.substring(1);
            }

            return new ViewContext(name);
        };

        /**
         * 当容器渲染完毕后触发，用于控制元素可见性及绑定事件等DOM操作
         *
         * @override
         * @protected
         */
        UIView.prototype.enterDocument = function () {
            this.viewContext = this.createViewContext();

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