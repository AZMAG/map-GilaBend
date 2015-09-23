module.exports = function(grunt){

    "use strict";

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({

        pkg: grunt.file.readJSON("package.json"),
        bannercss: '/*!\n' +
                        '*@concat.min.css\n' +
                        '*@CSS Document for Wickenburg Zoning Map Viewer @ MAG\n' +
                        '*@For Production\n' +
                        '*@<%= pkg.name %> - v<%= pkg.version %> | <%= grunt.template.today("mm-dd-yyyy") %>\n' +
                        '*@author <%= pkg.author %>\n' +
                    '*/\n',

        bannerjs: '/*!\n' +
                        '*@main.min.js\n' +
                        '*@JavaScript document for Wickenburg Zoning Map Viewer @ MAG\n' +
                        '*@For Production\n' +
                        '*@<%= pkg.name %> - v<%= pkg.version %> | <%= grunt.template.today("mm-dd-yyyy") %>\n' +
                        '*@author <%= pkg.author %>\n' +
                    '*/\n',

        jshint: {
            files: ["js/config.js", "js/main.js"],
                options: {
                    // strict: true,
                    sub: true,
                    quotmark: "double",
                    trailing: true,
                    curly: true,
                    eqeqeq: true,
                    unused: true,
                    scripturl: true,    // This option defines globals exposed by the Dojo Toolkit.
                    dojo: true,        // This option defines globals exposed by the jQuery JavaScript library.
                    jquery: true,     // Set force to true to report JSHint errors but not fail the task.
                    force: true,
                    reporter: require("jshint-stylish-ex")
                }
        },

        uglify: {
            options: {
                // add banner to top of output file
                banner: '<%= bannerjs %>\n'
            },
            build: {
                files: {
                    "js/main.min.js": ["js/main.js"],
                }
            }
        },

        cssmin: {
            add_banner: {
                options: {
                // add banner to top of output file
                    banner: '/* <%= pkg.name %> - v<%= pkg.version %> | <%= grunt.template.today("mm-dd-yyyy") %> */\n'
                },
                files: {
                    "css/main.min.css": ["css/main.css"],
                    "css/normalize.min.css": ["css/normalize.css"],
                    "css/bootstrapmap.min.css": ["css/bootstrapmap.css"]
                }
            }
        },

        concat: {
            options: {
              stripBanners: true,
              banner: '<%= bannercss %>\n'
            },
            dist: {
              src: ["css/normalize.min.css", "css/bootstrapmap.min.css", "css/main.min.css"],
              dest: 'css/concat.min.css'
            }
        },

        watch: {
          scripts: {
            files: ["js/main.js", "js/config.js", "Gruntfile.js"],
            tasks: ["jshint"],
            options: {
              spawn: false,
              interrupt: true,
            },
          },
        },

    });

    // this would be run by typing "grunt test" on the command line
    grunt.registerTask("work", ["jshint"]);
    grunt.registerTask("build", ["uglify", "cssmin", "concat"]);

    grunt.registerTask("buildcss", ["cssmin", "concat"]);
    grunt.registerTask("buildjs", ["uglify"]);

    // the default task can be run just by typing "grunt" on the command line
    grunt.registerTask("default", []);

};

// ref
// http://coding.smashingmagazine.com/2013/10/29/get-up-running-grunt/
// http://csslint.net/about.html
// http://www.jshint.com/docs/options/

