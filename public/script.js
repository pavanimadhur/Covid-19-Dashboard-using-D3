// About the data
// Source: https://covid19.who.int/table   (covid19.csv/covid19.json)
// Did the data filtering using Python Pandas (fetching_top15.ipynb) to fetch the top 15 countries
// based on death rate. Used that data (top15countries.csv/ top15countries.json) for creating the 
// updatable D3 bargraphs.
// Downloaded the countries flag svg images  from "https://commons.wikimedia.org/wiki/Main_Page"


countries ={};
flags= {};
int_count = {};
avg_deaths = 0;
avg_cases = 0;
count = 0
var h1 = document.querySelector("h1");

fetch('/flags').then(response=>response.json()).then(data=>{
	console.log('flags: ');
	console.log(data);
	flags = data;
});



function country(){
    d3.csv('covid19.csv').then(function(data){ 
    var ul = document.getElementById("ct")
    data.forEach(function(d){
            
		var region = d["Name"];
		if(region == "Global")
		{
				console.log("Insdie global")
				var div = document.getElementById('left_text');
				var br = document.createElement("br");
				div.innerHTML += "<br />";
				div.innerHTML += "<span style='font-size:25px'>"+d["Cases - cumulative total"] + "</span>";
		}
		count = count+1;
		countries[region] = [];
		countries[region][0] = d["Cases - cumulative total"];
		countries[region][1] = d["Deaths - cumulative total"];
		
	})
});
}

var mapSvg1;
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("c1").selectedIndex = -1;
  document.getElementById("c2").selectedIndex = -1;
  document.getElementById("c3").selectedIndex = -1;
  country();
  createbargraphs();
  createMap();
  update_bar();

})

function createMap(){
	mapSvg1 = d3.select("#map1"),
	width = +mapSvg1.attr("width"),
	height = +mapSvg1.attr("height");
   
	  Promise.all([d3.json('http://enjalot.github.io/wwsd/data/world/world-110m.geojson'),
				 d3.csv('covid19.csv')])
			.then(function(values){
	  			
	  mapData = values[0];
	  countryData = values[1];
	 
	  drawmap();
	})
}

// D3 world map which shows the cumulative cases and deaths when we hover on a country
// ref: https://www.d3-graph-gallery.com/graph/choropleth_basic.html
// 30% source from the reference for creating projection, colorscale and geopath
// added tooltip to be shown when we hover on a country using the on mouseover event.

function drawmap(){

  let projection = d3.geoMercator()
                      .scale(60)
                      .center([0,10])
                      .translate([width / 1.5, height]);
    let path = d3.geoPath()
               .projection(projection);
               var colorScale = d3
               .scaleSequential(d3.interpolateReds) 
               .domain([0, 10]);

    let g = mapSvg1.append('g');
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    g.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('id', d => { return d.properties.name})
        .attr('class','countrymap')
        .style('fill', d => {
            let val = 0;
            if(Object.keys(countries).includes(d.properties.name)){
                    val = countries[d.properties.name][0];
            }
            if(isNaN(val) || val == 0) 
                return '#B5D3E7';

            
            return colorScale(val/10000);
            })
    .on('mouseover', function(d,i) {
        console.log('mouseover on ' + d.properties.name);
        d3.select(this)
            .classed('highlight',true)
            .transition()
            .duration('50')
            .attr('opacity', '.85')
        div.transition()
            .duration(50)
            .style("opacity", 1); 
		incrementCount(d.properties.name); 
        console.log('mouseover on ' + d.properties.name+ ' '+int_count[d.properties.name]);            
    })
                  
    .on('mousemove',function(d,i) {
		if(d.properties.name != "Antarctica")
		{
			var country_frequency = "Country : " + d.properties.name + "<br>" + " Number of Cases : "  + countries[d.properties.name][0] + "<br>" + " Number of Deaths : "  + countries[d.properties.name][1]; 
			div.html(country_frequency).style("left",(d3.event.pageX+10)+"px").style("top",(d3.event.pageY-15)+"px"); 
		}
    })
              
	.on('mouseout', function(d,i) {
		d3.select(this)
		.classed('highlight',false)
		.transition()
		.duration('50')
		.attr('opacity', '1');
		div.transition()
		.duration('50')
		.style("opacity", 0);
	})

axisScale = d3.scaleLinear()
.domain(colorScale.domain())
.range([0,200]);
  
  axisBottom = g => g
      .attr("class", `x-axis`)
      //.attr("class","legend")
      .attr("transform", `translate(20,70)`)
      .call(d3.axisBottom(axisScale)
      .ticks(200 / 80)
      .tickSize(-20))


  const linearGradient = mapSvg1.append("linearGradient")
      .attr("id", "linear-gradient");
  
  linearGradient.selectAll("stop")
    .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);
  
  mapSvg1.append('g')
    .attr("transform", `translate(0,50)`)
    .append("rect")
    .attr('transform', `translate(20, 0)`)
	  .attr("width", 200)
	  .attr("height", 20)
	  .style("fill", "url(#linear-gradient)");
  
  mapSvg1.append('g')
    .call(axisBottom);              

}

