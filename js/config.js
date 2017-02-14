var appConfig = new function() {

    this.Version = "v1.0.7 | 02/14/2017";

    this.emailLink = "https://www.azmag.gov/EmailPages/JasonHoward.asp";

    this.mainURL = "http://geo.azmag.gov/gismag/rest/services/maps/GilaBend/MapServer";

    this.MaricopaAssessor = "http://mcassessor.maricopa.gov/mcs.php?q=";

    this.GeometryService = "http://geo.azmag.gov/gismag/rest/services/Utilities/Geometry/GeometryServer"; // MAGs service

    this.printUrl = "http://geo.azmag.gov/gismag/rest/services/gp/GilaBend_Print/GPServer/Export%20Web%20Map"; // MAG Wickenburg Print service

    // Demographic PDF report
    this.demService = "http://geo.azmag.gov/services/demographics2014/reports.html?city=Gila Bend";
    // Employment PDF report
    this.empService = "http://geo.azmag.gov/services/employment2015/reports.html?jurisdiction=Gila Bend";

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