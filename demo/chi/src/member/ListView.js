define(
    function (require) {
        require('er/tpl!./list.tpl');
        require('esui/Table');
        require('esui/extension/Command');

        var MemberType = require('./config').MemberType;
        var tableFields = [
            {
                title: '成员',
                field: 'member' ,
                tip :'成员姓名',
                width: 50,
                content: function (item) {
                    return item.name;
                }
            },
            {
                title: '性别',
                field: 'gender' ,
                tip :'成员性别',
                width: 50,
                content: function (item) {
                    return MemberType[item.gender];
                }
            },
            {
                title: '生日',
                field: 'birthday' ,
                tip :'成员的生日',
                width: 100,
                content: function (item) {
                    return item.birthday;
                }
            },
            {
                title: '余额',
                field: 'balance' ,
                tip :'开支后余额',
                width: 100,
                content: function (item) {
                    return item.balance;
                }
            },
            {
                title: '操作',
                width: 150,
                content: function (item) {
                    return '<span class="operation-modify" data-command="modify" data-command-args="'
                        + item.id + '">编辑</span>'
                        + ' | '
                        + '<span class ="operation-remove" data-command="remove" data-command-args="'
                        + item.id + '">删除</span>'
                }
            }
        ];

        var UIView = require('ef/UIView');

        function handleCommand(e) {
            if (e.name === 'modify') {
                this.fire('modifyClicked', {id: e.args});
            }
            if (e.name === 'remove') {
                this.fire('removeClicked', {id: e.args});
            }
        }

        function MemberListView() {
            UIView.apply(this, arguments);
            this.uiEvents = {
                'memberList:command': handleCommand.bind(this)
            };
        }

        MemberListView.prototype.template = 'memberList';

        MemberListView.prototype.uiProperties = {
            memberList: {
                fields: tableFields,
                sortable: false,
                columnResizable: true,
                subrow: false,
                followHead: true,
                selectMode: 'line'
            }
        };

        require('er/util').inherits(MemberListView, UIView);
        return MemberListView;
    }
);