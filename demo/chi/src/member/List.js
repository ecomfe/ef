define(
    function (require) {
        var Action = require('er/Action');
        function MemberList() {
            Action.apply(this, arguments);
        }

        MemberList.prototype.modelType = require('./ListModel');

        MemberList.prototype.viewType = require('./ListView');

        MemberList.prototype.initBehavior = function () {
            this.view.on('removeClicked') = function (id) {
                alert('ID:' + e.args + 'has been removed 啊假假地～');
            };
            this.view.on('modifyClicked') = function (id) {
                this.redirect('/member/modify~id=' + e.id);
            };
        };

        require('er/util').inherits(MemberList, Action);
        return MemberList;
    }
);