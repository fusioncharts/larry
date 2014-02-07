#!/usr/bin/env node

//Initializing objects

var schemaFile = __dirname+"/../lib/larry.schema.json",
    configFile = process.argv[2] || __dirname+"/../config/takeaway.json",
    fs = require("fs"),
    config = fs.readFileSync(configFile).toString(),
    schema = fs.readFileSync(schemaFile).toString(),
    //require() needs relative path from the script inclusion
    takeaway = require("../lib/core.js"),
    package,
    componentsVerificationCode,
    packagesVerificationCode,
    packagingStatus;

console.log("=>Packaging started...");

package = new takeaway(config, schema);

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


//Create an instance of the takeaway class



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
        console.log("=>Error: source/destination path do not exist for a component");
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