function hsTradeVis() {

	// ----------------------------------------------------------------------------------------------
	// Setup
	var margin = 10,
    sidebarWidth = 350, 
    maxWidth = 1600, 
    minWidth = 1000,
    radiusScale = 1, 
	width = Math.max(Math.min(parseInt(d3.select("body").style("width")), maxWidth), minWidth), 
	diameter = width - sidebarWidth;
	
	var overallWidth = width + sidebarWidth;
	d3.select("body").style("width", overallWidth + "px");

	var pack = d3.layout.pack()
			   .padding(1)
			   .size([diameter - 2 * margin, diameter - 2 * margin])
			   .value(function(d) { return d.size; })
			   
	var topShift = margin - 0.08 * width;

	var svg = d3.select("#vis").append("svg")
			  .attr("width", diameter)
			  .attr("height", diameter)
	  	  	  .append("g")
	  	  	  .attr("transform", "translate(" + margin + "," + topShift + ")");
			  
	var colour = d3.scale.linear()
    			.domain([-1, 5])
    			.range(["hsl(150,0%,100%)", "hsl(150,0%,0%)"])
   				.interpolate(d3.interpolateHcl);
	
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
	// Show info for clicked circle
	function showInfo(node, clicked) {
		if (d3.select(clicked).classed("selected")) {
			// Node is already selected, so just deselect it
			d3.select(clicked).classed("selected", false);
			d3.select("#info-title").text("");
			d3.selectAll("#info-list").selectAll("li").remove();
		} else {
			// Show info for this node
			d3.select("#info-title").text(node.name);
		
			// Handle selection class
			d3.selectAll(".selected").classed("selected", false);
			d3.select(clicked).classed("selected", true);
		
			// Clear the children list
			d3.select("#info-list").selectAll("li").remove();	
	
			// List all direct children of this node
			if (node.children) {
				d3.select("#info-list").selectAll("li")
					.data(node.children)
					.enter()
					.append("li")
					.text(function(d) { return d.name; });
			}
		}
		
		// d3.event.stopPropagation();
		d3.event.preventDefault();
	}
	
	// ----------------------------------------------------------------------------------------------
	// Draw packed circles visualisation
	function drawCircles(root) {
		var nodes = pack.nodes(root);
		
		var circle = svg.selectAll("circle")
      				 .data(nodes)
 				     .enter().append("circle")
			         .attr("class", function(d) { return d.parent ? d.children ? "node depth-" + d.depth : "node node--leaf depth-" + d.depth : "node node--root depth-" + d.depth; })
			         .attr("r", function(d) { return radiusScale * d.r; })
			         .attr("cx", function(d) { return d.x; })
			         .attr("cy", function(d) { return d.y; })
      				 .on("click", function(d) { showInfo(d, this) });
      	
      	d3.select(self.frameElement).style("height", diameter + "px");
	}
	
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
		
	});
}

hsTradeVis();