let margin = null,
    width = null,
    height = null;
let svg = null;
let tip = null;
let path = null;
let color = null;
let yearsCombobox = null;
let selectedYear = null;
let countriesLimits = null;
let countriesCoordinates = null;
let years = null;

setupCanvasSize();
appendSvg();
setupTooltip();
setupPath();
fillYearsCombobox();
setupMapColorScale();
addLegend();
initializeMap();

d3.select("#yearSelection").on("change", changeYear);
d3.select("#AnimatedVersion").on("click", animateMap);

function setupCanvasSize() {
  margin = { top: 10, right: 10, bottom: 10, left: 10 };
  width = 960 - margin.left - margin.right;
  height = 500 - margin.top - margin.bottom;
}

function appendSvg() {
  svg = d3.select(".leftContent")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("class", "map");
}

function setupTooltip() {
  var format = d3.format(",");

  tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function (d) {
      return "<strong>Country: </strong><span class='details'>" + 
              d.properties.name + 
              "<br></span>" + 
              "<strong>Population: </strong><span class='details'>" + 
              format(d.population) + 
              "</span>";
      }
    );
  
  svg.call(tip);
}

function setupPath() {
  var projection = d3.geoMercator()
    .scale(130)
    .translate([width / 2, height / 1.5]);

  path = d3.geoPath().projection(projection);
}

function setupMapColorScale() {
  color = d3.scaleThreshold()
    .domain([10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000])
    .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)",
            "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)",
            "rgb(33,113,181)", "rgb(8,81,156)", "rgb(8,48,107)",
            "rgb(3,19,43)"]);
}

function fillYearsCombobox() {
  years = getListOfYears();

  yearsCombobox = document.getElementById("yearSelection");
  var fragment = document.createDocumentFragment();
  years.forEach(function(year, index) {
      var opt = document.createElement("option");
      opt.innerHTML = year;
      opt.value = year;
      fragment.appendChild(opt);
  });
  yearsCombobox.appendChild(fragment);

  yearsCombobox.value = Math.min(...years);
}

function getListOfYears() {
  var searcher = {};
  var items = populationData;
  years = [];
  
  items.forEach(function(item, index) {
    var year = item.Year;
  
    if (!(year in searcher)) {
      searcher[year] = 1;
      years.push(year);
    }
  });

  return years;
}

function addLegend() {
  var ext_color_domain = [0, 10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000];
  var legendLabels = ["< 10000",
                      "10000 - 100000",
                      "100000 - 500000",
                      "500000 - 1000000",
                      "1000000 - 5000000",
                      "5000000 - 10000000",
                      "10000000 - 50000000",
                      "50000000 - 100000000",
                      "100000000 - 500000000",
                      "> 500000000"];

  var legend = svg.selectAll("g.legend")
    .data(ext_color_domain)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", "translate(20,470)");;

  var width = 20;
  var height = 20;

  legend.append("rect")
    .attr("x", 20)
    .attr("y", function(d, i){ return height - (i * width) - 2 * height;})
    .attr("width", width)
    .attr("height", height)
    .style("fill", function(d, i) { return color(d); })
    .style("opacity", 0.8);

  legend.append("text")
    .attr("x", 50)
    .attr("y", function(d, i){ return height - (i * height) - height - 4;})
    .text(function(d, i){ return legendLabels[i]; });
}

function initializeMap() {
  selectedYear = yearsCombobox.options[yearsCombobox.selectedIndex].value

  queue()
    .defer(d3.json, "world_countries.json")
    .await(ready);
}

function colorCountries_displayTooltips() {
  countriesLimits
    .style("fill", function (d) { 
      return color(d.population); 
    })
    .style("stroke", "white")
    .style("stroke-width", 0.5);
    
    countriesLimits.on("mouseover", function (d) {
      tip.show(d);

      d3.select(this)
        .style("fill", function (d) { 
          return "#E91E63"; 
        })
        .style("stroke", "white")
        .style("stroke-width", 3);
    })

    .on("mouseout", function (d) {
      tip.hide(d);

      d3.select(this)
        .style("fill", function (d) { 
          return color(d.population); 
        })
        .style("stroke", "white")
        .style("stroke-width", 0.5);
    });
}

function setData(yearToSet) {
  var populationById = {};
  populationData
    .filter(data => data.Year === parseInt(yearToSet))
    .forEach(function(d) {
      populationById[d["Country Code"]] = d.Value; 
    });

  countriesCoordinates.features.forEach(function (d) { 
    d.population = populationById[d.id] 
  });

  setTotalPopulation(yearToSet);
}

function setTotalPopulation(yearToSet){
  var yearTotalPopulationArray = populationData.filter(function(item) {
    return item["Country Code"] === "WLD" && item.Year === parseInt(yearToSet)
  });

  if(yearTotalPopulationArray.length > 0){
    var totalPopulation = yearTotalPopulationArray[0].Value;
    document.getElementById("totalPopulation").innerHTML = totalPopulation;
  }
}

function changeYear() {
  selectedYear = yearsCombobox.options[yearsCombobox.selectedIndex].value

  setData(selectedYear);
  colorCountries_displayTooltips();
}

function animateToNextYear(yearIndex, speed) {
  var nextYearIndex = yearIndex + 1;
  if(nextYearIndex < years.length) {
    setTimeout(function() {
      document.getElementById("animationCurrentYearLabel").hidden = false;
      document.getElementById("animationCurrentYear").innerHTML = years[nextYearIndex];
      setData(years[nextYearIndex]);
      colorCountries_displayTooltips();
      animateToNextYear(nextYearIndex, speed);
    }, speed);
  } else {
    enableControls();
    document.getElementById("animationCurrentYearLabel").hidden = true;
    document.getElementById("animationCurrentYear").innerHTML = "";
    changeYear();
  }
}

function animateMap() {
  disableControls();
  setData(years[0]);
  colorCountries_displayTooltips();

  var speed = document.getElementById("speed").value;
  animateToNextYear(0, speed*(-1));
}

function disableControls() {
  document.getElementById("yearSelection").disabled = true;
  document.getElementById("speed").disabled = true;
  document.getElementById("AnimatedVersion").disabled = true;
}

function enableControls() {
  document.getElementById("yearSelection").disabled = false;
  document.getElementById("speed").disabled = false;
  document.getElementById("AnimatedVersion").disabled = false;
}

function ready(error, data) {
  countriesCoordinates = data;

  countriesLimits = svg.append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(data.features)
    .enter()
    .append("path")
    .attr("d", path);
  
  changeYear()
}
