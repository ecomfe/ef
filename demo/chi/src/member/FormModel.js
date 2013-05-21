define(
    function (require) {
        var Model = require('er/Model');
        var datasource = require('er/datasource');

        function MemberFormModel() {
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