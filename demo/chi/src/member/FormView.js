define(
    function (require) {
        require('er/tpl!./form.tpl');
        require('esui/Form');
        require('esui/Button');
        require('esui/TextBox');
        require('esui/BoxGroup');
        require('esui/Calendar');
        // css
        require('css!./common/css/form.css');

        var MemberType = require('./config').MemberType;


        var UIView = require('ef/UIView');

        function MemberFormView() {
            UIView.apply(this, arguments);
        }

        MemberFormView.prototype.template = 'memberForm';

        require('er/util').inherits(MemberFormView, UIView);
        return MemberFormView;
    }   
);