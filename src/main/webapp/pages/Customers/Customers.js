Page.onReady = function() {
};

// Shared helper — reused by all section toggle handlers on this page
Page.toggleSection = function(variableName) {
    Page.Variables[variableName].dataSet.dataValue = !Page.Variables[variableName].dataSet.dataValue;
};

// Toggle handler for the Search section
Page.toggleSearch = function($event, widget) {
    Page.toggleSection('showSearch');
};

// Hide handler for the Search section (called by the up-arrow button inside search header)
Page.hideSearch = function($event, widget) {
    Page.Variables.showSearch.dataSet.dataValue = false;
};

// Search form submission — QueryVariable doesn't support server-side filter expressions like LiveVariable.
// Reload the variable — filtering will be applied client-side via table search if needed.
Page.submitSearch = function() {
    // QueryVariable doesn't support server-side filter expressions like LiveVariable.
    // Reload the variable — filtering will be applied client-side via table search if needed.
    Page.Variables.customersQueryData.invoke();
};

// Navigate to CustomerDetails page passing the selected row's customerId as a page param
// Handles both $row (plain object from table column template) and row (object with getProperty method)
Page.goToCustomerDetails = function($event, row) {
    var customerId = row && (row.getProperty ? row.getProperty('customerid') : row.customerid);
    App.Actions.goToPage_CustomerDetails.invoke({
        data: { customerId: customerId }
    });
};

// Clear form — reset inputs and reload full unfiltered list via QueryVariable
Page.clearSearch = function() {
    if (Page.Widgets.ff_firstName)      Page.Widgets.ff_firstName.datavalue      = '';
    if (Page.Widgets.ff_lastName)       Page.Widgets.ff_lastName.datavalue       = '';
    if (Page.Widgets.ff_branch)         Page.Widgets.ff_branch.datavalue         = 'All';
    if (Page.Widgets.ff_accountType)    Page.Widgets.ff_accountType.datavalue    = 'All';
    if (Page.Widgets.ff_activationFrom) Page.Widgets.ff_activationFrom.datavalue = '';
    if (Page.Widgets.ff_activationTo)   Page.Widgets.ff_activationTo.datavalue   = '';
    if (Page.Widgets.ff_accountStatus)  Page.Widgets.ff_accountStatus.datavalue  = '';
    Page.Variables.customersQueryData.invoke();
};
