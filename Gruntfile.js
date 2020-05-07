module.exports = function (grunt) {

    "use strict";

    const fileHash = '<%= pkg.version %>' + '.' + '<%= grunt.template.today("yyyymmddHHMM") %>';
    const jsFilePath = `dist/js/main.${fileHash}.js`;
    const jsName = `js/scripts.js?v=${fileHash}`;
    const cssName = `href="css/master.min.css?v=${fileHash}"`;

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({

        pkg: grunt.file.readJSON("package.json"),

        bannercss: '/*! ========================================================================\n' +
            ' * Maricopa Association of Governments\n' +
            ' * CSS files for MAG Gila Bend Map Viewer\n' +
            ' * @concat.min.css | version | <%= pkg.version %>\n' +
            ' * Production | <%= pkg.date %>\n' +
            ' * http://geo.azmag.gov/maps/gilabend/\n' +
            ' * MAG Gila Bend Viewer\n' +
            ' * ==========================================================================\n' +
            ' * Copyright 2016 MAG\n' +
            ' * Licensed under MIT\n' +
            ' * ========================================================================== */\n',

        bannerjs: '/*! ========================================================================\n' +
            ' * Maricopa Association of Governments\n' +
            ' * JavaScript files for MAG Gila Bend Map Viewer\n' +
            ' * @main.min.js | version | <%= pkg.version %>\n' +
            ' * Production | <%= pkg.date %>\n' +
            ' * http://geo.azmag.gov/maps/gilabend/\n' +
            ' * MAG Gila Bend Map Viewer\n' +
            ' * ==========================================================================\n' +
            ' * Copyright 2016 MAG\n' +
            ' * Licensed under MIT\n' +
            ' * ========================================================================== */\n',

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
                scripturl: true, // This option defines globals exposed by the Dojo Toolkit.
                dojo: true, // This option defines globals exposed by the jQuery JavaScript library.
                jquery: true, // Set force to true to report JSHint errors but not fail the task.
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
                    "dist/js/main.min.js": ["dist/js/main.js"],
                    "dist/js/config.min.js": ["dist/js/config.js"],
                    "dist/js/vendor/bootstrapmap.min.js": ["dist/js/vendor/bootstrapmap.js"],
                    "dist/js/vendor/plugins.min.js": ["dist/js/vendor/plugins.js"]
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
                    "dist/css/main.min.css": ["dist/css/main.css"],
                    "dist/css/normalize.min.css": ["dist/css/normalize.css"],
                    "dist/css/bootstrapmap.min.css": ["dist/css/bootstrapmap.css"]
                }
            }
        },

        concat: {
            options: {
                stripBanners: true,
                banner: '<%= bannercss %>\n'
            },
            dist: {
                src: ["dist/css/normalize.min.css", "dist/css/bootstrapmap.min.css", "dist/css/main.min.css"],
                dest: 'dist/css/concat.min.css'
            }
        },

        toggleComments: {
            customOptions: {
                options: {
                    removeCommands: true
                },
                files: {
                    "dist/index.html": "src/index.html",
                    "dist/js/main.js": "src/js/main.js"

                }
            }
        },

        clean: {
            build: {
                src: ["dist/"]
            },
            js: ["dist/js/*.js", "!dist/js/*.min.js"],
            jsv: ["dist/js/vendor/*.js", "!dist/js/vendor/*.min.js"],
            css: ["dist/css/*.css", "!dist/css/concat.min.css"]
        },

        copy: {
            build: {
                cwd: "src/",
                src: ["**"],
                dest: "dist/",
                expand: true
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

        replace: {
            update_Meta: {
                src: ["src/index.html", "src/js/config.js", "src/humans.txt", "src/LICENSE", "LICENSE", "README.md"],
                overwrite: true, // overwrite matched source files
                replacements: [{
                    // html pages
                    from: /(<meta name="revision-date" content=")[0-9]{4}-[0-9]{2}-[0-9]{2}(">)/g,
                    to: '<meta name="revision-date" content="' + '<%= pkg.date %>' + '">',
                }, {
                    // html pages
                    from: /(<meta name="version" content=")([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))(">)/g,
                    to: '<meta name="version" content="' + '<%= pkg.version %>' + '">',
                }, {
                    // html pages - build-info
                    from: /(<meta name="build-info" content=")([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))(?:\.)(\d{12})(">)/g,
                    to: '<meta name="build-info" content="' + '<%= pkg.version %>' + '.' + '<%= grunt.template.today("yyyymmddHHMM") %>' + '">',
                }, {
                    // config.js
                    from: /(v)([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))( \| )[0-9]{4}-[0-9]{2}-[0-9]{2}/g,
                    to: 'v' + '<%= pkg.version %>' + ' | ' + '<%= pkg.date %>',
                }, {
                    // config.js
                    from: /(copyright = ")[0-9]{4}/g,
                    to: 'copyright = "' + '<%= pkg.copyright %>',
                }, {
                    // humans.txt
                    from: /(Version\: v)([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))/g,
                    to: "Version: v" + '<%= pkg.version %>',
                }, {
                    // humans.txt
                    from: /(Last updated\: )[0-9]{4}-[0-9]{2}-[0-9]{2}/g,
                    to: "Last updated: " + '<%= pkg.date %>',
                }, {
                    // README.md
                    from: /(#### version )([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))/g,
                    to: "#### version " + '<%= pkg.version %>',
                }, {
                    // README.md
                    from: /(`Updated: )[0-9]{4}-[0-9]{2}-[0-9]{2}/g,
                    to: "`Updated: " + '<%= pkg.date %>',
                }, {
                    // LICENSE
                    from: /(Copyright \(c\) )[0-9]{4}/g,
                    to: "Copyright (c) " + "<%= pkg.copyright %>",
                }]
            }
        }

    });

    // this would be run by typing "grunt test" on the command line
    grunt.registerTask("work", ["jshint"]);
    // grunt.registerTask("build", ["replace", "uglify", "cssmin", "concat"]);

    grunt.registerTask("buildcss", ["cssmin", "concat"]);
    grunt.registerTask("buildjs", ["uglify"]);

    grunt.registerTask("build", ["clean:build", "replace", "copy", "toggleComments", "uglify", "cssmin", "concat", "clean:js", "clean:jsv", "clean:css"]);

    // the default task can be run just by typing "grunt" on the command line
    grunt.registerTask("default", []);

};

// ref
// http://coding.smashingmagazine.com/2013/10/29/get-up-running-grunt/
// http://csslint.net/about.html
// http://www.jshint.com/docs/options/