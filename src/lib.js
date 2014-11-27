#!/usr/bin/env node

//Declaring fs, shell and self(used to store config and schema) variables to be accessed globally.

var fs = require("fs"),
    wrench = require("wrench"),
    Zip = require("archiver"),
    path = require("path"),
    logger = require("../src/logger.js"),
    projectPath = path.resolve(),
    source,
    destination,
    schemaValidator = require("JSV").JSV,
    schemaValidatorEnv = schemaValidator.createEnvironment(),
    schemaValidatorLog,
    self,
    componentsList = [],
    packagesList = [],
    constructorCode;

//Main class "larry" definition.

var larry = function (config, schema) {
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

    self.config = config;
    self.schema = JSON.parse(schema);

    schemaValidatorLog = schemaValidatorEnv.validate(self.config, self.schema);

    //1. Reporting schema validation results

    if (schemaValidatorLog.errors.length === 0) {
        logger.log("  ✔ ︎basic schema validation passed");
    }
    else {
        logger.log("  ✘ basic schema validation not passed");
        logger.log(schemaValidatorLog.errors);

        //Exit code 1, indicating error and stopping further execution

        constructorCode = 1;
        this.constructorCode = constructorCode;
        return constructorCode;
    }

    //2. Checking if input path exists

    if (fs.existsSync(path.join(projectPath, self.config.options.input))) {
        logger.log("  ✔ v input path " + path.join(projectPath, self.config.options.input));
    }
    else {
        logger.log("  ✘ invalid input path " + projectPath + "/" + self.config.options.input);
        constructorCode = 2;
        this.constructorCode = constructorCode;
        return constructorCode;
    }

    //3. Checking if output path exists

    if (fs.existsSync(path.join(projectPath, self.config.options.output))) {
        logger.log("  ✔ valid output path " + path.join(projectPath, self.config.options.output));
    }
    else {
        logger.log("  ✘ output path doesn't exist. Creating " + path.join(projectPath, self.config.options.output));
        wrench.mkdirSyncRecursive(path.join(projectPath, self.config.options.output), 0777);
    }
    constructorCode = 0;
    this.constructorCode = constructorCode;
    return constructorCode;
};

//API definitions for the class "larry"

