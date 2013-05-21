define(
    function (require) {
        var Model = require('er/Model');
        var datasource = require('er/datasource');

        var affairs = [];
        for (var i = 0; i < 20; i++) {
            var item = {
                time: '2013-05-21',
                member: {
                    name: '李享'
                },
                type: 0,
                amount: 32,
                balance: 192
            };
            affairs.push(item);
        }
        var affairList = {
            page: 1,
            totalCount: 53,
            results: affairs
        };

        function AffairListModel() {
            Model.apply(this, arguments);

            var url = this.get('url');
            this.datasource = {
                list: datasource.constant(affairList)
            };
            // this.datasource = {
            //     list: datasource.remote(
            //         '/affair/list', 
            //         {
            //             method: 'GET',
            //             data: {
            //                 page: url.getQuery('page'),
            //                 pageCount: url.getQuery('pageCount')
            //             }
            //         }
            //     )
            // };
    }

        require('er/util').inherits(AffairListModel, Model);
        return AffairListModel;
    }
);