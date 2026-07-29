Page.onReady = function () {
};

Page.calculate = function (depositedAt, maturedAt) {
    debugger
    return Math.min(100, Math.max(0, Math.round(((new Date() - new Date(depositedAt)) / (new Date(maturedAt) - new Date(depositedAt))) * 100)))
}
