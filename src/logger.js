var packageJSON = require("../package.json"),
	ascli = require("ascli").app(packageJSON.name);

module.exports = {
	quiet: false,

	log: function (message) {
		if (global.loggerIsQuiet) {
			return;
		}
		console.log(message);
	},

	error: function (message) {
		ascli.fail(message);
	}
};