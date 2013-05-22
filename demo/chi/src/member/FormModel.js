define(
    function (require) {
        var Model = require('er/Model');
        var datasource = require('er/datasource');

        function MemberFormModel() {
            Model.apply(this, arguments);

            var url = this.get('url');
            var config = require('./config');
            this.datasource = {
                genderMap: datasource.constant(config.MemberType),
                detail: datasource.remote(
                    '/member/find', 
                    {
                        method: 'GET',
                        data: {
                            id: url.getQuery('id'),
                        }
                    }
                )
            };
        }

        require('er/util').inherits(MemberFormModel, Model);
        return MemberFormModel;
    }
);