larry.prototype = {
    verifyComponents: function () {

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

        for (componentIndex in components) {

            component = components[componentIndex];

            //1. Verifying if package names are valid

            if (component.name !== "" && component.name !== undefined) {
                logger.log("  ✔ Package name is valid for " + component.name);
            }
            else {
                logger.log("  ✘ One of the packages do not have a valid name");
                return 1;
            }

            //2. Verifying include paths exist and component destinations will be created inside output/packageName/ folder.

            for (componentIterator in component.include) {
                if (fs.existsSync(path.resolve(self.config.options.input, component.include[componentIterator]))) {
                    logger.log("  ✔ Valid source path " + path.resolve(self.config.options.input, component.include[componentIterator]));
                }
                else {
                    logger.log("  ✘ Invalid source path " + path.resolve(self.config.options.input, component.include[componentIterator]));
                    return 2;
                }
            }

            //3. Verifying if the component names are all unique

            if (component.name !== undefined && component.name !== "" && (componentsList.indexOf(component.name) == -1)) {
                componentsList.push(component.name);
            }
            else {
                logger.log("  ✘ Invalid/Duplicate component name found: " + component.name);
                return 3;
            }

            //4. Verifying the include and destination counts

            if (component.include.length == component.destination.length) {
                logger.log("  ✔ Count of include and destination match for the component " + component.name);
            }
            else {
                logger.log("  ✘ Count of include and destination do not match for the component " + component.name);
                return 4;
            }

        }

        logger.log("  ✔ all component names are valid");
        logger.log("  ✔ all component include and destination paths exist");
        logger.log("  ✔ all component names are unique");

        //Return 0 for successful verification of components

        return 0;

    },

    verifyPackages: function () {

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

        for (packageIndex in packages) {

            package = packages[packageIndex];

            //1. Verifying if package names are valid

            if (package.name !== "" && package.name !== undefined) {
                logger.log("  ✔ package name is valid for " + package.name);
            }
            else {
                logger.log("  ✘ One of the packages do not have a valid name");
                return 1;
            }


            //2. Verifying if packages contain valid component names

            for (packageIterator in package.components) {
                if (componentsList.indexOf(package.components[packageIterator]) !== -1) {
                    logger.log("  ✔ Valid component found in " + package.name);
                    logger.log("    Component name: " + package.components[packageIterator]);
                }
                else {
                    logger.log("  ✘ Valid component not found in " + package.name);
                    logger.log("    Also make sure component name is not empty");
                    logger.log("    Component name: " + package.components[packageIterator]);
                    return 2;
                }
            }

            //3. Verifying if the packages names are all unique and not empty

            if (packagesList.indexOf(package.name) == -1) {
                packagesList.push(package.name);
            }
            else {
                logger.log("  ✘ Duplicate package name found: " + package.name);
                logger.log("    Also make sure package name is not empty");
                return 3;
            }

        }

        logger.log("  ✔ all package names are valid");
        logger.log("  ✔ all packages have valid components");
        logger.log("  ✔ all packages names are unique");

        //Return 0 for successful verification of packages

        return 0;

    },

    startPackaging: function () {

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
            onArchive = function (output, packname) {
                return function () {
                    logger.log("  ✔ deleting " + output, packname);
                    wrench.rmdirSyncRecursive(path.resolve(output, packname));
                };
            },
            destinationFileDesc;


        //Loop through enabled packages

        for (packageIndex in packages) {
            package = packages[packageIndex];
            if (!(package.enabled)) {
                continue;
            }

            logger.log("  ✔ package: " + package.name);

            if (typeof package.archiveRoot === "undefined" || package.archiveRoot === "") {
                destinationRoot = path.join(self.config.options.output, package.name);
            }
            else {
                destinationRoot = path.join(self.config.options.output, package.name, package.archiveRoot);
            }


            for (componentIterator in package.components) {
                componentName = package.components[componentIterator];

                //Loop through each component and it"s properties

                for (index in components) {
                    if (components[index].name == componentName) {
                        if (typeof components[index].enabled == "boolean") {
                            componentEnabled = components[index].enabled;
                        }
                        else {
                            componentEnabled = components[index].enabled;
                        }

                        if (typeof components[index].recursive == "boolean") {
                            componentRecursive = components[index].recursive;
                        }
                        else {
                            componentRecursive = components[index].recursive;
                        }

                        if (componentEnabled === false) {
                            logger.log("  ✘ Disabled component " + components[index].name + " was used in the package " + package.name);
                            return 1;
                        }


                        if (components[index].excludePattern !== undefined) {
                            excludePattern = components[index].excludePattern;
                        }

                        if (components[index].includePattern !== undefined) {
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

                        for (cpindex in components[index].include) {
                            source = path.join(self.config.options.input, components[index].include[cpindex]);
                            destination = path.join(destinationRoot, components[index].destination[cpindex]);
                            if (fs.lstatSync(source).isDirectory()) {
                                wrench.mkdirSyncRecursive(destination);
                            }
                            else {
                                wrench.mkdirSyncRecursive(path.dirname(destination));
                                destinationFileDesc = fs.openSync(destination, "w");
                            }
                            source = path.resolve(source);
                            destination = path.resolve(destination);
                            if (fs.lstatSync(source).isDirectory()) {
                                wrench.copyDirSyncRecursive(source, destination, filterOptions);
                            }
                            else{
                                fs.writeFileSync(destination, fs.readFileSync(source));
                            }
                            fs.close(destinationFileDesc);
                        }

                    }
                }
            }

            //Small logical block to check if packaging needs to be done, by default zipPackage is true if not specifically defined in options.

            if (typeof self.config.options.archive === "undefined") {
                if (typeof package.archive === "undefined") {
                    zipPackage = true;
                }
                else {
                    zipPackage = package.archive;
                }
            }
            else {
                if (typeof package.archive === "undefined") {
                    zipPackage = self.config.options.archive;
                }
                else {
                    zipPackage = package.archive;
                }
            }

            //Start zipping packages here

            if (typeof zipPackage !== "boolean") {
                process.exit(1);
                logger.log("  ✘ archive true/false option for package " + package.name + " is not valid");
            }
            if (zipPackage) {
                var archive = new Zip("zip");
                var output = fs.createWriteStream(path.resolve(self.config.options.output) + "/" + package.name + ".zip");

                archive.on("end", onArchive(self.config.options.output, package.name));
                archive.pipe(output);
                archive.bulk([
                    { expand: true, cwd: path.resolve(self.config.options.output, package.name), src: ["**"]}
                ]);
                archive.finalize();
                logger.log("  ✔ package created and archived " + package.name);
            }
            else {
                logger.log("  ✔ package created (not archived) " + package.name);
            }
        }

        //Return 0 when packaging is done

        return 0;

    }


};

larry.prototype.constructor = larry;
module.exports = larry;

