#!/usr/bin/env node

//Declaring fs, shell and self(used to store config and schema) variables to be accessed globally.

var fs = require("fs"),
    wrench = require("wrench"),
    Zip = require("adm-zip"),
    path = require("path"),
    sys = require("sys"),
    exec = require("child_process").exec,
    projectPath =path.resolve(),
    source,
    destination,
    schemaValidator = require("JSV").JSV,
    schemaValidatorEnv = schemaValidator.createEnvironment(),
    schemaValidatorLog,
    self,
    componentsList = [],
    packagesList= [],
    constructorCode;

//Main class "larry" definition.

var larry = function(config, schema) {
    /*
     * Constructor method
     * Things this will do:
     * 1. Report schema validation errors
     * 2. Verify if the input path is valid
     * 3. Verify if the output path is valid
     *
     */

    self = this;

    //Initializing config and schema

    self.config = JSON.parse(config);
    self.schema = JSON.parse(schema);

    schemaValidatorLog = schemaValidatorEnv.validate(self.config,self.schema);

    //1. Reporting schema validation results

    if (schemaValidatorLog.errors.length === 0) {
        console.log("->Success: Basic schema validation passed");
    }
    else {
        console.log("->Error: Basic schema validation not passed");
        console.log(schemaValidatorLog.errors);

        //Exit code 1, indicating error and stopping further execution

        constructorCode = 1;
        this.constructorCode = constructorCode;
        this.constructorCode = constructorCode;
        return constructorCode;
    }

    //2. Checking if input path exists

    if(fs.existsSync(path.join(projectPath,self.config.options.input))){
        console.log("->Success: Valid input path "+path.join(projectPath,self.config.options.input));
    }
    else{
        console.log("->Error: Invalid input path "+projectPath+"/"+self.config.options.input);
        constructorCode = 2;
        this.constructorCode = constructorCode;
        return constructorCode;
    }

    //3. Checking if output path exists

    if(fs.existsSync(path.join(projectPath,self.config.options.output))){
        console.log("->Success: Valid output path "+path.join(projectPath,self.config.options.output));
    }
    else{
        console.log("->Error: Invalid output path "+path.join(projectPath,self.config.options.output));
        constructorCode = 3;
        this.constructorCode = constructorCode;
        return constructorCode;
    }
    constructorCode = 0;
    this.constructorCode = constructorCode;
    return constructorCode;
};

//API definitions for the class "larry"

