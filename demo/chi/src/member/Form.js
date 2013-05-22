define(
    function(require) {
        var Action = require('er/Action');

        function MemberForm() {
            Action.apply(this, arguments);
        }

        function submitHandle(e) {
            this.model.submitData(e.data).then(saveCallBack.bind(this));;
        }

        function cancelHandle(e) {
            this.redirect('/member/list');
        }

        function saveCallBack(response) {
            if (response.success === true) {
                this.redirect('/member/list');
            }
            else {
                alert('出错啦！');
            }
        }

        MemberForm.prototype.modelType = require('./FormModel');

        MemberForm.prototype.viewType = require('./FormView');

        MemberForm.prototype.initBehavior = function() {
            this.view.on('submitted', submitHandle.bind(this));
            this.view.on('canceled', cancelHandle.bind(this));
        };

        require('er/util').inherits(MemberForm, Action);

        return MemberForm;
    }
);