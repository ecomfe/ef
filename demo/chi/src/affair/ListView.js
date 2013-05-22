define(
    function (require) {
        require('er/tpl!./list.tpl');
        require('esui/Button');
        require('esui/Table');
        require('esui/extension/Command');


        var AffairType = require('./config').AffairType;
        var tableFields = [
            {
                title: '时间',
                field: 'time' ,
                tip :'时间',
                width: 50,
                content: 'time'
            },
            {
                title: '成员',
                field: 'member' ,
                tip :'成员姓名',
                width: 50,
                content: function (item) {
                    return item.member.name;
                }
            },
            {
                title: '类型',
                field: 'type' ,
                tip :'收支类型',
                width: 50,
                content: function (item) {
                    return AffairType[item.type];
                }
            },
            {
                title: '金额',
                field: 'amount' ,
                tip :'金额',
                width: 50,
                content: 'amount'
            },
            {
                title: '余额',
                field: 'balance' ,
                tip :'开支后余额',
                width: 50,
                content: 'balance'
            },
            {
                title: '操作',
                width: 150,
                content: function (item) {
                    return '<span class="operation-modify" data-command="modify" data-command-args="'
                        + item.id + '">编辑</span>'
                }
            }
        ];

        var UIView = require('ef/UIView');

        function handleCommand(e) {
            if (e.name === 'modify') {
                this.fire('modify', {id: e.args});
            }
            if (e.name === 'create') {
                this.fire('create', {});
            }
        }

        function AffairListView() {
            UIView.apply(this, arguments);
            this.uiEvents = {
                'list:command': handleCommand.bind(this),
            };
        }

        AffairListView.prototype.template = 'affairListPage';

        AffairListView.prototype.uiProperties = {
            list: {
                fields: tableFields,
                sortable: false,
                columnResizable: true,
                subrow: false,
                followHead: true,
                selectMode: 'line'
            }
        };

        AffairListView.prototype.enterDocument = function () {
            UIView.prototype.enterDocument.apply(this, arguments);
            this.get('createButton').on(
                'click', 
                handleCommand.bind(this, {name: 'create'})
            );
        }

        require('er/util').inherits(AffairListView, UIView);
        return AffairListView;
    }
);