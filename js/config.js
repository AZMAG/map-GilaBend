var appConfig = new function() {

    this.Version = "v1.0.2 | 10/13/2015";

    this.emailLink = "https://www.azmag.gov/EmailPages/JasonHoward.asp";

    this.mainURL = "http://geo.azmag.gov/gismag/rest/services/maps/GilaBend/MapServer";

    this.MaricopaAssessor = "http://mcassessor.maricopa.gov/?s=";

    this.GeometryService = "http://geo.azmag.gov/gismag/rest/services/Utilities/Geometry/GeometryServer"; // MAGs service

    this.printUrl = "http://geo.azmag.gov/gismag/rest/services/gp/Wickenburg_Print/GPServer/Export%20Web%20Map"; // MAG Wickenburg Print service

    this.initExtent = {
        "xmin": -12621000,
        "ymin": 3856151,
        "xmax": -12474241,
        "ymax": 3928842,
        "spatialReference": {
            "wkid": 102100
        }
    };

    this.center = [-112.717, 32.979];
}; //End Config