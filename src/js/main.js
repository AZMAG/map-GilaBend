/*! main.js | Gila Bend Zoning Website @ MAG */
require([
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/on",
    "dojo/parser",
    "dojo/query",
    "dojo/keys",
    "dojo/_base/array",
    "dojo/_base/Color",
    "dojo/_base/connect",
    "esri/sniff",
    "esri/map",
    "esri/SnappingManager",
    "esri/dijit/Measurement",
    "esri/dijit/Scalebar",
    "esri/dijit/HomeButton",
    "esri/dijit/LocateButton",
    "esri/dijit/Geocoder",
    "esri/dijit/Popup",
    "esri/graphic",
    "esri/geometry/Multipoint",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/FeatureLayer",
    "esri/layers/ImageParameters",
    "esri/dijit/Legend",
    "dijit/form/CheckBox",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "esri/dijit/BasemapToggle",
    "esri/dijit/PopupTemplate",
    "esri/InfoTemplate",
    "esri/dijit/Print",
    "esri/tasks/PrintTemplate",
    "esri/request",
    "esri/config",
    // <!-- comments:comment // -->
    "js/vendor/bootstrapmap.js",
    // <!-- endcomments -->
    // <!-- comments:uncomment // -->
    // "js/vendor/bootstrapmap.min.js",
    // <!-- endcomments -->
    "dojo/domReady!"
], function (dc, dom, on, parser, query, keys, arrayUtils, Color, connect, has, Map, SnappingManager, Measurement, Scalebar, HomeButton, LocateButton, Geocoder, Popup, Graphic, Multipoint, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, IdentifyTask, IdentifyParameters, ArcGISDynamicMapServiceLayer, FeatureLayer, ImageParameters, Legend, CheckBox, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, BasemapToggle, PopupTemplate, InfoTemplate, Print, PrintTemplate, esriRequest, esriConfig, BootstrapMap) {

    parser.parse();

    esri.config.defaults.io.proxyUrl = "proxy/proxy.ashx";
    esri.config.defaults.io.alwaysUseProxy = false;

    // add version and date to about.html, changed in config.js
    dom.byId("version").innerHTML = appConfig.Version;
    $(".copyright").text(appConfig.copyright);

    // add pdf links to window
    dom.byId("demLink").setAttribute("href", appConfig.demService);
    dom.byId("empLink").setAttribute("href", appConfig.empService);

    // var identifyParams;
    var tocLayers = [];
    var legendLayers = [];
    // line set up for measurement tool
    var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([0, 128, 255]), 3), null);
    // create a popup to replace the map's info window
    var fillSymbol3 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL,
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([0, 255, 255]), 2),
        new Color([0, 255, 255, 0.25]));
    var pointSymbol = new SimpleMarkerSymbol("circle", 26, null,
        new Color([0, 0, 0, 0.25]));

    var popup = new Popup({
        fillSymbol: fillSymbol3,
        // lineSymbol:
        markerSymbol: pointSymbol,
        visibleWhenEmpty: false,
        hideDelay: -1
    }, dc.create("div"));

    // create the map and specify the custom info window as the info window that will be used by the map
    // <!-- Get a reference to the ArcGIS Map class -->
    var map = BootstrapMap.create("mapDiv", {
        extent: new esri.geometry.Extent(appConfig.initExtent),
        basemap: "streets",
        minZoom: 11,
        maxZoom: 19,
        showAttribution: false,
        logo: false,
        infoWindow: popup,
        sliderPosition: "top-right",
        scrollWheelZoom: true
    });
    map.on("load", mapReady);

    var identifyHandler = map.on("click", executeIdentifyTask);
    // remove event listener on map close
    map.on("unload", executeIdentifyTask);
    var scalebar = new Scalebar({
        map: map,
        scalebarUnit: "english"
    });
    // create div for homebutton
    var homeButton = new HomeButton({
        map: map,
        visible: true //show the button
    }, dc.create("div", {
        id: "HomeButton"
    }, "mapDiv", "last"));
    homeButton._homeNode.title = "Original Extent";
    homeButton.startup();

    // create div for geolocatebutton
    var geoLocateButton = new LocateButton({
        map: map,
        visible: true,
    }, dc.create("div", {
        id: "LocateButton"
    }, "mapDiv", "last"));
    geoLocateButton.startup();

    //create toggle
    var toggle = new BasemapToggle({
        map: map,
        visible: true,
        basemap: "satellite"
    }, dc.create("div", {
        id: "BasemapToggle"
    }, "mapDiv", "last"));
    toggle.startup();

    // create geosearch widget
    var geocoder = new Geocoder({
        value: "",
        zoomScale: 10,
        maxLocations: 10,
        autoComplete: true,
        minCharacters: 1,
        arcgisGeocoder: {
            sourceCountry: "USA",
            placeholder: "530 W PIMA ST, Gila Bend, AZ",
            suffix: " Gila Bend, AZ"
            //searchExtent: {"xmin":-12621000,"ymin":3856151,"xmax":-12474241,"ymax":3928842,"spatialReference":{"wkid":102100}}
        },
        // geocoders:
        map: map
    }, "geosearch");
    geocoder.startup();
    geocoder.on("select", geocodeSelect);
    geocoder.on("findResults", geocodeResults);
    geocoder.on("clear", clearFindGraphics);
    // Print Functions for Print dijit
    //=================================================================================>
    // get print templates from the export web map task
    var printInfo = esriRequest({
        "url": appConfig.printUrl,
        "content": {
            "f": "json"
        }
    });
    printInfo.then(handlePrintInfo, handleError);

    function handlePrintInfo(resp) {
        var layoutTemplate, templateNames, mapOnlyIndex, templates;
        layoutTemplate = arrayUtils.filter(resp.parameters,
            function (param, idx) {
                return param.name === "Layout_Template";
            });
        if (layoutTemplate.length === 0) {
            console.log(
                "print service parameters name for templates must be \"Layout_Template\""
            );
            return;
        }
        templateNames = layoutTemplate[0].choiceList;
        // remove the MAP_ONLY template from the dropdown list
        mapOnlyRemove = arrayUtils.indexOf(templateNames,
            "MAP_ONLY");
        if (mapOnlyRemove > -1) {
            templateNames.splice(mapOnlyRemove, mapOnlyRemove);
        }
        // create a print template for each choice
        templates = arrayUtils.map(templateNames, function (ch) {
            var plate = new PrintTemplate();
            plate.layout = plate.label = ch;
            plate.format = "PDF";
            plate.layoutOptions = {
                // "authorText": "Made by:  MAG's JS API Team",
                // "copyrightText": "<copyright info here>",
                // "legendLayers": [],
                "titleText": "Gila Bend Zoning"
                // "scalebarUnit": "Miles"
            };
            return plate;
        });
        // create the print dijit
        printer = new Print({
            "map": map,
            "templates": templates,
            url: appConfig.printUrl
        }, dom.byId("printButton"));
        printer.startup();
    }

    function handleError(err) {
        console.log("Something broke: ", err);
    }
    //=================================================================================>
    // add layers to map
    var mpaBoundaryParms = new ImageParameters();
    mpaBoundaryParms.layerIds = [7];
    mpaBoundaryParms.layerOption = ImageParameters.LAYER_OPTION_SHOW;
    var mpaBoundary = map.addLayer(new ArcGISDynamicMapServiceLayer(appConfig.mainURL, {
        id: "mpaBoundary",
        imageParameters: mpaBoundaryParms,
        outFields: ["*"],
        visible: true,
        opacity: 0.65
    }));

    // Zoning Layer
    var gbZoningParms = new ImageParameters();
    gbZoningParms.layerIds = [6];
    gbZoningParms.layerOption = ImageParameters.LAYER_OPTION_SHOW;
    var gbZoning = map.addLayer(new ArcGISDynamicMapServiceLayer(appConfig.mainURL, {
        id: "gbZoning",
        imageParameters: gbZoningParms,
        outFields: ["*"],
        visible: true,
        opacity: 0.95
    }));

    // Boundary Layer
    var gbBoundary = map.addLayer(new FeatureLayer(appConfig.mainURL + "/4", {
        id: "gbBoundary",
        mode: FeatureLayer.MODE_ONDEMAND,
        visible: true,
        opacity: 1
    }));

    // MPA Boundary Layer
    // var mpaBoundary = map.addLayer(new FeatureLayer(appConfig.mainURL + "/7", {
    //     id: "mpaBoundary",
    //     mode: FeatureLayer.MODE_ONDEMAND,
    //     visible: true,
    //     opacity: .45
    // }));



    // Floodways Layer
    var gbFloodParms = new ImageParameters();
    gbFloodParms.layerIds = [1];
    gbFloodParms.layerOption = ImageParameters.LAYER_OPTION_SHOW;
    var gbFlood = map.addLayer(new ArcGISDynamicMapServiceLayer(appConfig.mainURL, {
        id: "gbFlood",
        imageParameters: gbFloodParms,
        outFields: ["*"],
        visible: false,
        opacity: 0.65
    }));

    // Pending Floodways Layer
    var gbPendFloodParms = new ImageParameters();
    gbPendFloodParms.layerIds = [2];
    gbPendFloodParms.layerOption = ImageParameters.LAYER_OPTION_SHOW;
    var gbPendFlood = map.addLayer(new ArcGISDynamicMapServiceLayer(appConfig.mainURL, {
        id: "gbPendFlood",
        imageParameters: gbPendFloodParms,
        outFields: ["*"],
        visible: false,
        opacity: 1
    }));

    // Parcels Layer
    var gbParcelsParms = new ImageParameters();
    gbParcelsParms.layerIds = [3];
    gbParcelsParms.layerOption = ImageParameters.LAYER_OPTION_SHOW;
    var gbParcels = map.addLayer(new ArcGISDynamicMapServiceLayer(appConfig.mainURL, {
        id: "gbParcels",
        imageParameters: gbParcelsParms,
        outFields: ["*"],
        visible: false,
        opacity: 1
    }));

    // Solar Field Layer
    var gbSolarParms = new ImageParameters();
    gbSolarParms.layerIds = [5];
    gbSolarParms.layerOption = ImageParameters.LAYER_OPTION_SHOW;
    var gbSolar = map.addLayer(new ArcGISDynamicMapServiceLayer(appConfig.mainURL, {
        id: "gbSolar",
        imageParameters: gbSolarParms,
        outFields: ["*"],
        visible: false,
        opacity: 1
    }));



    // Addresses Layer
    var addressContent = "<strong>${EMPNAME}</strong>" + "${TA_ADDRESS}<br>";
    var addressTemplate = new InfoTemplate("Address", addressContent);
    var gbAddress = map.addLayer(new FeatureLayer(appConfig.mainURL + "/0", {
        id: "gbAddress",
        visible: false,
        opacity: 1,
        mode: FeatureLayer.MODE_ONDEMAND,
        infoTemplate: addressTemplate,
        outFields: ["*"]
    }));

    // Measurement Tool
    //=================================================================================>
    var measurement = new Measurement({
        map: map,
        lineSymbol: sfs
    }, dom.byId("measurementDiv"));
    measurement.on("measure-start", function (evt) {
        map.setInfoWindowOnClick(false);
        //disablepopup();
    });
    measurement.on("measure-end", function (evt) {
        map.setInfoWindowOnClick(true);
    });
    measurement.startup();

    function killPopUp() {
        var toolName = this.dojoAttachPoint;
        var activeTool = measurement[toolName].checked;
        if (activeTool === true) {
            // kill the popup
        }
        if (activeTool !== true) {
            // turn popups back on
        }
    }

    // TOC Layers
    //=================================================================================>
    tocLayers.push({
        layer: gbBoundary,
        id: "gbBoundary",
        title: "Incorporated Area"
    });
    tocLayers.push({
        layer: mpaBoundary,
        id: "mpaBoundary",
        title: "Municipal Planning Area"
    });
    tocLayers.push({
        layer: gbFlood,
        id: "gbFlood",
        title: "Flood Zone"
    });
    tocLayers.push({
        layer: gbPendFlood,
        id: "gbPendFlood",
        title: "Pending Flood Zone"
    });
    tocLayers.push({
        layer: gbSolar,
        id: "gbSolar",
        title: "Solar Field Overlay"
    });
    tocLayers.push({
        layer: gbZoning,
        id: "gbZoning",
        title: "Zoning"
    });
    tocLayers.push({
        layer: gbAddress,
        id: "gbAddress",
        title: "Address Points"
    });
    tocLayers.push({
        layer: gbParcels,
        id: "gbParcels",
        title: "Parcels"
    });

    //Add Layers to Legend
    legendLayers.push({
        layer: gbBoundary,
        id: "gbBoundary",
        title: "Town Boundary"
    });
    legendLayers.push({
        layer: mpaBoundary,
        id: "mpaBoundary",
        title: "Municipal Planning Area"
    });
    legendLayers.push({
        layer: gbFlood,
        id: "gbFlood",
        title: "Flood Zone"
    });
    legendLayers.push({
        layer: gbPendFlood,
        id: "gbPendFlood",
        title: "Pending Flood Zone"
    });
    legendLayers.push({
        layer: gbSolar,
        id: "gbSolar",
        title: "Solar Field Overlay"
    });
    legendLayers.push({
        layer: gbParcels,
        id: "gbParcels",
        title: "Parcels"
    });
    legendLayers.push({
        layer: gbAddress,
        id: "gbAddress",
        title: "Address Points"
    });
    legendLayers.push({
        layer: gbZoning,
        id: "gbZoning",
        title: "Zoning"
    });


    // create legend dijit
    var legend = new Legend({
        map: map,
        layerInfos: legendLayers,
        defaultSymbol: false
    }, "legendDiv");
    legend.startup();

    //add check boxes
    arrayUtils.forEach(tocLayers, function (layer) {
        var layerName = layer.title;
        var checkBox = new CheckBox({
            name: "checkBox" + layer.layer.id,
            value: layer.layer.id,
            checked: layer.layer.visible,
            onChange: function () {
                var clayer = map.getLayer(this.value);
                clayer.setVisibility(!clayer.visible);
                this.checked = clayer.visible;
                if (this.value === "gbZoning") {
                    if (this.checked) {
                        $("#zoneDefinitionsLink").show();
                    } else {
                        $("#zoneDefinitionsLink").hide();
                    }
                }
                if (this.value === "gbFlood" || this.value === "gbPendFlood") {
                    if (map.getLayer("gbFlood").visible || map.getLayer("gbPendFlood").visible) {
                        $("#floodZoneDefinitionsLink").show();
                    } else {
                        $("#floodZoneDefinitionsLink").hide();
                    }
                }
            }
        });
        //end CheckBox
        //add the check box and label to the toc
        dc.place(checkBox.domNode, dom.byId("toggleDiv"));
        var checkLabel = dc.create("label", {
            "for": checkBox.name,
            innerHTML: "&nbsp;&nbsp;" + layerName
        }, checkBox.domNode, "after");
        dc.place("<br>", checkLabel, "after");
    });

    // gbFlood Transparency Slider
    var slider1 = new HorizontalSlider({
        name: "slider1",
        value: gbFlood.opacity,
        minimum: 0,
        maximum: 1,
        intermediateChanges: true,
        discreteValues: 11,
        style: "width:250px;",
        onChange: function (value1) {
            gbFlood.setOpacity(value1);
        }
    }, "slider1");
    // gbZoning Transparency Slider
    var slider2 = new HorizontalSlider({
        name: "slider2",
        value: gbZoning.opacity,
        minimum: 0,
        maximum: 1,
        intermediateChanges: true,
        discreteValues: 11,
        style: "width:250px;",
        onChange: function (value2) {
            gbZoning.setOpacity(value2);
        }
    }, "slider2");

    // Start Geocode Section
    //=================================================================================>
    function geosearch() {
        var def = geocoder.find();
        def.then(function (res) {
            geocodeResults(res);
        });
    }

    function geocodeSelect(item) {
        var g = (item.graphic ? item.graphic : item.result.feature);
        g.setSymbol(sym);
        addPlaceGraphic(item.result, g.symbol);
    }

    function geocodeResults(places) {
        places = places.results;
        if (places.length > 0) {
            clearFindGraphics();
            var symbol = sym;
            // Create and add graphics with pop-ups
            for (var i = 0; i < places.length; i++) {
                addPlaceGraphic(places[i], symbol);
            }
            zoomToPlaces(places);
        } else {
            alert("Sorry, address or place not found.");
        }
    }

    function addPlaceGraphic(item, symbol) {
        var place = {};
        var attributes, infoTemplate, pt, graphic;
        pt = item.feature.geometry;
        place.address = item.name;
        place.score = item.feature.attributes.Score;
        // Graphic components
        attributes = {
            address: place.address,
            score: place.score,
            lat: pt.getLatitude().toFixed(2),
            lon: pt.getLongitude().toFixed(2)
        };
        infoTemplate = new InfoTemplate("${address}",
            "Latitude: ${lat}<br/>Longitude: ${lon}<br/>Score: ${score}"
        );
        graphic = new Graphic(pt, symbol, attributes, infoTemplate);
        // Add to map
        map.graphics.add(graphic);
    }

    function zoomToPlaces(places) {
        var multiPoint = new Multipoint(map.spatialReference);
        for (var i = 0; i < places.length; i++) {
            //multiPoint.addPoint(places[i].location);
            multiPoint.addPoint(places[i].feature.geometry);
        }
        map.setExtent(multiPoint.getExtent().expand(2.0));
    }

    function clearFindGraphics() {
        map.infoWindow.hide();
        map.graphics.clear();
    }

    function createPictureSymbol(url, xOffset, yOffset) {
        return new PictureMarkerSymbol({
            "angle": 0,
            "xoffset": xOffset,
            "yoffset": yOffset,
            "type": "esriPMS",
            "url": url,
            "contentType": "image/png",
            "width": 12,
            "height": 24
        });
    }
    var sym = createPictureSymbol("img/blue-pin.png", 0, 12, 35);
    // End Geocode Section
    //=================================================================================>
    //create a link in the popup window.
    var link = dc.create("a", {
        "class": "action",
        "id": "infoLink",
        "innerHTML": "Assessor Info", //text that appears in the popup for the link
        "href": "javascript: void(0);"
    }, query(".actionList", map.infoWindow.domNode)[0]);

    on(link, "click", function () {
        var feature = map.infoWindow.getSelectedFeature();
        var url = window.location;
        var link = "";
        // console.log(feature.attributes);
        link = appConfig.MaricopaAssessor + feature.attributes.APN;
        window.open(link);
    });

    connect.connect(popup, "onSelectionChange", function () {
        var graphic = popup.getSelectedFeature();
        if (graphic) {
            if (graphic.attributes.APN) {
                // show link in popup info window
                $("#infoLink").show();
            } else {
                // hide link in popup info window
                $("#infoLink").hide();
            }
        }
    });
    // Identify Features
    //=================================================================================>
    function mapReady() {
        $(".esriSimpleSliderDecrementButton").addClass("esriSimpleSliderDisabledButton");

        //create identify tasks and setup parameters
        // zoning Layer
        identifyTask1 = new IdentifyTask(appConfig.mainURL);
        identifyParamsTask1 = new IdentifyParameters();
        identifyParamsTask1.layerIds = [6];
        identifyParamsTask1.tolerance = 3;
        identifyParamsTask1.returnGeometry = true;
        identifyParamsTask1.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
        identifyParamsTask1.width = map.width;
        identifyParamsTask1.height = map.height;
        // parcel layer
        identifyTask2 = new IdentifyTask(appConfig.mainURL);
        identifyParamsTask2 = new IdentifyParameters();
        identifyParamsTask2.layerIds = [3];
        identifyParamsTask2.tolerance = 3;
        identifyParamsTask2.returnGeometry = true;
        identifyParamsTask2.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
        identifyParamsTask2.width = map.width;
        identifyParamsTask2.height = map.height;
        // flood zone layer
        identifyTask3 = new IdentifyTask(appConfig.mainURL);
        identifyParamsTask3 = new IdentifyParameters();
        identifyParamsTask3.layerIds = [1];
        identifyParamsTask3.tolerance = 3;
        identifyParamsTask3.returnGeometry = true;
        identifyParamsTask3.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
        identifyParamsTask3.width = map.width;
        identifyParamsTask3.height = map.height;
        // pending flood zone layer
        identifyTask4 = new IdentifyTask(appConfig.mainURL);
        identifyParamsTask4 = new IdentifyParameters();
        identifyParamsTask4.layerIds = [2];
        identifyParamsTask4.tolerance = 3;
        identifyParamsTask4.returnGeometry = true;
        identifyParamsTask4.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
        identifyParamsTask4.width = map.width;
        identifyParamsTask4.height = map.height;
    } // end mapReady

    function executeIdentifyTask(event) {
        var layers = map.layerIds;
        var vis = tocLayers;
        // find out what layers are visible
        // turns off popup if layer is not visible
        for (var i = 0; i < vis.length; i++) {
            var visible = vis[i].layer.visible;
            var name = vis[i].id;
            if (name === "gbZoning" && visible === true) {
                identifyParamsTask1.layerIds = [6];
            }
            if (name === "gbZoning" && visible === false) {
                identifyParamsTask1.layerIds = [-1];
            }
            if (name === "gbParcels" && visible === true) {
                identifyParamsTask2.layerIds = [3];
            }
            if (name === "gbParcels" && visible === false) {
                identifyParamsTask2.layerIds = [-1];
            }
            if (name === "gbFlood" && visible === true) {
                identifyParamsTask3.layerIds = [1];
            }
            if (name === "gbFlood" && visible === false) {
                identifyParamsTask3.layerIds = [-1];
            }
            if (name === "gbPendFlood" && visible === true) {
                identifyParamsTask4.layerIds = [2];
            }
            if (name === "gbPendFlood" && visible === false) {
                identifyParamsTask4.layerIds = [-1];
            }
        }
        identifyParamsTask1.geometry = event.mapPoint;
        identifyParamsTask1.mapExtent = map.extent;

        identifyParamsTask2.geometry = event.mapPoint;
        identifyParamsTask2.mapExtent = map.extent;

        identifyParamsTask3.geometry = event.mapPoint;
        identifyParamsTask3.mapExtent = map.extent;

        identifyParamsTask4.geometry = event.mapPoint;
        identifyParamsTask4.mapExtent = map.extent;

        var deferred1 = identifyTask1.execute(identifyParamsTask1).addCallback(
            function (response) {
                // response is an array of identify result objects
                // Let's return an array of features.
                return arrayUtils.map(response, function (result) {
                    var feature = result.feature;
                    feature.attributes.layerName =
                        result.layerName;
                    if (feature.attributes.OBJECTID !== 0) {
                        var template = new InfoTemplate();
                        //Gila Bend zoning
                        template.setTitle(
                            "Gila Bend Zoning");
                        template.setContent(
                            "Zoning Code: ${ZONING}" +
                            "<br>Zoning Description: ${DESCRIPTION}"
                        );
                        feature.setInfoTemplate(
                            template);
                    } // end if
                    return feature;
                });
            }); //end addCallback

        var deferred2 = identifyTask2.execute(identifyParamsTask2).addCallback(
            function (response) {
                // response is an array of identify result objects
                // Let's return an array of features.
                return arrayUtils.map(response, function (result) {
                    var feature = result.feature;
                    feature.attributes.layerName =
                        result.layerName;
                    if (feature.attributes.OBJECTID !== 0) {
                        var template = new InfoTemplate();
                        //Gila Bend zoning
                        template.setTitle(
                            "County Parcels");
                        template.setContent(
                            "Parcel: ${APN}"
                        );
                        feature.setInfoTemplate(
                            template);
                    } // end if
                    return feature;
                });
            }); //end addCallback

        var deferred3 = identifyTask3.execute(identifyParamsTask3).addCallback(
            function (response) {
                // response is an array of identify result objects
                // Let's return an array of features.
                return arrayUtils.map(response, function (result) {
                    var feature = result.feature;
                    feature.attributes.layerName =
                        result.layerName;
                    if (feature.attributes.OBJECTID !== 0) {
                        var template = new InfoTemplate();
                        // Gila Bend zoning
                        template.setTitle("Flood Zone");
                        template.setContent(
                            "Flood Zone: ${FloodZone}" +
                            "<br>Description: ${FloodZoneD}"
                        );
                        feature.setInfoTemplate(
                            template);
                    } // end if
                    return feature;
                });
            }); //end addCallback
        var deferred4 = identifyTask4.execute(identifyParamsTask4).addCallback(
            function (response) {
                // response is an array of identify result objects
                // Let's return an array of features.
                return arrayUtils.map(response, function (result) {
                    var feature = result.feature;
                    feature.attributes.layerName =
                        result.layerName;
                    if (feature.attributes.OBJECTID !== 0) {
                        var template = new InfoTemplate();
                        // Gila Bend zoning
                        template.setTitle(
                            "Pending Flood Zone");
                        template.setContent(
                            "Pending Flood Zone: ${FloodZone}"
                        );
                        feature.setInfoTemplate(
                            template);
                    } // end if
                    return feature;
                });
            }); //end addCallback
        // InfoWindow expects an array of features from each deferred
        // object that you pass. If the response from the task execution
        // above is not an array of features, then you need to add a callback
        // like the one above to post-process the response and return an
        // array of features.
        map.infoWindow.setFeatures([deferred1, deferred2, deferred3, deferred4]);
        map.infoWindow.show(event.mapPoint);
    } // end executeIdentifyTask
}); // end Main Function