larry.prototype = {
    verifyComponents: function() {

        /*
         * Things this will do:
         * 1. Verify: If all components names are not null/undefined
         * 2. Verify: If the paths of source and destination exist
         * 3. Verify: All the names are unique using Array.indexOf() method which returns the index -1 of does not exist
         * 4. Verify: If the count of include and destination count is same
         * 5. Verify: If include and destination folders exists
         *
         */

        var components = self.config.components,
            component,
            componentIndex,
            componentIterator;

        for(componentIndex in components){

            component = components[componentIndex];

            //1. Verifying if package names are valid

            if(component.name !== "" && component.name !== undefined){
                console.log("->Success: Package name is valid for "+component.name);
            }
            else{
                console.log("->Error: One of the packages do not have a valid name");
                return 1;
            }

            //2. Verifying include paths exist and component destinations will be created inside output/packageName/ folder.

            for(componentIterator in component.include){
                if(fs.existsSync(path.resolve(self.config.options.input,component.include[componentIterator]))){
                    console.log("->Success: Valid source path "+path.resolve(self.config.options.input,component.include[componentIterator]));
                }
                else{
                    console.log("->Error: Invalid source path "+path.resolve(self.config.options.input,component.include[componentIterator]));
                    return 2;
                }
            }

            //3. Verifying if the component names are all unique

            if(component.name !== undefined && component.name !== "" && (componentsList.indexOf(component.name) == -1)){
                componentsList.push(component.name);
            }
            else{
                console.log("->Error: Invalid/Duplicate component name found: "+component.name);
                return 3;
            }

            //4. Verifying the include and destination counts

            if(component.include.length == component.destination.length){
                console.log("->Success: Count of include and destination match for the component "+component.name);
            }
            else{
                console.log("->Error: Count of include and destination do not match for the component "+component.name);
                return 4;
            }

        }

        console.log("All component names are valid");
        console.log("All component include and destination paths exist");
        console.log("All component names are unique");

        //Return 0 for successful verification of components

        return 0;

    },

    verifyPackages: function() {

        /*
         * Things this will do:
         * 1. Verify: If the packages names are not null/undefined
         * 2. Verify: If the packages have valid component names
         * 3. Verify: If there are any duplicate/empty package names
         *
         */

        var packages = self.config.packages,
            package,
            packageIndex,
            packageIterator;

        for(packageIndex in packages){

            package = packages[packageIndex];

            //1. Verifying if package names are valid

            if(package.name !== "" && package.name !== undefined){
                console.log("->Success: Package name is valid for "+package.name);
            }
            else{
                console.log("->Error: One of the packages do not have a valid name");
                return 1;
            }



            //2. Verifying if packages contain valid component names

            for(packageIterator in package.components){
                if(componentsList.indexOf(package.components[packageIterator]) !== -1){
                    console.log("->Success: Valid component found in "+package.name);
                    console.log("Component name: "+package.components[packageIterator]);
                }
                else{
                    console.log("->Error: Valid component not found in "+package.name);
                    console.log("Also make sure component name is not empty");
                    console.log("Component name: "+package.components[packageIterator]);
                    return 2;
                }
            }

            //3. Verifying if the packages names are all unique and not empty

            if(packagesList.indexOf(package.name) == -1){
                packagesList.push(package.name);
            }
            else{
                console.log("->Error: Duplicate package name found: "+package.name);
                console.log("Also make sure package name is not empty");
                return 3;
            }

        }
        console.log("All package names are valid");
        console.log("All packages have valid components");
        console.log("All packages names are unique");

        //Return 0 for successful verification of packages

        return 0;

    },

    startPackaging: function() {

        /*
         * Things this will do:
         *
         * - Picks only enabled packages and if a disabled component is used then exit
         * - 1. Create output/package folder
         * - Create an array of files with the exclude/include and patterns for all the components for the package with input folder appended
         * - Check if all the included and excluded files in the array exist on the filesystem
         * - Loop through the array and copy each file to the destination(output/package/(component.include relative path name))
         * - If archive is true for a package then zip with defaults or leave it as it is
         * - If archive is true remove the package folder
         *
         */

        var packages = self.config.packages,
            components = self.config.components,
            package,
            packageIndex,
            componentIterator,
            componentName,
            index,
            cpindex,
            componentRecursive,
            componentEnabled,
            excludePattern,
            includePattern,
            zipPackage,
            toExclude = [],
            destinationRoot,
            filterOptions = {},
            prepackageIndex,
            postPackageIndex;

        //Loop through enabled packages

        for(packageIndex in packages){
            package = packages[packageIndex];
            if(!(package.enabled)){
                continue;
            }

            //Executing pre packaging scripts
            var callback = function (error, stdout, stderr) {
                sys.print(stdout);
                sys.print(stderr);
                if (error !== null) {
                    console.log("->Error: Running prepackaging script "+path.join(package.prepackage[prepackageIndex])+" "+ error);
                    process.exit(1);
                }
            };

            if(Object.prototype.toString.call(package.prepackage) === "[object array]"){
                for(prepackageIndex in package.prepackage){
                    child = exec("./"+path.join(package.prepackage[prepackageIndex]), callback(error, stdout, stderr));
                }
            }

            console.log("Package: "+package.name);

            if(typeof package.archiveRoot === "undefined" || package.archiveRoot === ""){
                destinationRoot = path.join(self.config.options.output,package.name);
            }
            else {
                destinationRoot = path.join(self.config.options.output,package.name,package.archiveRoot);
            }


            for(componentIterator in package.components){
                componentName = package.components[componentIterator];

                //Loop through each component and it"s properties

                for (index in components) {
                    if (components[index].name == componentName) {
                        if(typeof components[index].enabled == "boolean"){
                            componentEnabled = components[index].enabled;
                        }
                        else{
                            componentEnabled = components[index].enabled;
                        }

                        if(typeof components[index].recursive == "boolean"){
                            componentRecursive = components[index].recursive;
                        }
                        else{
                            componentRecursive = components[index].recursive;
                        }

                        if(componentEnabled === false){
                            console.log("->Error: Disabled component "+components[index].name+" was used in the package "+package.name);
                            return 1;
                        }


                        if(components[index].excludePattern !== undefined){
                            excludePattern = components[index].excludePattern;
                        }

                        if(components[index].includePattern !== undefined){
                            includePattern = components[index].includePattern;
                        }

                        filterOptions = {
                            forceDelete: true,
                            excludeHiddenUnix: false,
                            preserveFiles: false,
                            preserveTimeStamps: false,
                            inflateSymlinks: false,
                            exclude: components[index].excludePattern === "" ? undefined : components[index].excludePattern
                        };

                        toExclude = components[index].exclude;

                        for(cpindex in components[index].include){
                            source = path.join(self.config.options.input,components[index].include[cpindex]);
                            destination = path.join(destinationRoot,components[index].destination[cpindex]);
                            wrench.mkdirSyncRecursive(destination);
                            source = path.resolve(source);
                            destination = path.resolve(destination);
                            wrench.copyDirSyncRecursive(source, destination, filterOptions);

                        }

                    }
                }
            }

            //Small logical block to check if packaging needs to be done, by default zipPackage is true if not specifically defined in options.

            if(typeof self.config.options.archive === "undefined"){
                if(typeof package.archive === "undefined"){
                    zipPackage = true;
                }
                else{
                    zipPackage = package.archive;
                }
            }
            else {
                if(typeof package.archive === "undefined"){
                    zipPackage = self.config.options.archive;
                }
                else{
                    zipPackage = package.archive;
                }
            }

            //Start zipping packages here

            if(typeof zipPackage !== "boolean"){
                process.exit(1);
                console.log("->Error: archive true/false option for package "+package.name+" is not valid");
            }
            if(zipPackage){
                var archive = new Zip();
                archive.addLocalFolder(path.resolve(self.config.options.output,package.name));
                archive.writeZip(path.resolve(self.config.options.output)+"/"+package.name+".zip");
                wrench.rmdirSyncRecursive(path.resolve(self.config.options.output,package.name));
                console.log("->Success: Package created. Package zipped "+package.name);
            }
            else {
                console.log("->Success: Package created. Not zipping "+package.name);
            }
        }

        //Executing post packaging scripts

        if(Object.prototype.toString.call(package.postpackage) === "[object array]"){
            for(postpackageIndex in package.postpackage){
                child = exec("./"+path.join(package.postpackage[prepackageIndex]), function (error, stdout, stderr) {
                    sys.print(stdout);
                    sys.print(stderr);
                    if (error !== null) {
                        console.log('->Error: Running prepackaging script '+path.join(package.postpackage[prepackageIndex])+" "+ error);
                        process.exit(1);
                    }
                });
            }
        }

        //Return 0 when packaging is done

        return 0;

    }


};

larry.prototype.constructor = larry;
module.exports = larry;