define(
    function (require) {
        var Model = require('er/Model');
        var UIModel = require('ef/UIModel');
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
                ),
                crumbPath: datasource.constant(
                    [{ text: '成员列表', href: '#/member/list' }]
                )
            };
        }

        MemberFormModel.prototype.prepare = function () {
            var textLable = this.get('detail').name;
            var crumbPath = this.get('crumbPath');
            crumbPath.push({text: textLable});
            this.set('crumbPath', crumbPath);
        };

        MemberFormModel.prototype.save = function (data) {
            var postData = this.adaptAndFill(data);
            var ajax = require('er/ajax');
            ajax.post('/member/update', postData);
        };

        MemberFormModel.prototype.formatters = {
            birthday: UIModel.formatters.time
        };

        MemberFormModel.prototype.adaptAndFill = function (data) {
            var postKeys = Object.keys(data); 
            this.fill(data);
            var postData = this.getPart.apply(this, postKeys);
            return postData;
        };

        require('er/util').inherits(MemberFormModel, UIModel);
        return MemberFormModel;
    }
);