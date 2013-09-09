define(
    function (require) {
        var Panel = require('esui/Panel');
        var lib = require('esui/lib');
        var helper = require('esui/controlHelper');
        var events = require('er/events');

        /**
         * 用于加载子Action的面板控件
         *
         * @constructor
         * @extends esui/Panel
         */
        function ActionPanel() {
            Panel.apply(this, arguments);
        }

        ActionPanel.prototype.type = 'ActionPanel';

        /**
         * 设置HTML内容，`ActionPanel`没有这功能
         *
         * @public
         */
        ActionPanel.prototype.setContent = function () {
        };

        /**
         * 加载的Action的类型
         *
         * @type {string}
         * @public
         */
        ActionPanel.prototype.actionType = null;

        /**
         * 加载的Action的实例
         *
         * @type {er/Action|er/Promise}
         * @public
         * @readonly
         */
        ActionPanel.prototype.action = null;

        /**
         * 把已经加载的子Action赋值到控件上
         *
         * @param {ActionPanel} panel 控件实例
         * @param {er/Action} action Action实例
         * @inner
         */
        function attachAction(panel, e) {
            if (!e.isChildAction || e.container !== panel.main.id) {
                return;
            }
            
            panel.action = e.action;
            panel.fire('actionloaded');
        }

        /**
         * 通知子Action加载失败
         *
         * @param {ActionPanel} panel 控件实例
         * @param {string} reason 失败原因
         * @inner
         */
        function notifyActionLoadFailed(panel, e) {
            if (!e.isChildAction || e.container !== panel.main.id) {
                return;
            }
            
            panel.action = null;
            panel.fire(
                'actionloadfail', 
                { failType: e.failType, reason: e.reason }
            );
        }

        /**
         * 通知子Action加载中断
         *
         * @param {ActionPanel} panel 控件实例
         * @param {string} reason 失败原因
         * @inner
         */
        function notifyActionLoadAborted(panel, e) {
            if (!e.isChildAction || e.container !== panel.main.id) {
                return;
            }
            
            panel.fire('actionloadabort');
        }

        /**
         * 初始化结构
         *
         * @override
         * @protected
         */
        ActionPanel.prototype.initStructure = function () {
            var localAttachAction = 
                lib.curry(attachAction, this);
            events.on('enteractioncomplete', localAttachAction);
            var localNotifyActionLoadFailed 
                = lib.curry(notifyActionLoadFailed, this);
            events.on('actionnotfound', localNotifyActionLoadFailed);
            events.on('permissiondenied', localNotifyActionLoadFailed);
            events.on('actionfail', localNotifyActionLoadFailed);
            events.on('enteractionfail', localNotifyActionLoadFailed);
            var localNotifyActionLoadAborted
                = lib.curry(notifyActionLoadAborted, this);
            events.on('actionabort', localNotifyActionLoadAborted);

            this.on(
                'beforedispose',
                function () {
                    events.un('enteractioncomplete', localAttachAction);
                    events.un('actionnotfound', localNotifyActionLoadFailed);
                    events.un('permissiondenied', localNotifyActionLoadFailed);
                    events.un('actionfail', localNotifyActionLoadFailed);
                    events.un('enteractionfail', localNotifyActionLoadFailed);
                    events.un('actionabort', localNotifyActionLoadAborted);
                }
            );
        };

        /**
         * 销毁控件上关联的Action
         *
         * @param {ActionPanel} panel 控件实例
         * @inner
         */
        function disposeAction(panel) {
            var Deferred = require('er/Deferred');
            var action = panel.action;

            if (!action) {
                return;
            }

            // Action正在加载，正确的`renderChildAction`得到的加载器有`abort`方法
            if (Deferred.isPromise(action) 
                && typeof action.abort === 'function'
            ) {
                action.abort();
            }
            // 已经加载完的Action，但并不一定会有`leave`方法
            else if (typeof action.leave === 'function') {
                action.leave();
            }

            panel.action = null;
        }

        ActionPanel.prototype.repaint = helper.createRepaint(
            Panel.prototype.repaint,
            {
                name: ['url', 'actionOptions'],
                paint: function (panel, url, actionOptions) {
                    disposeAction(panel);

                    if (!url) {
                        return;
                    }

                    if (panel.lazy && helper.isInStage(panel, 'INITED')) {
                        return;
                    }

                    var controller = require('er/controller');
                    panel.action = controller.renderChildAction(
                        url, 
                        panel.main.id, 
                        actionOptions
                    );

                    // 如果发生错误，因为事件是同步触发的，
                    // 因此先执行`notifyActionLoadFailed`再赋值，导致没清掉。
                    // 错误时返回的`Promise`对象是没有`abort`方法的，
                    // 这种对象我们也不需要，因此直接清掉
                    if (typeof panel.action.abort !== 'function') {
                        panel.action = null;
                    }
                }
            }
        );

        /**
         * 销毁控件
         *
         * @override
         * @public
         */
        ActionPanel.prototype.dispose = function () {
            disposeAction(this);
            Panel.prototype.dispose.apply(this, arguments);
        };

        /**
         * 重新加载管理的子Action
         *
         * @param {Object=} actionOptions 子Action的额外数据
         * @public
         */
        ActionPanel.prototype.reload = function (actionOptions) {
            var url = this.url;
            this.url = null;
            this.setProperties({ url: url, actionOptions: actionOptions });
        };

        lib.inherits(ActionPanel, Panel);
        require('esui').register(ActionPanel);
        return ActionPanel;
    }
);