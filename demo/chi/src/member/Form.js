define(
    function(require) {
        var Action = require('er/Action');

        function MemberForm() {
            Action.apply(this, arguments);
        }

        function submit() {
        }

        MemberForm.prototype.modelType = require('./MemberFormModel');

        MemberForm.prototype.viewType = require('./MemberFormView');

        MemberForm.prototype.initBehavior = function() {
            //this.view.on('buy', require('er/util').bind(buyBook, this))
        };

        require('er/util').inherits(MemberForm, Action);

        return MemberForm;
    }
);