define(
    function (require) {
        var Dialog = require('esui/Dialog');
        var lib = require('esui/lib');
        var ui = require('esui/main');

        require('ef/ActionPanel');

        /**
         * 用于加载子Action的面板控件
         *
         * @constructor
         * @extends esui/Panel
         */
        function ActionDialog() {
            Dialog.apply(this, arguments);
        }

        ActionDialog.prototype.type = 'ActionDialog';
        ActionDialog.prototype.styleType = 'Dialog';

        /**
         * 设置HTML内容，`ActionDialog`没有这功能
         */
        ActionDialog.prototype.setContent = function () {
        };

        /**
         * 构建对话框主内容和底部内容
         *
         * @param {"foot" | "body"} type 面板类型
         * @param {HTMLElement} mainDOM body或foot主元素
         *
         * @return {ef.ActionPanel | esui.Panel} panel
         * @protected
         */
        ActionDialog.prototype.createBF = function (type, mainDOM) {
            if (mainDOM) {
                this.content = mainDOM.innerHTML;
            }
            else {
                mainDOM = document.createElement('div');
                this.main.appendChild(mainDOM);
            }

            this.helper.addPartClasses(type + '-panel', mainDOM);
            var properties = {
                main: mainDOM
            };

            var panelType = 'Panel';
            if (type === 'body') {
                properties.url = this.url;
                properties.actionOptions = this.actionOptions;
                panelType = 'ActionPanel';
            }

            var panel = ui.create(panelType, properties);
            if (type === 'body') {
                panel.on(
                    'actionloaded',
                    function () {
                        this.resize();

                        if (this.autoClose) {
                            // 当子Action处理完成后对话框也一起销毁
                            var action = this.get('action');
                            action.on('handlefinish', this.dispose, this);
                        }

                        this.fire('actionloaded');
                    },
                    this
                );

                // 把`ActionPanel`代理的子Action事件再代理出来
                panel.on(
                    '*',
                    function (e) {
                        if (e.type.indexOf('action@') === 0) {
                            // 不像`ActionPanel`，这里不需要修改`type`，所以直接触发
                            this.fire(e);
                        }
                    },
                    this
                );

                // 代理`ActionPanel`的相关事件
                var Event = require('mini-event');
                Event.delegate(panel, this, 'actionloadfail');
                Event.delegate(panel, this, 'actionloadabort');
            }

            panel.render();
            this.addChild(panel, type);

            return panel;
        };

        var helper = require('esui/controlHelper');
        /**
         * 重构
         *
         * @protected
         * @override
         */
        ActionDialog.prototype.repaint = helper.createRepaint(
            Dialog.prototype.repaint,
            {
                name: ['url', 'actionOptions'],
                paint: function (dialog, url, actionOptions) {
                    // 获取body panel
                    var body = dialog.getBody();
                    var properties = {
                        url: url,
                        actionOptions: actionOptions
                    };
                    body.setProperties(properties);
                }
            }
        );

        /**
         * 获取action
         *
         * @return {er.Action | null}
         */
        ActionDialog.prototype.getAction = function () {
            var actionPanel = this.getBody();
            if (actionPanel) {
                return actionPanel.get('action');
            }
            else {
                return null;
            }
        };


        /**
         * 重新加载管理的子Action(代理Panel的)
         */
        ActionDialog.prototype.reload = function () {
            var actionPanel = this.getBody();
            if (actionPanel) {
                actionPanel.reload();
            }
        };

        lib.inherits(ActionDialog, Dialog);
        require('esui').register(ActionDialog);
        return ActionDialog;
    }
);