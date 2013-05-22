define(
    function (require) {
        require('er/tpl!./form.tpl');
        require('esui/Form');
        require('esui/Button');
        require('esui/TextBox');
        require('esui/BoxGroup');
        require('esui/Calendar');
        require('esui/Crumb');
        // css
        require('css!./common/css/form.css');

        var MemberType = require('./config').MemberType;


        var UIView = require('ef/UIView');

        function onSubmitHandle() {
            var form = this.get('form');
            var memberData = form.getData();
            this.fire('submitted', {data: memberData});
        }

        function MemberFormView() {
            UIView.apply(this, arguments);
        }

        MemberFormView.prototype.template = 'memberForm';

        MemberFormView.prototype.enterDocument = function () {
            UIView.prototype.enterDocument.apply(this, arguments);
            form = this.get('form');
            form.on('submit', onSubmitHandle.bind(this));
        };

        require('er/util').inherits(MemberFormView, UIView);
        return MemberFormView;
    }   
);