// To build bottom d3 bar graphs
// Ref: https://bl.ocks.org/d3noob/8952219
// 30% source code is from the reference to create the xscale and yscale and how to add the
// axes and bars to the group element
// added the additional attributes for styling and transform, translate.

function createbargraphs(){
    d3.csv('covid19.csv').then(function(data){ 

		   data.shift();
		   barsvg2 = d3.select("#bar_horiz2"),
		   margin2 = 200,
		   width2 = barsvg2.attr("width") - margin2,
		   height2 = barsvg2.attr("height") - margin2
		   console.log("height "+ d3.max(data, function(d) { return parseInt(d["Cases - newly reported in last 24 hours"]); }));
		   var xScale2 = d3.scaleBand().range([0, width2]).padding(0.4),
				yScale2 = d3.scaleLinear().range([height2,0]);
	
		   var g2 = barsvg2.append("g")
					.attr("transform", "translate(" + 100 + "," + 100 + ")");
			
			xScale2.domain(data.map(function(d) { return d.Name; }));
			yScale2.domain([0, d3.max(data, function(d) { return parseInt(d["Cases - newly reported in last 24 hours"]); }) ]);
	
			g2.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height2 + ")")
				.call(d3.axisBottom(xScale2))
				.selectAll("text")  
					.style("text-anchor", "end")
					.attr("dx", "-.8em")
					.attr("dy", ".15em")
					.attr("transform", "rotate(-65)" );
			
			g2.append("g")
				.call(d3.axisLeft(yScale2).tickFormat(function(d){
					return d;
				})
				.ticks(10))
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", "-5.1em")
				.attr("text-anchor", "end")
				.attr("stroke", "black")
				.text("Confirmed Cases in Last 24 hours");
			
			g2.selectAll(".bar")
				.data(data)
				.enter().append("rect")
				.style("fill", d3.color("red") )
				.attr("class", "bar")
				.attr("x", function(d) { return xScale2(d.Name); })
				.attr("y", function(d) { return yScale2(d['Cases - newly reported in last 24 hours']); })
				.attr("width", xScale2.bandwidth())
				.attr("height", function(d) { return height2 - yScale2(d['Cases - newly reported in last 24 hours']); });
			
	

    });
}



// To increment count of hovered country
function incrementCount(code)
{
	for(i=0; i< flags.length; i++)
	{
		if(code== flags[i].Name)
		{
			console.log("inside for increment count")
			flags[i].count++;
			console.log(flags[i]);
		}
			
	}	
	var blob = new Blob([JSON.stringify(flags)], {
		type: 'application/json'
	});

	const url = "http://localhost:3000/update"

	fetch(url, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body: blob
	});	
}

// To build side bar graph with the updatable data
// when we hover on the country on the world map. the hover count of the country increases and the 
// count field in the top15countries.json gets updated. When we press the toggle button on the UI the 
// d3 bar graphs gets updated with the new updated count values 

// Ref: https://publish.uwo.ca/~jmorey2/ece/d3/d3Easy4.html
// took 30% code from the reference to sort the content in the bargraph when pressing the toggle button.

function update_bar() {
	d3.select("#graph").html('');
	d3.json('top15countries.json').then(function(data){ 
	const width_flag = 600 - margin_flag.left - margin_flag.right
	const height_flag = 500 - margin_flag.top - margin_flag.bottom;
	
	console.log(data);

	data.sort((a,b) => {
		return d3.descending(a.count, b.count)
	  });
	
	console.log(data);

	let maxCount = d3.max(data, (d, i) => d.count);
	let x = d3.scaleLinear()
		.range([0, width_flag])
		.domain([0, maxCount])
	let xaxis =  d3.axisTop().scale(x)
	
	let y = d3.scaleBand()
		.range([0, height_flag])
		.domain(data.map(function(d) {return d.flags; }))
	
	// append the svg object to the body of the page
	const svg3 = d3.select("#graph")
	.attr("width", width_flag + margin_flag.left + margin_flag.right)
	.attr("height", height_flag + margin_flag.top + margin_flag.bottom)
	.append("g")
	.attr("transform", `translate(${margin_flag.left},${margin_flag.top})`)
		.call(xaxis)
	
	let color = d3.scaleSequential()
		.domain([0, d3.max(data, d => d.count)])
		.interpolator(d3.interpolateReds)
	


	   svg3.selectAll('.data')
		.data(data, (d, i) => d.flags)

		.join(
			enter => {
				let group = enter.append('g')
				.attr('class', "data")
	
				group.append("rect")
				.transition()
				.duration(800)
				.attr('x', x(0))
				.attr('y', d => y(d.flags))
				.attr('stroke',"black")
				.attr('fill',d =>`${color(d.count)}`)
				.attr('height', y.bandwidth())
				.attr('width', d=> x(d.count))
	
				group.append('text')
				.attr("class","label")
				.attr("text-anchor","end")
				.attr('transform',d=>`translate(${x(0)},${y(d.flags)+y.bandwidth()*3/4}) scale(${y.bandwidth()/20})`) //fudgy
				.text(d=>d.flags)
				.attr('stroke',"black")
				.style("fill", d3.color("grey") )
				.attr("font-size", "20px")
			},
			update => {
				console.log("Inside update: toggle")
				let group = update.transition()
				  .duration(5000)
				group.select("rect")
	
				  .attr('width', d=> x(d.count))
				  .attr('height', y.bandwidth())
				  .attr('fill',d =>`${color(d.count)}`)
				  .attr('y', d=> y(d.flags)),
				group.select("text")
				.attr('transform',d=>`translate(${x(0)},${y(d.flags)+y.bandwidth()*3/4}) scale(${y.bandwidth()/20})`)
				},
			exit => 
				exit.attr("opacity",0.75)
				  .transition()
				  .duration(1000)
				
				  .remove()
		)
	})
}

