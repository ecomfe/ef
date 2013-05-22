define(
    function (require) {
        var Model = require('er/Model');
        var datasource = require('er/datasource');

        // var members = [];
        // for (var i = 0; i < 20; i++) {
        //     var item = {
        //         id: 101,
        //         name: '张立理',
        //         gender: 1,
        //         birthday: '1986-10-05',
        //         balance: 19200
        //     };
        //     members.push(item);
        // }
        // var memberList = {
        //     page: 1,
        //     totalCount: 53,
        //     results: members
        // };

        function MemberListModel() {
            Model.apply(this, arguments);

            var url = this.get('url');
            // this.datasource = {
            //     list: datasource.constant(memberList)
            // };
            this.datasource = {
                list: datasource.remote(
                    '/member/list', 
                    {
                        method: 'GET',
                        dataType: 'json',
                        data: {
                            page: url.getQuery('page'),
                            pageCount: url.getQuery('pageCount')
                        }
                    }
                )
            };
    }

        require('er/util').inherits(MemberListModel, Model);
        return MemberListModel;
    }
);