function hsTradeVis() {

	// ----------------------------------------------------------------------------------------------
	// Setup
	var margin = 10,
    sidebarWidth = 350, 
    maxWidth = 1600, 
    radiusScale = 1, 
	width = Math.min(parseInt(d3.select("body").style("width")) - sidebarWidth, maxWidth), 
	diameter = width;

	var pack = d3.layout.pack()
			   .padding(1)
			   .size([diameter - 2 * margin, diameter - 2 * margin])
			   .value(function(d) { return d.size; })
			   
	var topShift = margin - 0.13* width;

	var svg = d3.select("#vis").append("svg")
			  .attr("width", diameter)
			  .attr("height", diameter)
	  	  	  .append("g")
	  	  	  .attr("transform", "translate(" + margin + "," + topShift + ")");
	  	  	  
	var colourRanges = [
		// {"depth": 1, "upper": "rgb(220, 134, 59)", "lower": "rgb(127, 147, 154)"}
		{"depth": 1, "upper": "blue", "lower": "green"}
	];
	
	// ----------------------------------------------------------------------------------------------
	// Convert raw data to tree structure
	function convertTree(raw) {		
		// Root
		treeData = {
			"name": "HS-TRADE", 
			"code": "0", 
			"depth": 0
		};
	
		var currentParent = treeData; // Start at root
	
		// Parse raw data and turn it into a tree (ie nested arrays)
		for (var i = 0; i < raw.length; i++) {
			var x = raw[i];
			x.size = 16;
			if (x.code.length < 10) {
				x.depth = x.code.length / 2;
			} else {
				x.depth = 4;
			}
			var newChild = {
				"name": x.descriptor, 
				"code": x.code, 
				"depth": x.depth,
				"size": x.size
			};
		
			if (newChild.depth > currentParent.depth + 1) {
				currentParent = currentParent.children[currentParent.children.length - 1];
			} else if (newChild.depth <= currentParent.depth) {
				var cpd = currentParent.depth;
				for (var j = 0; j < cpd - newChild.depth + 1; j++) {
					currentParent = currentParent.parent;
				}
			}
		
			newChild.parent = currentParent;
			if (!currentParent.children) {
				currentParent.children = [];
			}
			currentParent.children.push(newChild);
		}
	
		return treeData;
	};
	
	// ----------------------------------------------------------------------------------------------
	// Clear info area
	function clearInfo(clicked) {
		d3.selectAll("circle.selected").classed("selected", false);
		d3.select("#info-title").text("");
		d3.selectAll("#info-list").selectAll("li").remove();
		
		d3.event.stopPropagation();
		d3.event.preventDefault();
	};
	
	// ----------------------------------------------------------------------------------------------
	// Show info for clicked circle
	function showInfo(node, clicked) {
		if (d3.select(clicked).classed("selected")) {
			// Node is already selected, so just deselect it
			clearInfo(clicked);
		} else {
			// Show info for this node
			d3.select("#info-title").text(node.name + " [" + node.code + "]");
		
			// Handle selection class
			d3.selectAll("circle.selected").classed("selected", false);
			d3.select(clicked).classed("selected", true);
		
			// Clear the children list
			d3.select("#info-list").selectAll("li").remove();	
	
			// List all direct children of this node
			if (node.children) {
				children = node.children.sort(function(a, b){
					return a.code - b.code;
				});
				d3.select("#info-list").selectAll("li")
					.data(children)
					.enter()
					.append("li")
					.text(function(d) { return d.name + " [" + d.code + "]"; });
			}
		}
		
		d3.event.stopPropagation();
		d3.event.preventDefault();
	};
	
	// ----------------------------------------------------------------------------------------------
	// Set up colour scale function for given depth
	function setupColourScale(nodes, depth) {
		var subnodes = nodes.filter(function(d) {
			return d.depth == depth;
		});
		
		var range = colourRanges.filter(function(d) {
			return d.depth == depth;
		});
		
		var colour = d3.scale.linear()
					 .domain(d3.extent(subnodes, function(d) { return d.r; }))
					 .range([range[0].lower, range[0].upper])
					 .interpolate(d3.interpolateHcl);
					 
		return colour;
	}
	
	// ----------------------------------------------------------------------------------------------
	// Draw packed circles visualisation
	function drawCircles(root) {
		var nodes = pack.nodes(root);
		
		var colour1 = setupColourScale(nodes, 1);
		
		var circle = svg.selectAll("circle")
      				 .data(nodes)
 				     .enter().append("circle")
			         .attr("class", function(d) { return d.parent ? d.children ? "node depth-" + d.depth : "node node--leaf depth-" + d.depth : "node node--root depth-" + d.depth; })
			         .attr("r", function(d) { return radiusScale * d.r; })
			         .attr("cx", function(d) { return d.x; })
			         .attr("cy", function(d) { return d.y; })
			         .style("fill", function(d) {
			         	if (d.depth == 1) {
			         		return colour1(d.r);
						} else { 
			         		return null;
			         	}
			         })
      				 .on("click", function(d) { showInfo(d, this) });
      	
      	d3.select(self.frameElement).style("height", diameter + "px");
	};
	
	// Load data and go! 
	d3.tsv("nzhsc.tsv", function(d) {
		return {
			code: d.Code, 
			descriptor: d.Descriptor		
		};
	}, function(error, rows) {
		// Parse the data into a tree
		var root = convertTree(rows);
		
		// Draw
		drawCircles(root);
		
		// Miscellaneous
		d3.select("#vis").on("click", function() { clearInfo(this); });
		d3.select("body").on("dblclick", function() { console.log("ya"); d3.event.stopPropagation(); d3.event.preventDefault(); } );
		
	});
}

hsTradeVis();