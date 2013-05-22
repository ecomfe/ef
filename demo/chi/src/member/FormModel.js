define(
    function (require) {
        var Model = require('er/Model');
        var UIModel = require('ef/UIModel');
        var datasource = require('er/datasource');

        function MemberFormModel() {
            Model.apply(this, arguments);

            var url = this.get('url');
            var config = require('./config');
            if (this.get('formType') === 'update') {
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
                    ),
                    submitButtonText: datasource.constant('保存')
                };
            }
            else {
                this.datasource = {
                    genderMap: datasource.constant(config.MemberType),
                    detail: datasource.constant({}),
                    crumbPath: datasource.constant(
                        [
                            { text: '成员列表', href: '#/member/list' },
                            { text: '新建成员'}
                        ]
                    ),
                    submitButtonText: datasource.constant('新建')
                };
            }
        }

        function prepareCrumbPath() {
            if (this.get('formType') === 'update') {
                var textLable = this.get('detail').name;
                var crumbPath = this.get('crumbPath');
                crumbPath.push({text: textLable});
                this.set('crumbPath', crumbPath);
            }
        }

        MemberFormModel.prototype.prepare = function () {
            prepareCrumbPath.bind(this);
        };

        MemberFormModel.prototype.submitData = function (data) {
            var postData = this.adaptAndFill(data);

            var ajax = require('er/ajax');
            if (this.get('formType') === 'update') {
                return ajax.post('/member/update', postData);
            }
            if (this.get('formType') === 'create') {
                return ajax.post('/member/create', postData);
            }
        };

        MemberFormModel.prototype.formatters = {
            birthday: UIModel.formatters.date
        };

        MemberFormModel.prototype.adaptAndFill = function (data) {
            var postKeys = Object.keys(data); 
            this.fill(data);
            var postData = this.getPart.apply(this, postKeys);
            if (this.get('formType') === 'update') {
                var url = this.get('url');
                postData.id = url.getQuery('id');
            }
            return postData;
        };

        require('er/util').inherits(MemberFormModel, UIModel);
        return MemberFormModel;
    }
);