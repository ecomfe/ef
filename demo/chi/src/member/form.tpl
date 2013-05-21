<!-- target: memberForm -->
<form class="edit-form" data-ui-type="Form" data-ui-id="form" data-ui-submitButton="submitButton">
    <div class="form-body">
        <div class="form-row">
            <div class="form-key">姓名：</div>
            <div class="form-value">
                <input data-ui-type="TextBox" data-ui-id="name" data-ui-name="name" data-ui-mode="text" data-ui-value="@member.name" />
            </div>
        </div>
        <div class="form-row">
            <div class="form-key">性别：</div>
            <div class="form-value">
                <div data-ui-type="BoxGroup" data-ui-name="gender" data-ui-id="gender" data-ui-box-type="radio">
                    <ul>
                        <li>
                            <input type="radio" value="1" title="${genderMap.MALE}" name="gender"/>
                            <label for="framework-er">${genderMap.MALE}</label>
                        </li>
                        <li>
                            <input type="radio" value="0" title="${genderMap.FEMALE}" name="gender"/>
                            <label for="framework-esui">${genderMap.FEMALE}</label>
                        </li>
                        <li>
                            <input type="radio" value="2" title="${genderMap.SECRET}" name="gender"/>
                            <label for="framework-ef">${genderMap.SECRET}</label>
                        </li>
                    </ul>
                </div>

                <div data-ui-type="Calendar" data-ui-id="time"
                 data-ui-name="time" data-ui-value="${detail.time}"></div>
            </div>
        </div>
        <div class="form-row">
            <div class="form-key">谁：</div>
            <div class="form-value">
                <div data-ui-type="Select" data-ui-id="member"
                 data-ui-name="member" data-ui-datasource="@members"
                 data-value="@detail.member.id"></div>
            </div>
        </div>
        <div class="form-row">
            <div class="form-key">充值\支出：</div>
            <div class="form-value">
                <div data-ui-type="Select" data-ui-id="type"
                 data-ui-name="type" data-ui-datasource="@types"
                 data-value="@detail.type"></div>
            </div>
        </div>
        <div class="form-row">
            <div class="form-key">金额：</div>
            <div class="form-value">
                <input data-ui-type="TextBox" data-ui-id="amount"
                 data-ui-name="amount" data-ui-mode="text"
                 data-ui-value="@detail.amount" />
            </div>
        </div>
        <div class="form-row">
            <div class="form-key">备注：</div>
            <div class="form-value">
                <textarea data-ui-type="TextBox" data-ui-id="memo"
                 data-ui-name="memo" data-ui-mode="textarea"
                 data-ui-value=""></textarea>
            </div>
        </div>
    </div>
    <div class="submit-row">
        <div class="form-row">
            <div class="form-value">
                <div data-ui-type="Button" data-ui-id="submitButton"
                 data-ui-skin="spring">保存并继续</div>
                <div data-ui-type="Button"
                 data-ui-id="cancelButton">取消新建</div>
            </div>
        </div>
    </div>
</form>