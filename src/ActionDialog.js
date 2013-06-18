define(
    function (require) {
        require('ef/ActionPanel');
        var Dialog = require('esui/Dialog');
        var lib = require('esui/lib');
        var helper = require('esui/controlHelper');
        var ui = require('esui/main');

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

        /**
         * 加载的Action的实例
         *
         * @type {er/Action|er/Promise}
         * @public
         * @readonly
         */
        ActionDialog.prototype.action = null;

        /**
         * 设置HTML内容，`ActionDialog`没有这功能
         *
         * @public
         */
        ActionDialog.prototype.setContent = function () {
        };

        /**
         * 构建对话框主内容和底部内容
         *
         * @param {string} type foot | body
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

            lib.addClasses(
                mainDOM,
                helper.getPartClasses(this, type + '-panel')
            );
            var properties = {
                main: mainDOM,
                url: this.url,
                actionOptions: this.actionOptions
            };

            var panelType = 'panel';
            if (type == 'body') {
                properties.url = this.url;
                properties.actionOptions = this.actionOptions;
                panelType = 'ActionPanel';
            }
            var panel = ui.create(panelType, properties);
            if (type == 'body') {
                var me = this;
                panel.on('actionloaded', function() {
                    me.action = this.action;
                    me.fire('actionloaded');
                });
            }
            panel.render();
            this.addChild(panel, type);
            return panel;
        };


        ActionDialog.prototype.repaint = helper.createRepaint(
            Dialog.prototype.repaint,
            {
                name: ['url', 'actionOptions'],
                paint: function (dialog, url, actionOptions) {
                    // 获取body panel
                    var body = dialog.getBody();
                    body.setProperties({
                        url: url,
                        actionOptions: actionOptions
                    });
                }
            }
        );

        /**
         * 销毁控件
         */
        ActionDialog.prototype.dispose = function () {
            this.action = null;
            Dialog.prototype.dispose.apply(this, arguments);
        };

        lib.inherits(ActionDialog, Dialog);
        require('esui').register(ActionDialog);
        return ActionDialog;
    }
);