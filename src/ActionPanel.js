define(
    function (require) {
        var Panel = require('esui/Panel');
        var lib = require('esui/lib');
        var helper = require('esui/controlHelper');

        /**
         * 用于加载子Action的面板控件
         *
         * @constructor
         * @extends esui/Panel
         */
        function ActionPanel() {
            Panel.apply(this, arguments);
        }

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
        function attachAction(panel, action) {
            panel.action = action;
            panel.fire('actionloaded');
        }

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

            // Action正在加载，正确的`renderChildAction`得到的加载器有`cancel`方法
            if (Deferred.isPromise(action) 
                && typeof action.cancel === 'function'
            ) {
                action.cancel();
            }
            // 已经加载完的Action，但并不一定会有`dispose`方法
            else if (typeof action.dispose === 'function') {
                action.dispose();
            }

            panel.action = null;
        }

        ActionPanel.prototype.repaint = helper.createRepaint(
            {
                name: 'url',
                paint: function (panel, value) {
                    disposeAction(panel);

                    var controller = require('er/controller');
                    this.action = controller.renderChildAction(
                        value, 
                        this.main.id, 
                        this.actionOptions
                    );
                    this.action.done(lib.curry(attachAction, this));
                }
            }
            // TODO: `actionOptions`的变化也要有上面的逻辑，待painters合并功能完成
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

        lib.inherits(ActionPanel, Panel);
        require('esui').register(ActionPanel);
        return ActionPanel;
    }
);