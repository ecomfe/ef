/**
 * Ecom Framework
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file ViewPanel
 * @author otakustay
 */

define(
    function (require) {
        var u = require('underscore');
        var Control = require('esui/Control');

        /**
         * @class ef.ViewPanel
         *
         * 子视图控件，用于加载一个{@link er.View}
         *
         * @constructor
         * @extends esui.Control
         */
        var exports = {};

        /**
         * 控件的类型，始终为`"ViewPanel"`
         *
         * @type {string}
         * @readonly
         * @override
         */
        exports.type = 'ViewPanel';

        /**
         * 加载视图
         *
         * @public
         * @method ef.ViewPanel#loadView
         * @param {string} viewType 视图模块路径
         * @return {Promise}
         */
        exports.loadView = function (viewType) {
            var loadingView = require('er/Deferred').require([viewType]);
            return loadingView;
        };

        /**
         * 重绘
         *
         * @protected
         * @override
         */
        exports.repaint = require('esui/painters').createRepaint(
            Control.prototype.repaint,
            {
                name: 'viewType',
                paint: function (viewPanel, viewType) {
                    viewPanel.disposeView();

                    var loadingView = viewPanel.loadView(viewType);
                    loadingView.then(u.bind(viewPanel.fire, viewPanel, 'viewloaded'));
                    viewPanel.view = loadingView.then(u.bind(viewPanel.renderView, viewPanel));
                }
            }
        );

        /**
         * 销毁对应的视图
         *
         * 如果在视图模块加载过程中，调用了此方法是没有效果的，加载完后会继续把视图渲染出来
         */
        exports.disposeView = function () {
            var view = this.get('view');

            if (view && typeof view.dispose === 'function') {
                view.dispose();
            }

            this.view = null;
        };

        /**
         * 代理View的事件
         *
         * @param {mini-event.Event} e 事件对象
         */
        function delegateViewEvents(e) {
            var event = require('mini-event').fromEvent(e, {preserveData: true, syncState: true});
            event.type = 'view@' + e.type;
            this.fire(event);
        }

        /**
         * 生成内部加载View的name
         *
         * @return {string}
         */
        function getViewName() {
            return this.viewContext.id + '-' + this.id;
        }

        /**
         * 渲染加载完毕的视图对象
         *
         * @param {Mixed} View 加载完毕的视图构造函数或对象
         * @return {View}
         * @protected
         */
        exports.renderView = function (View) {
            // 仅当渲染完成阶段才会对View进行操作，销毁的时候这里不处理
            if (this.helper.isInStage('RENDERED')) {
                this.loadedView = View; // 存下来，后面还会用到的
                var view = this.view = typeof View === 'function' ? new View() : View;
                view.name = getViewName.call(this);
                view.model = this.get('model');
                view.container = this.main.id;
                view.render();

                this.fire('viewrendered');

                view.on('*', delegateViewEvents, this);
            }

            return this.view;
        };

        /**
         * 刷新包含的视图
         */
        exports.refresh = function () {
            var view = this.get('loadedView');
            if (!view) {
                throw new Error('No view module or instance loaded yet');
            }
            this.disposeView();
            this.renderView(view);
        };

        var ViewPanel = require('eoo').create(Control, exports);
        require('esui').register(ViewPanel);
        return ViewPanel;
    }
);
