define(
    function (require) {
        var Action = require('er/Action');
        function MemberList() {
            Action.apply(this, arguments);
        }

        MemberList.prototype.modelType = require('./ListModel');

        MemberList.prototype.viewType = require('./ListView');

        MemberList.prototype.initBehavior = function () {
            var action = this;
            this.view.on('removeClicked', function (e) {
                alert('ID:' + e.id + 'has been removed 啊假假地～');
            });
            this.view.on('modifyClicked', function (e) {
                action.redirect('/member/modify~id=' + e.id);
            });
        };

        require('er/util').inherits(MemberList, Action);
        return MemberList;
    }
);