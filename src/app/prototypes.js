exports.extendModule = function(constructor) {
  constructor.prototype.maskCurrency = function() {
    return this.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };
};
