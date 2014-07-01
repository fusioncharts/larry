/**
 * Core packaging controller
 */
module.exports = {

    /**
     * Get CLI parameters from commander and invoke proper scripts
     */
    cli: function (program) {

        var schemaFile = __dirname+"/larry.schema.json",
            fs = require("fs"),
            path = require("path"),
            schema = fs.readFileSync(path.resolve(schemaFile)).toString(),
            Larry = require("./lib.js"),
            package,
            componentsVerificationCode,
            packagesVerificationCode,
            packagingStatus,
            config;

        // Make --config mandatory
        if (!program.config) {
            console.log("Please provide path to configuration file with '--config <path>'.");
            process.exit(1);
        }

        // Load config file data
        try {
            config = fs.readFileSync(path.resolve(program.config)).toString();
            config = JSON.parse(config);
        }
            // If config file is not found, or cannot be parsed, throw error and stop execution
        catch (err) {
            console.log(program);
            throw new Error("Could not parse JSON config file: " + err);
        }

        //Check if options.input and options.output parameters are passed as arguments. This will override config options in the larry JSON config file

        if(program['options.input']){
            config.options.input = (program['options.input']).toString();
        }

        if(program['options.output']){
            config.options.output = (program['options.output']).toString();
        }


        //Initializing objects

        console.log("=>Packaging started...");

        package = new Larry(config, schema);

        //Constructor verifies if the configuration is conforming to the schema in lib/package.conf.schema

        switch(package.constructorCode){
            case 0:
                console.log("=>Success: Config validation and verification passed");
                break;
            case 1:
                console.log("=>Error: Config validation and verification not passed");
                process.exit(1);
                break;
            case 2:
                console.log("=>Error: Config options.input is not a valid path");
                process.exit(1);
                break;
            case 3:
                console.log("=>Error: Config options.output is not a valid path");
                process.exit(1);
                break;
            default:
                console.log("=>Exiting: Unknown error");
        }


        //Create an instance of the larry

        //Start verifying components and packages

        componentsVerificationCode = package.verifyComponents();

        switch(componentsVerificationCode){
            case 0:
                console.log("=>Success: All components are verified");
                break;
            case 1:
                console.log("=>Error: One of the component do not have a valid name");
                process.exit(1);
                break;
            case 2:
                console.log("=>Error: source path do not exist for a component");
                process.exit(1);
                break;
            case 3:
                console.log("=>Error: Some components names are reused");
                process.exit(1);
                break;
            case 4:
                console.log("=>Error: include and destination count do not match for a component");
                process.exit(1);
                break;
        }

        packagesVerificationCode = package.verifyPackages();

        switch(packagesVerificationCode){
            case 0:
                console.log("=>Success: All packages are verified");
                break;
            case 1:
                console.log("=>Error: One of the packages do not have a valid name");
                process.exit(1);
                break;
            case 2:
                console.log("=>Error: One of the packages do not have valid components");
                process.exit(1);
                break;
            case 3:
                console.log("=>Error: Duplicate package names found");
                process.exit(1);
                break;
        }


        packagingStatus = package.startPackaging();

        switch(packagingStatus){
            case 0:
                console.log("=>Success: Packaging is done");
                break;
            case 1:
                console.log("=>Error: Package was not created");
                process.exit(1);
                break;
        }

    }
};

