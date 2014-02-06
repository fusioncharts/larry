/**
 * Core packaging controller
 */
var fs = require("fs"),
    path = require("path");

module.exports = {

    /**
     * Get CLI parameters from commander and invoke proper scripts
     */
    cli: function (program) {
        var filedata;

        // Make --config mandatory
        if (!program.config) {
            console.log("Please provide path to configuration file with '--config <path>'.");
            process.exit(1);
        }

        // Load config file data
        try {
            filedata = JSON.parse(fs.readFileSync(path.resolve(program.config)).toString());
        }
        // If config file is not found, or cannot be parsed, throw error and stop execution
        catch (err) {
            throw new Error("Could not parse JSON config file: " + err);
        }

        // TODO: Invoke proper functions

    }
};

