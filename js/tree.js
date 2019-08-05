/*jshint esversion: 6 */
(function() {

    /* ============ START GLOBAL VARIABLE DEFINITIONS ============ */
    // get the svg map
    var svgContainer = d3.select("svg");
    
    const pinSize = 26, // width and height of map pins
        defaultRadius = 175; // default city radius in pixels
    
    var mileToPixelRatio = 0; // how many pixels are in a mile
    const EARTH_RADIUS = 3958.8; //radius of earth in miles
    
    const colorA = "#62bce3",
        colorB = "#f58b56";
    
    // Define the div for the tooltip
     var div = d3.select("body").append("div")
         .attr("class", "tooltip")
         .style("opacity", 0);
    
    // Global Filters Array
    var filters = [[],{},{},{},{}];
    
    // Indexes of Different Filters
   
    const INTERSECTION_FILTER = 2;
    const CATEGORY_FILTER = 4;
    const SITES_FILTER = 3;
    
    filters[INTERSECTION_FILTER].cityA = projection.invert([200 + (pinSize / 2), 375 + (pinSize / 2)]);
    filters[INTERSECTION_FILTER].cityAradius = defaultRadius;
    filters[INTERSECTION_FILTER].cityB =  projection.invert([450 + (pinSize / 2), 375 + (pinSize / 2)]);
    filters[INTERSECTION_FILTER].cityBradius = defaultRadius;
    /* ============= END GLOBAL VARIABLE DEFINITIONS ============== */
    
    
    function calculateMPR(coords1, coords2) {
        // get corresponding pixel values of coordinates
        var pixels1 = projection(coords1),
            pixels2 = projection(coords2);
    
        // get distance between two points in pixels
        var pixelX = pixels1[0] - pixels2[0];
        var pixelY = pixels1[1] - pixels2[1];
        var pixelDistance = Math.sqrt(Math.pow(pixelX, 2) + Math.pow(pixelY, 2));
    
        // coords array are [lon, lat] while distance functions takes lat then long
        var mileDistance = d3.geo.distance(coords1, coords2) * EARTH_RADIUS;
        return (pixelDistance / mileDistance);
    }
    
    // Load data, setup controls
    // d3.json("scpd-incidents.json", function(error, crimes) {
    // 	if (error) throw error;
    // 	console.log(crimes);
    // 	mileToPixelRatio = calculateMPR(crimes.data[0].Location, crimes.data[crimes.data.length/2].Location);
    // 	drawCityPins(200, 375, 450, 375, crimes.data); //default pin locations
    // 	setUpControls(crimes.data);
    // });
    
    
    d3.csv("trees_2.csv", function(data) {
    
        console.log(data);
        pixel1 = new Array(data[1].Longitude,data[1].Latitude);
        end = Math.round(data.length/2);
        pixel2 = new Array(data[end].Longitude, data[end].Latitude);
        console.log('Prior data');

        console.log(pixel1);
        console.log(pixel2);
    
        mileToPixelRatio = calculateMPR(pixel1, pixel2);
        drawCityPins(200, 375, 450, 375, data); //default pin locations
        setUpControls(data);
    });
    
    
    
    /* ================ START CITY PIN DRAGGABLE FUNCTIONALITY =============== */
    
    
    
    // Draw the city pins and make them draggable!
    function drawCityPins(Ax, Ay, Bx, By, data) {
    
        var drag = d3.behavior.drag()
            .on("drag", function() {
                var dragged = d3.select(this);
                var radius = pinSize / 2;
                var svgWidth = parseInt(svgContainer.attr("width")),
                    svgHeight = parseInt(svgContainer.attr("height"));
    
                dragged
                    .attr("x", Math.max(radius, Math.min(svgWidth - radius, d3.event.x) - radius))
                    .attr("y", Math.max(radius, Math.min(svgHeight - radius, d3.event.y) - radius));
    
    
                // drag city radius with the pin as well
                var cityRad;
                if (dragged.attr("id") == "cityA") {
                    cityRad = d3.select("#radiusA");
                    filters[INTERSECTION_FILTER].cityA =  projection.invert([d3.event.x, d3.event.y]);
                } else  {
                    cityRad = d3.select("#radiusB");
                    filters[INTERSECTION_FILTER].cityB =  projection.invert([d3.event.x, d3.event.y]);
                }
                cityRad
                    .attr("cx", Math.max(parseInt(dragged.attr("x")) + radius, Math.min(svgWidth - radius, d3.event.x)))
                    .attr("cy", Math.max(parseInt(dragged.attr("y")) + radius, Math.min(svgHeight - radius, d3.event.y)));
    
                update(filterTrees(data));
            })
            .on("dragend", function() {
                update(filterTrees(data));
            });
    
        // Draw radius around pin A
        svgContainer.append("ellipse")
            .attr("cx", Ax + (pinSize / 2))
            .attr("cy", Ay + (pinSize / 2))
            .attr("rx", defaultRadius)
            .attr("ry", defaultRadius)
            .attr("class", "cityRadius")
            .attr("id", "radiusA")
            .style("opacity", "0.2")
            .style("fill", colorA);
    
        // Draw radius around pin B
        svgContainer.append("ellipse")
            .attr("cx", Bx + (pinSize / 2))
            .attr("cy", By + (pinSize / 2))
            .attr("rx", defaultRadius)
            .attr("ry", defaultRadius)
            .attr("class", "cityRadius")
            .attr("id", "radiusB")
            .style("opacity", "0.2")
            .style("fill", colorB);
    
        // City A push pin
        svgContainer.append("image")
            .attr("x", Ax)
              .attr("y", Ay)
              .attr("height", pinSize)
              .attr("width", pinSize)
              .attr("xlink:href", "assets/citymarker.png")
              .attr("class", "cityPins")
              .attr("id", "cityA")
            .style("opacity", "0.9")
            .call(drag);
    
        // City B push pin
        svgContainer.append("image")
            .attr("x", Bx)
              .attr("y", By)
              .attr("height", pinSize)
              .attr("width", pinSize)
            .attr("xlink:href", "assets/citymarker.png")
            .attr("class", "cityPins")
            .attr("id", "cityB")
            .style("opacity", "0.9")
            .call(drag);
    
    }
    
    /* ============== END CITY PIN DRAGGABLE FUNCTIONALITY =============== */
    
    function setUpControls(crimes) {
    
        // Handle Intersection Data
        var cityA = d3.select("#radiusA"),
            cityB = d3.select("#radiusB");
        //converts the pixel coordinates of two locations into lon/lat
        var pointA = projection.invert([parseInt(cityA.attr("cx")), parseInt(cityA.attr("cy"))]),
            pointB = projection.invert([parseInt(cityB.attr("cx")), parseInt(cityB.attr("cy"))]);
        //update filter with the two points
        filters[INTERSECTION_FILTER].A = pointA;
        filters[INTERSECTION_FILTER].B = pointB;
    
        $("#Aknob .slider-handle")
            .css("background-color", colorA)
            .css("background-image", "none");
        $("#Bknob .slider-handle")
            .css("background-color", colorB)
            .css("background-image", "none");
    
        $("#Aknob .slider-selection")
            .css("background-color", "#ccc")
            .css("background-image", "none");
        $("#Bknob .slider-selection")
            .css("background-color", "#ccc")
            .css("background-image", "none");
    
    
        // // Handle Crime Categories
        // $('.dropdown-menu').on("click", function(event) {
        //     event.preventDefault();
        //     var text = event.target.text;
        //     if(text) {
        //         if(text === "All Species") {
        //             filters[CATEGORY_FILTER].species= null;
        //             $('#categoryButton').text("Select Category: All Species");
        //         } else {
        //             filters[CATEGORY_FILTER].species = text.toUpperCase();
        //             $('#categoryButton').text("Select Category: " + text);
        //         }
                
        //         update(filterTrees(crimes));
        //     }
        // });
        console.log('Prior test filter cate');

        // Handle Crime Categories
        $('#categoryButton').click(function(event) {
            $('#drop').click( function(event) {
                event.preventDefault();
                var text = event.target.text;
                console.log('test filter cate', event.target.text);

                if(text) {
                    if(text === "All Species") {
                        filters[CATEGORY_FILTER].species= null;
                        $('#categoryButton').text("Select Category: All Species");
                    } else {
                        filters[CATEGORY_FILTER].species = text;
                        $('#categoryButton').text("Select Category: " + text);
                    }
                    update(filterTrees(crimes));
                }
            });
        });

        $('#siteButton').click(function(event) {
            $('#drop1').click( function(event) {
                event.preventDefault();
                var text = event.target.text;
                console.log('test filter cate', event.target.text);

                if(text) {
                    if(text === "All Sites") {
                        filters[SITES_FILTER].sites= null;
                        $('#siteButton').text("Select Site: All Sites");
                    } else {
                        filters[SITES_FILTER].sites = text;
                        $('#siteButton').text("Select Site: " + text);
                    }
                    update(filterTrees(crimes));
                }
            });
        });

        // Initialize sliders
        var sliderA = $("#sliderA"),
            sliderB = $("#sliderB");
    
        // Make sliders slide and control radii of cities
        sliderA.slider();
        sliderA.on("slide", function(slideEvt) {
            $("#sliderAVal")[0].innerHTML = Math.round((slideEvt.value / mileToPixelRatio) * 10) / 10; //display radius in miles
            d3.select("#radiusA")
                .attr("rx", slideEvt.value)
                .attr("ry", slideEvt.value);
            filters[INTERSECTION_FILTER].cityAradius = slideEvt.value;
            update(filterTrees(crimes));
        });
    
        sliderB.slider();
        sliderB.on("slide", function(slideEvt) {
            $("#sliderBVal").text(Math.round((slideEvt.value / mileToPixelRatio) * 10) / 10); //display radius in miles
            d3.select("#radiusB")
                .attr("rx", slideEvt.value)
                .attr("ry", slideEvt.value);
            filters[INTERSECTION_FILTER].cityBradius = slideEvt.value;
            update(filterTrees(crimes));
        });
    
        $("#Aknob .slider-handle")
            .css("background-color", colorA)
            .css("background-image", "none");
        $("#Bknob .slider-handle")
            .css("background-color", colorB)
            .css("background-image", "none");
    
        $("#Aknob .slider-selection")
            .css("background-color", "#ccc")
            .css("background-image", "none");
        $("#Bknob .slider-selection")
            .css("background-color", "#ccc")
            .css("background-image", "none");
    
        //Initialize visual
        update(filterTrees(crimes));
    }
  
    
    // Filters crimes based on Weekday, Date range, and intersection
    function filterTrees(crimes) {
        var curr_crimes = crimes.filter(function(value) {
            // console.log('filte',value);
         
            //Filter Intersection
            if(!checkInRadius(value, filters[INTERSECTION_FILTER].cityA, filters[INTERSECTION_FILTER].cityAradius) ||
                !checkInRadius(value, filters[INTERSECTION_FILTER].cityB, filters[INTERSECTION_FILTER].cityBradius)) {
                    return false;
                }
            console.log('filters[CATEGORY_FILTER].species',filters[CATEGORY_FILTER].species);
            // Filter species Category
            if(filters[CATEGORY_FILTER].species) {
                console.log('check species',filters[CATEGORY_FILTER].species,value.species);
            	if(filters[CATEGORY_FILTER].species !== value.species) {
            		return false;
            	}
            }

            if(filters[SITES_FILTER].sites) {
            	if(filters[SITES_FILTER].sites !== value.sites) {
            		return false;
            	}
            }
    
            return true;
    
        });
        console.log('filter crimes',curr_crimes);
        return curr_crimes;
    }
    
    function getDistance(value, point) {
        var xDistance = value[0] - point[0];
        var yDistance = value[1] - point[1];
    
        return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
      }
    
    function checkInRadius(value, point, radius) {
        var pixel =  new Array(value.Longitude,value.Latitude);
        // var pixel = value.Location;
        var incidentCoor = projection(pixel);
        var pointCoor = projection(point);
        var distance = getDistance(incidentCoor, pointCoor);
        // console.log('checkInRadius',pixel,incidentCoor,distance, radius);
    
        return distance <= radius;
    }
    
    
    
    // Update crime data and city pins
    function update(crimes) {
        console.log('update', crimes);
        // Select all data points
        var circles = svgContainer.selectAll("circle")
                            .data(crimes)
                            .attr("class", "update");
        // var pixel =  
        circles.enter().append("circle").attr("class","enter")
            .attr("cx", function (d) { return projection(new Array(d.Longitude,d.Latitude))[0]; })
            .attr("cy", function (d) { return projection(new Array(d.Longitude,d.Latitude))[1]; })
            .attr("r", 2)
    
            .on("mouseover", function(d) {
                this.setAttribute('r', 10);
                this.setAttribute("style", "fill: #F57C00");
                div.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                // div.html(d.Category + "<br/>Resolution: " + d.Resolution)
                //     .style("left", (d3.event.pageX - 60) + "px")
                //     .style("top", (d3.event.pageY - 70) + "px");
                })
            .on("mouseout", function(d) {
                this.setAttribute('r', 2);
                this.setAttribute("style", "fill: #178c23");
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("mouseenter", function(d) {
                this.parentElement.appendChild(this);
            })
    
            .style("fill", "#178c23");
    
    
        circles.exit().remove();
        //Move pins on top
        $("#cityA")[0].parentElement.appendChild($("#cityA")[0]);
        $("#cityB")[0].parentElement.appendChild($("#cityB")[0]);
    }
    
    })();
    