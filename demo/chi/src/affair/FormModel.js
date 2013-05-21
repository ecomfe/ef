define(
    function (require) {
        var Model = require('er/Model');
        var datasource = require('er/datasource');

        var affair = {
            time: '2013-05-21',
            member: {
                name: '石磊',
                id: 1
            },
            type: 0,
            amount: 32
        };
        var members = [
            {
                text: '石磊',
                value: 1
            },
            {
                text: '李享',
                value: 2
            },
            {
                text: '张立理',
                value: 3
            },
            {
                text: '李义冬',
                value: 4
            },
            {
                text: '沈彬',
                value: 5
            },
            {
                text: '叶梦秋',
                value: 6
            },
            {
                text: '孙金飞',
                value: 7
            },
            {
                text: '刘开花',
                value: 8
            }
        ];

        var types = [
            {
                text: '充值',
                value: 0
            },
            {
                text: '支出',
                value: 1
            }
        ];

        function AffairFormModel() {
            Model.apply(this, arguments);

            var url = this.get('url');
            this.datasource = {
                detail: datasource.constant(affair),
                members: datasource.constant(members),
                types: datasource.constant(types)
            };
            // this.datasource = {
            //     detail: datasource.remote(
            //         '/affair/read', 
            //         {
            //             method: 'GET',
            //             data: {
            //                 id: url.getQuery('id'),
            //             }
            //         }
            //     )
            //     members: datasource.remote(
            //         '/member/list', 
            //         {
            //             method: 'GET',
            //             data: {}
            //         }
            //     )
            // };
    }

        require('er/util').inherits(AffairFormModel, Model);
        return AffairFormModel;
    }
);