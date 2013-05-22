define(
    function (require) {
        var actions = [
            {
                path: '/',
                type: 'member/List'
            },
            {
                path: '/member/list',
                type: 'member/List'
            },
            {
                path: '/member/create',
                type: 'member/Form'
            },
            {
                path: '/member/modify',
                type: 'member/Form'
            }
        ];

        var controller = require('er/controller');
        actions.forEach(controller.registerAction);

        var config = {};
        config.MemberType = {
            0: '女',
            1: '男',
            2: '保密'
        };

        return config;
    }
);