// contents open
//=================================================================================>
function toggleContent() {
    if ($("#legend").is(":hidden")) {
        $("#legend").fadeIn();
        $("#legend").draggable({
            containment: "#mapDiv"
        });
        $("#contentsOpen");
    } else {
        $("#legend").fadeOut();
        $("#contentsOpen");
    }
}
$(document).ready(function () {
    $("#contentsOpen").fadeTo("slow");
    $("#legend").fadeTo("slow");
    $("#legend").draggable({
        containment: "#mapDiv"
    });
    contentsOpen = $("#contentsOpen").height();
    $("#contentsOpen").click(function () {
        toggleContent();
    });
});
//sets original position of dropdown
// $(document).ready(function() {
//     $("#legend").hide();
// });
// Measurement Tool open
//=================================================================================>
function toggleMTool() {
    if ($("#mTool").is(":hidden")) {
        $("#mTool").fadeIn();
        $("#mTool").draggable({
            containment: "#mapDiv"
        });
        $("#measureOpen");
    } else {
        $("#mTool").fadeOut();
        $("#measureOpen");
    }
}
$(document).ready(function () {
    $("#measureOpen").fadeTo("slow");
    $("#mTool").fadeTo("slow");
    measureOpen = $("#measureOpen").height();
    $("#mTool").css("top", "55px");
    $("#measureOpen").click(function () {
        toggleMTool();
    });
});
//sets original position of dropdown for measurement tool
$(document).ready(function () {
    $("#mTool").hide();
});
// Print Tool open
//=================================================================================>
function togglePrint() {
    if ($("#printTool").is(":hidden")) {
        $("#printTool").fadeIn();
        $("#printTool").draggable({
            containment: "#mapDiv"
        });
        $("#printOpen");
    } else {
        $("#printTool").fadeOut();
        $("#printOpen");
    }
}
// Report Window open
//=================================================================================>
function toggleReportWindow() {
    if ($("#reportTool").is(":hidden")) {
        $("#reportTool").fadeIn();
        $("#reportTool").draggable({
            containment: "#mapDiv"
        });
    } else {
        $("#reportTool").fadeOut();
        $("#reportOpen");
    }
}
$(document).ready(function () {
    $("#printOpen").fadeTo("slow");
    $("#printTool").fadeTo("slow");
    printOpen = $("#printOpen").height();
    $("#printOpen").click(function () {
        togglePrint();
    });
    $("#reportOpen").fadeTo("slow");
    $("#reportTool").fadeTo("slow");
    reportOpen = $("#reportOpen").height();
    $("#reportOpen").click(function () {
        toggleReportWindow();
    });
});
//sets original position of dropdown for measurement tool
$(document).ready(function () {
    $("#printTool").hide();
    $("#reportTool").hide();
});
// Bindings
//=================================================================================>
//
$(document).ready(function () {
    //*** Content binding
    $("#legend").load("views/contents.html");
    //*** Content Help modal binding
    $("#helpContent").load("views/helpContent.html");
    //*** About modal binding
    $("#aboutInfo").load("views/about.html");
    //*** Legal Disclaimer modal binding
    $("#legalDisclaimer").load("views/legalDisclaimer.html");
    //*** Definitions modal binding
    $("#definitions").load("views/definitions.html");
    //*** Definitions modal binding
    $("#floodDefinitions").load("views/floodDefinitions.html");
    //*** Measurement Tool binding
    $("#mTool").load("views/measureTool.html");
    //*** Measurement Tool Help modal binding
    $("#helpTool").load("views/helpTool.html");
    // *** Print Tool modal binding
    $("#printTool").load("views/printTool.html");
    //*** Print Tool Help modal binding
    $("#helpPrint").load("views/helpPrint.html");
    //*** Report Window modal binding
    $("#reportTool").load("views/reportWindow.html");
});