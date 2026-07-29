Page.onReady = function () {
    var params = Page.pageParams || {};
    var d = Page.Variables.depositFormData.dataSet.dataValue || {};
    if (params.customerId) { d.customerId = params.customerId; }
    if (params.firstName) { d.firstName = params.firstName; }
    if (params.lastName) { d.lastName = params.lastName; }
    Page.Variables.depositFormData.dataSet.dataValue = d;
    if (params.customerId) {
        Page.Variables.svcListAccounts.invoke();
        Page.Variables.svcGetAccountDetailsByCustomer.invoke({},
            function (data) {
                var content = data && data.content;
                if (content && content.length > 0) {
                    var account = content[0];
                    var fd = Page.Variables.depositFormData.dataSet.dataValue || {};
                    fd.branch = account.branchName || fd.branch;
                    fd.branchCode = account.branchCode || fd.branchCode;
                    fd.accountType = account.type || fd.accountType;
                    fd.accountNumber = account.accountNumber || fd.accountNumber;
                    fd.relationshipManager = account.managerName || fd.relationshipManager;
                    Page.Variables.depositFormData.dataSet.dataValue = fd;
                }
            }
        );
    }
};

/**
 * Helper: find a branch object from the loaded list by its id.
 */
function getBranchById(id) {
    var list = Page.Variables.svcListBranches.dataSet || [];
    for (var i = 0; i < list.length; i++) {
        if (String(list[i].id) === String(id)) return list[i];
    }
    return null;
}

Page.onBranchChange = function ($event, widget, newVal, oldVal) {
    var branch = getBranchById(newVal);
    var d = Page.Variables.depositFormData.dataSet.dataValue || {};
    d.branchId = newVal;
    d.branchCode = branch ? (branch.code || '') : '';
    Page.Variables.depositFormData.dataSet.dataValue = d;
};

Page.onSubBranchChange = function ($event, widget, newVal, oldVal) {
    var branch = getBranchById(newVal);
    var d = Page.Variables.depositFormData.dataSet.dataValue || {};
    d.subBranchId = newVal;
    d.subBranchName = branch ? (branch.name || '') : '';
    Page.Variables.depositFormData.dataSet.dataValue = d;
};

Page.onAppBranchChange = function ($event, widget, newVal, oldVal) {
    var branch = getBranchById(newVal);
    var d = Page.Variables.depositFormData.dataSet.dataValue || {};
    d.applicationBranchId = newVal;
    d.appBranchCode = branch ? (branch.code || '') : '';
    Page.Variables.depositFormData.dataSet.dataValue = d;
};

Page.onAccountNumberChange = function ($event, widget, newVal, oldVal) {
    if (!newVal) return;
    var accounts = Page.Variables.svcListAccounts.dataSet || [];
    var selected = null;
    for (var i = 0; i < accounts.length; i++) {
        if (String(accounts[i].accountNumber) === String(newVal)) {
            selected = accounts[i];
            break;
        }
    }
    if (!selected) return;
    Page.Variables.selectedAccount.dataSet.dataValue = selected;
    var d = Page.Variables.depositFormData.dataSet.dataValue || {};
    d.firstName = selected.firstName || '';
    d.lastName = selected.lastName || '';
    d.customerId = selected.customerId || (selected.customer && selected.customer.customerId) || '';
    Page.Variables.depositFormData.dataSet.dataValue = d;
    Page.Variables.svcGetBalance.invoke({
        inputFields: { accountNumber: newVal }
    }, function (data) {
        if (data) {
            Page.Variables.selectedBalance.dataSet.dataValue = data;
        }
    });
};

// Page.onAccountDetailsNext = function (widget, currentStep, stepIndex) {
//     return true;
// };

Page.onWizardDone = function ($event, widget, steps) {
    var d = Page.Variables.depositFormData.dataSet.dataValue || {};
    var acc = Page.Variables.selectedAccount.dataSet.dataValue || {};
    var bal = Page.Variables.selectedBalance.dataSet.dataValue || {};
    var termDeposit = Number(d.termDepositAmount) || 0;
    var rateOfInterest = 6.5;
    var maturityAmount = termDeposit + (termDeposit * rateOfInterest / 100);
    var now = new Date().toISOString().substring(0, 10);
    var maturedAt = d.maturityDate ? String(d.maturityDate).substring(0, 10) : now;
    var currentBalance = Number(bal.currentBalance) || 0;
    Page.Variables.svcCreateDeposit.invoke({
        inputFields: {
            accountId: acc.id || 0,
            termDeposit: termDeposit,
            rateOfInterest: rateOfInterest,
            maturityAmount: maturityAmount,
            depositedAt: now,
            maturedAt: maturedAt,
            depositStatus: 'ACTIVE',
            currentBalance: currentBalance,
            balanceId: bal.id || 0
        }
    });
};

Page.onWizardCancel = function ($event, widget) {
    Page.Variables.navToCustomerDetails.invoke();
};

Page.svcCreateDepositonSuccess = function (variable, data) {
    Page.Variables.notifySuccess.invoke();
    Page.Variables.navToCustomerDetails.invoke();
};

Page.svcCreateDepositonError = function (variable, data) {
    Page.Variables.notifyError.invoke();
};
Page.btnWizardNextClick = function ($event, widget) {
    console.log("red")
};