// svg donut piechart which shows the total deaths in last 24 hrs from the selected three countries.

var val1D = document.getElementById('donut-segment1') //blue
var val2D = document.getElementById('donut-segment2') //green
var val3D = document.getElementById('donut-segment3')  //pink

startAnim()

function startAnim(){
  setTimeout(function(){
    val1D.style.transition = "stroke-dasharray 0.5s ease-in-out, stroke-dashoffset 0.5s ease-in-out";
  val1D.style.strokeDasharray = "100 0";
    },20);
}

// Ref: https://heyoka.medium.com/scratch-made-svg-donut-pie-charts-in-html5-2c587e935d72
// 25 % of the code has been taken from the reference to draw the donut piechart and added my own styling elements and 
// svg elements to the figure key
// function to fetch the "Deaths - newly reported in last 24 hours" of the selected countries from the top15countries.json
// and then sums up the three values and displays in the center of the donut piechart.
// Have added  the respective country flag and the name of the country in the figure key beside the piechart.

function calculate() {

  var val1 = document.getElementById('c1').value;
  var val2 = document.getElementById('c2').value;
  var val3 = document.getElementById('c3').value;
  var cases_val1, cases_val2, cases_val3;
  console.log(val1)
  for(i=0; i< flags.length; i++)
	{

		if(val1== flags[i].Name)
		{
			cases_val1 = parseInt(flags[i]["Deaths - newly reported in last 24 hours"])
		}
			
	}	
  for(i=0; i< flags.length; i++)
	{
		if(val2== flags[i].Name)
		{
			cases_val2 = parseInt(flags[i]["Deaths - newly reported in last 24 hours"])		
		}
			
	}	

  for(i=0; i< flags.length; i++)
	{
		if(val3== flags[i].Name)
		{
			cases_val3 = parseInt(flags[i]["Deaths - newly reported in last 24 hours"])		
		}
			
	}	

  var totalValue = document.getElementById('totalValue')

  var total = cases_val3+cases_val2+cases_val1;
  
  var per1 = cases_val1/total*100;
  var per2 = cases_val2/total*100;
  var per3 = cases_val3/total*100;
  var offset = 25;
  
  totalValue.textContent = total;
  
  val1D.style.transition = "stroke-dasharray 0.5s ease-in-out, stroke-dashoffset 0.5s ease-in-out";
  val1D.style.strokeDasharray = per1+" "+(100-per1);
  val1D.style.strokeDashoffset = offset;
  
  val2D.style.transition = "stroke-dasharray 0.5s ease-in-out, stroke-dashoffset 0.5s ease-in-out";
  val2D.style.strokeDasharray = per2+" "+(100-per2);
  val2D.style.strokeDashoffset = 100-per1+offset;
  
  val3D.style.transition = "stroke-dasharray 0.5s ease-in-out, stroke-dashoffset 0.5s ease-in-out";
  val3D.style.strokeDasharray = per3+" "+(100-per3);
  val3D.style.strokeDashoffset = 100-(per1+per2)+offset;
  var element1 = document.getElementById("color1");
  element1.classList.add("shape-flag");
  if(val1 == "The United Kingdom")
  element1.classList.add("TheUnitedKingdom");
  else
  element1.classList.add(String(val1));
  //===================================
  var element2 = document.getElementById("color2");
  element2.classList.add("shape-flag");
  if(val2 == "The United Kingdom")
  element2.classList.add("TheUnitedKingdom");
  else
  element2.classList.add(String(val2));
  //=====================================
  var element3 = document.getElementById("color3");
  element3.classList.add("shape-flag");
  if(val3 == "The United Kingdom")
  element3.classList.add("TheUnitedKingdom");
  else
  element3.classList.add(String(val3));
  document.getElementById("title1").innerHTML= val1 + " " +  String(cases_val1);
  document.getElementById("title2").innerHTML= val2 + " " +  String(cases_val2);
  document.getElementById("title3").innerHTML= val3 + " " +String(cases_val3);
}
	// set the dimensions and margins of the graph
	const margin_flag = {
		top: 30,
		right: 15,
		bottom: 10,
		left: 30
	}