<!-- target: memberForm -->
<form class="edit-form" data-ui-type="Form" data-ui-id="form" data-ui-submitButton="submitButton">
    <div class="form-body">
        <div class="form-row">
            <div class="form-key">姓名：</div>
            <div class="form-value">
                <input data-ui-type="TextBox" data-ui-id="name" data-ui-name="name" data-ui-mode="text" data-ui-value="${detail.name}"/>
            </div>
        </div>
        <div class="form-row">
            <div class="form-key">性别：</div>
            <div class="form-value">
                <div data-ui-type="BoxGroup" data-ui-name="gender" data-ui-id="gender" data-ui-box-type="radio" data-ui-value="${detail.gender}">
                    <ul>
                        <li>
                            <input type="radio" value="1" title="${genderMap.1}" name="gender"/>
                        </li>
                        <li>
                            <input type="radio" value="0" title="${genderMap.0}" name="gender"/>
                        </li>
                        <li>
                            <input type="radio" value="2" title="${genderMap.2}" name="gender"/>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="form-row">
            <div class="form-key">生日：</div>
            <div class="form-value">
                <div data-ui-type="Calendar" data-ui-id="birthday"
                 data-ui-name="birthday" data-ui-value="@detail.birthday"></div>
            </div>
        </div>
        <div class="form-row">
            <div class="form-key">余额：</div>
            <div class="form-value">
                <input data-ui-type="TextBox" data-ui-id="amount"
                 data-ui-name="amount" data-ui-mode="text"
                 data-ui-value="@detail.balance" />
            </div>
        </div>
    </div>
    <div class="submit-row">
        <div class="form-row">
            <div class="form-value">
                <div data-ui-type="Button" data-ui-id="submitButton"
                 data-ui-skin="spring">保存</div>
                <div data-ui-type="Button"
                 data-ui-id="cancelButton">取消</div>
            </div>
        </div>
    </div>
</form>