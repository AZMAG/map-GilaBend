var appConfig = new function () {

    this.Version = "v1.0.10 | 2020-05-07";

    this.copyright = "2020";

    this.emailLink = "https://www.azmag.gov/EmailPages/JasonHoward.asp";

    this.mainURL = "https://geo.azmag.gov/arcgis/rest/services/maps/GilaBend/MapServer";

    this.MaricopaAssessor = "https://mcassessor.maricopa.gov/mcs.php?q=";

    // this.GeometryService = "https://geo.azmag.gov/gismag/rest/services/Utilities/Geometry/GeometryServer"; // MAGs service
    this.GeometryService = "https://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer"; // Esri test service

    // this.printUrl = "https://geo.azmag.gov/gismag/rest/services/gp/GilaBend_Print/GPServer/Export%20Web%20Map"; // MAG Wickenburg Print service
    this.printUrl = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"; // Esri test service

    // Demographic PDF report
    this.demService = "https://geo.azmag.gov/services/demographics2014/reports.html?city=Gila Bend";
    // Employment PDF report
    this.empService = "https://geo.azmag.gov/services/employment2015/reports.html?jurisdiction=Gila Bend";

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