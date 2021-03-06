var margin = {
	top: 150,
	right: 100,
	bottom: 130,
	left: 120
};
var width = 1000;
var height = 400;



//define a dictionary for headers
var headers = {
	'source': 'Real Ultimate Origin',
	'step1': 'Reported Ultimate Origin (conduit 1)',
	'step2': 'Immediate origin (conduit 2)',
	'target': 'Destination'
}
var valueNames = {
	'value1': 'Estimate 1 (millions USD)',
	'value2': 'Estimate 2 (millions USD)',
}




//call the update
document.addEventListener("DOMContentLoaded", function(event) {
	//get slider
	var slider = document.getElementById("links-amount");
	var sourceMenu = document.getElementById("source-menu");


	sourceMenu.onchange = function() {
		update()
	}

	slider.oninput = function() {
		//call the function
		update()

	}

	d3.select("#download").on("click", function(){
		var svg = document.getElementById("viz");
		//get svg source.
		var serializer = new XMLSerializer();
		var source = serializer.serializeToString(svg);

		//add name spaces.
		if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
		source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
		}
		if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
		source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
		}

		//add xml declaration
		source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

		//convert svg source to URI data scheme.
		var svgUrl = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

		//set url value to a element's href attribute.
		var downloadLink = document.createElement("a");
		downloadLink.href = svgUrl;
		downloadLink.download = name;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
		//you can download svg file by right click menu.
		})

	function update() {
		var menuValue = sourceMenu.options[sourceMenu.selectedIndex].value
		var sliderValue = slider.value
		d3.select('#title').text('Biggest ' + sliderValue + ' flows to ' + sourceMenu.options[sourceMenu.selectedIndex].text)
		drawEverything('data/dataset-' + menuValue + '.tsv', sliderValue)
	}

	update();

	//run the Sankey + circular over the data
	function drawEverything(_datasource, _threshold, _filter) {
		//clear
		d3.select("#chart").html("");

		var svg = d3.select("#chart").append("svg")
			.attr("id", "viz")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom);
		
		var defs = svg.append("defs");

		// create the two gradients, one that goes forward, the other that is backward
		let linkGradientFront = defs.append("linearGradient")
			.attr("id", "gradient-front")
			.attr("x1","0%")
			.attr("y1","0%")
			.attr("x2","100%")
			.attr("y2","0%")
			.attr("spreadMethod", "reflect");
			
		// linkGradientFront.append("stop")
		// 	.attr("offset", "0%")
		// 	.attr("stop-color", "#c300ff");
		
		// linkGradientFront.append("stop")
		// 	.attr("offset", "100%")
		// 	.attr("stop-color", "#f7931e");
		
		var colours = ["#c300ff", "#f7931e", "#f7931e", "#c300ff"];
		linkGradientFront.selectAll(".stop")
			.data(colours)
			.enter().append("stop")
			.attr("offset", function(d,i) { return i/(colours.length-1); })   
			.attr("stop-color", function(d) { return d; });

		linkGradientFront.append("animate")
			.attr("attributeName","x1")
			.attr("values","0%;100%")
			.attr("dur","3s")
			.attr("repeatCount","indefinite");
		
		linkGradientFront.append("animate")
			.attr("attributeName","x2")
			.attr("values","100%;200%")
			.attr("dur","3s")
			.attr("repeatCount","indefinite");
		
		let linkGradientBack = defs.append("linearGradient")
			.attr("id", "gradient-back")
			.attr("x1","0%")
			.attr("y1","0%")
			.attr("x2","100%")
			.attr("y2","0%")
			.attr("spreadMethod", "reflect");
			
		// linkGradientBack.append("stop")
		// 	.attr("offset", "0%")
		// 	.attr("stop-color", "#f7931e");
		
		// linkGradientBack.append("stop")
		// 	.attr("offset", "100%")
		// 	.attr("stop-color", "#c300ff");

		var coloursBack = ["#f7931e", "#c300ff", "#c300ff", "#f7931e"];
		linkGradientBack.selectAll(".stop")
			.data(coloursBack)
			.enter().append("stop")
			.attr("offset", function(d,i) { return i/(colours.length-1); })   
			.attr("stop-color", function(d) { return d; });
		linkGradientBack.append("animate")
			.attr("attributeName","x1")
			.attr("values","0%;-100%")
			.attr("dur","3s")
			.attr("repeatCount","indefinite");
		
		linkGradientBack.append("animate")
			.attr("attributeName","x2")
			.attr("values","100%;0%")
			.attr("dur","3s")
			.attr("repeatCount","indefinite");


		var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		var linkG = g.append("g")
			.attr("class", "links")
			.attr("fill", "none")
			.attr("stroke-opacity", 0.2)
			.selectAll("path");

		var nodeG = g.append("g")
			.attr("class", "nodes")
			.attr("font-family", "sans-serif")
			.attr("font-size", 10)
			.selectAll("g");

		const nodePadding = 40;

		const circularLinkGap = 2;

		var sankey = d3.sankeyCircular()
			.nodeWidth(10)
			.nodePadding(nodePadding)
			.nodePaddingRatio(0.5)
			//.scale(0.5)
			.size([width, height])
			.nodeId(function(d) {
				return d.name;
			})
			.nodeAlign(d3.sankeyJustify)
			.iterations(32);


		d3.tsv(_datasource)
			.then(function(data) {
				//compute maximum size
				data.forEach(function(d){
					d.value = Math.max(d[valueNames.value1]*1, d[valueNames.value2]*1);
				})

				data.sort(function(x, y) {
					return d3.descending(x.value, y.value);
				})
				//if an edge is selected, filter the data
				if(_filter != null){
					console.log('filter', _filter)
					var data = data.filter(function(d){

						var steps = []
						for (header in headers) {
							if (d[headers[header]] != "") {
								steps.push(d[headers[header]])
							}
						}
						for(var i = 0; i < steps.length-1; i++){
							//check the link
							if((_filter.source == null || steps[i] == _filter.source) && (_filter.target == null || steps[i+1] == _filter.target)){
								return true;
							}
						}

						return false
					})
					//remove threshold
					_threshold = data.length;
					//enable breadcrumb panel
					d3.select('#breadcrumb-panel')
						.style("visibility", "visible");
					var breadcrumb = d3.select('#breadcrumb')
						.html("")
						.append('span')
						.text(_filter.source)
						.attr('class','source')
						.append('span')
						.text(" > ")
						.attr('class','arrow')
						.append('span')
						.text(_filter.target)
						.attr('class','target')
						.append('button')
						.text('X')
						.on('click', function(){
							//remove filter
							drawEverything(_datasource, _threshold);
						})

				} else {
					// no filter
					d3.select('#breadcrumb-panel')
						.style("visibility", "hidden");
				}

				//update slider
				slider.max = data.length;

				function getNodes(_data) {
					let _nodes = [];
					_data.forEach(function(d) {

						for (header in headers) {
							if (d[headers[header]] != '') {
								var n = {
									'name': d[headers[header]],
									'type': headers[header],
									'value': Math.max(d[valueNames.value1]*1, d[valueNames.value2]*1)
								}
								_nodes.push(n);
							}
						}
					})
					return _nodes;
				}
				//get nodes for filtered section
				let nodes = getNodes(data.slice(0, _threshold));
				let uniqueNodes = d3.map(nodes, function(d){
					return d.name;
				})
				//now, for each flow aggregate the remaining ones
				data.forEach(function(d){
					for (header in headers) {
						if (d[headers[header]] != '' && !uniqueNodes.has(d[headers[header]])) {
							d[headers[header]] = 'other ' + headers[header];
						}
					}
				})
				//recalculate nodes
				nodes = getNodes(data);

				nodes = d3.nest()
					.key(function(d){return d.name})
					.key(function(d) {
						return d.type;
					})
					.rollup(function(v){
						return d3.sum(v, function(w) {
							return w.value
						})

					}).entries(nodes)
					.map(function(d){
						d.name = d.key
						delete(d.key)
						d.values.forEach(function(e){
							d[e.key] = e.value;
						})
						d.values.sort(function(x, y) {
							return d3.descending(x.value, y.value);
						})
						d.mainType = d.values[0].key
						delete(d.values)
						return d
					})

				//get edges
				let edges = []
				//get all edges
				data.map(function(d) {
					var steps = []
					for (header in headers) {
						if (d[headers[header]] != "") {
							steps.push(d[headers[header]])
						}
					}
					//Create edges
					for (var i = 1; i < steps.length; i++) {
						let e = {
							source: steps[i - 1],
							target: steps[i],
							value: +d[valueNames.value1],
							value2: +d[valueNames.value2]
						}

						edges.push(e);
					}

				})
				//sum and reduce
				let finalEdges = []
				d3.nest()
					.key(function(d) {
						return d.source;
					})
					.key(function(d) {
						return d.target;
					})
					.rollup(function(v) {
						let v1 = d3.sum(v, function(w) {
							return w.value
						})
						let v2 = d3.sum(v, function(w) {
							return w.value2
						})
						return {
							'v1': v1,
							'v2': v2
						};
					})
					.entries(edges)
					.map(function(d) {
						d.values.forEach(function(e) {
							if (d.key != e.key) {
								let r = {
									source: d.key,
									target: e.key,
									value: Math.max(e.value.v1, e.value.v2),
									value2: Math.min(e.value.v1, e.value.v2),
									id: finalEdges.length
								}
								finalEdges.push(r);
							}
						})
					})

				results = {
					nodes: nodes,
					links: finalEdges
				}
				// console.log(data2)

				let sankeyData = sankey(results);
				let sankeyNodes = sankeyData.nodes;
				let sankeyLinks = sankeyData.links;


				var colDomain = []
				for(var i in headers){
					colDomain.push(headers[i])
				}

				var nodeColour = d3.scaleOrdinal()
					.domain(colDomain)
					.range(d3.schemeCategory10)

				//Adjust link Y coordinates based on target/source Y positions

				var node = nodeG.data(sankeyNodes)
					.enter()
					.append("g");

				node.append("rect")
					.attr("x", function(d) {
						return d.x0;
					})
					.attr("y", function(d) {
						return d.y0;
					})
					.attr("height", function(d) {
						return d.y1 - d.y0;
					})
					.attr("width", function(d) {
						return d.x1 - d.x0;
					})
					.style("fill", function(d) {
						return nodeColour(d.mainType);
					})
					.style("opacity", 0.5)
					.on("mouseover", function(d) {

						let thisName = d.name;

						node.selectAll("rect")
							.style("opacity", function(d) {
								return highlightNodes(d, thisName)
							})

						d3.selectAll(".sankey-link")
							.style("opacity", function(l) {
								return l.source.name == thisName || l.target.name == thisName ? 1 : 0.3;
							})

						node.selectAll("text")
							.style("opacity", function(d) {
								return highlightNodes(d, thisName)
							})
					})
					.on("mouseout", function(d) {
						d3.selectAll("rect").style("opacity", 0.5);
						d3.selectAll(".sankey-link").style("opacity", 0.7);
						d3.selectAll("text").style("opacity", 1);
					})

				node.append("text")
					.attr("x", function(d) {
						return (d.x0 + d.x1) / 2;
					})
					.attr("y", function(d) {
						return d.y0 - 12;
					})
					.attr("dy", "0.35em")
					.attr("text-anchor", "middle")
					.text(function(d) {
						return d.name;
					});

				node.append("title")
					.text(function(d) {
						return d.name + "\nMain type: " + d.mainType + "\nTotal flows: " + (Math.round(d.value));
					});

				var link = linkG.data(sankeyLinks)
					.enter()
					.append("g")

				var underLink = link.append("path")
					.attr("class", "sankey-underlink")
					.attr("d", function(link) {return link.path})
					//decide which gradient should be used
					.attr("stroke", d => {
						if (d.source.x0 < d.target.x0) {
							return "url(#gradient-front)"
						} else {
							return "url(#gradient-back)"
						}
						// return "#aaa"
					})
					.style("stroke-width", function(d) {
						return Math.max(1, d.width);
					})
					//apply svg blur
					// .attr("filter", (d) => `url(#blur-${d.id})`)
					// previous version of link styles
					// .style("opacity", 0.7)
					// .style("stroke", function(link, i) {
					// 	//return link.circular ? "red" : "black"
					// 	return "red"
					// })

				link.append("title")
					.text(function(d) {
						return d.source.name + " → " + d.target.name + "\n Index: " + (d.index);
					});

				var overLink = link.append("path")
					// .attr("class", "link-over")
					.attr("class", "sankey-overlink")
					.attr("d", function(link) {return link.path})
					.attr("stroke", d => {
						if (d.source.x0 < d.target.x0) {
							return "url(#gradient-front)"
						} else {
							return "url(#gradient-back)"
						}
					})
					.style("stroke-width", function(d) {
						d.width2 = d.value2 * d.width / d.value
						return d.width2;
					})
					.style("opacity", 1)
					// .style("stroke", "red")

				// var movementMarker = link.append("path")
				// 	// .attr("class", "link-over")
				// 	.attr("class", "sankey-movement-marker")
				// 	.attr("d", function(link) {return link.path})
				// 	.attr("stroke", d => {
				// 		// if (d.source.x0 < d.target.x0) {
				// 		// 	return "url(#gradient-front)"
				// 		// } else {
				// 		// 	return "url(#gradient-back)"
				// 		// }
				// 		return "#aaa";
				// 	})
				// 	.style("stroke-width", function(d) {
				// 		d.width2 = d.value2 * d.width / d.value
				// 		return d.width2;
				// 	});

				function highlightNodes(node, name) {

					let opacity = 0.3

					if (node.name == name) {
						opacity = 1;
					}
					node.sourceLinks.forEach(function(link) {
						if (link.target.name == name) {
							opacity = 1;
						};
					})
					node.targetLinks.forEach(function(link) {
						if (link.source.name == name) {
							opacity = 1;
						};
					})

					return opacity;

				}
				//
				link.on("click", function(d) {
					console.log(d);
					//define the filter
					let f = {
						'source': d.source.name.includes('other') ? null : d.source.name,
						'target': d.target.name.includes('other') ? null : d.target.name
					}
					//redraw with the
					//FIX: find a better way
					drawEverything(_datasource, _threshold, f);
				})

				//drag
				node.call(d3.drag()
					.subject(function(d) {
						return d;
					})
					.on("start", function(d) {
						// console.log(d)
					})
					.on("drag", function(d) {
						var w = d.x1 - d.x0;
						d.x0 = d3.event.x;
						d.x1 = d.x0 + w;

						var h = d.y1 - d.y0;
						d.y0 = d3.event.y;
						d.y1 = d.y0 + h;
						sankeyData = sankey.update(sankeyData);

						link.data(sankeyData.links);

						//update nodes
						node.selectAll("rect")
							.attr("x", function(d) {
								return d.x0;
							})
							.attr("y", function(d) {
								return d.y0;
							})
						node.selectAll("text")
							.attr("x", function(d) {
								return (d.x0 + d.x1) / 2;
							})
							.attr("y", function(d) {
								return d.y0 - 12;
							})
						link.selectAll('path')
							.attr("d", function(link) {return link.path})
					}));
			})
	}
});
