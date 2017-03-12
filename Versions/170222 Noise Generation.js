"use strict";

const hexRadius = 10;
const hexMargin = 0;

const oceanPercentage = 0.37;
const oceanMargin = {x: 0.1, y: 0.2};

let hexHeight, hexWidth, columns, rows;
let hexagons = [];

let caseStudies = 0; //debug
const alpha = "ABCDEF1234567890";

function setup() {
	hexWidth = hexRadius * 2;
	hexHeight = Math.sqrt(3)*hexRadius;
	columns = Math.ceil(window.innerWidth / (hexRadius * 3));
	rows = Math.ceil(window.innerHeight / (hexHeight / 2)) + 1;
	
	createCanvas((columns + 1/4) * (hexRadius * 3), (rows + 1) * (hexHeight / 2));
	fill(255, 100);
	stroke(255);
	strokeWeight(5);
	noStroke();
	
	for (let x = 0; x < columns; x++) {
		hexagons.push([]);
		for (let y = 0; y < rows; y++) {
			let genes = [];
			for (let i = 0; i < 6; i++) {
				genes[i] = alpha[Math.floor(noise(0.5 * (x + i), 0.15 * (y + i)) * alpha.length)];
            }
			hexagons[x].push(new Hex(x, y, genes));
		}
	}
	// neighbouring needs to be done after they're all initialised
	for (let x = 0; x < columns; x++) {
		for (let y = 0; y < rows; y++) {
		  hexagons[x][y].initialiseNeighbours(x, y);
		}
	}
  
  noLoop();
}

function draw() {
  background(0);
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < columns; x++) {
			let hex = hexagons[x][y];
			hex.draw();
			hex.checkActive();
		}
    }
	update();
}

function update() {
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < columns; x++) {
			let hex = hexagons[x][y];
			hex.updateActive();
		}
	}
}

class Hex {
	constructor(x, y, genes) {
      
		// establish grid position
		this.pos = createVector(x, y);
		
		// establish pixel position
		this.pixelPos = createVector(0, 0);
		this.pixelPos.x = hexWidth * (1.5 * x + 0.5 + y % 2 * 0.75);
		this.pixelPos.y = hexHeight * (y * 0.5 + 0.5);
		
		// establish terrain
		this.land = true;

		const baseNoise = noise( x * 0.2, y * 0.06 );
		
		const relativeX = x / columns;
		const relativeY = y / rows;

		let marginModifierX = 1.0;
		let marginModifierY = 1.0;

		if ( relativeX > ( 1 - oceanMargin.x ) ) {
			marginModifierX = ( 1 - relativeX ) / oceanMargin.x;
		} else if ( relativeX < oceanMargin.x ) {
			marginModifierX = relativeX / oceanMargin.x;
		}

		if ( relativeY > ( 1 - oceanMargin.y ) ) {
			marginModifierY = ( 1 - relativeY ) / oceanMargin.y;
		} else if ( relativeY < oceanMargin.y ) {
			marginModifierY = relativeY / oceanMargin.y;
		}

		if (baseNoise * marginModifierX * marginModifierY < oceanPercentage) {
			this.land = false;
		}

		// establish state
		this.genes = genes;
		this.nextGenes = genes;
		
		// establish neighbours
		this.neighbours = [];
        
        // debug
        this.debug = false;
        if (this.land === true && caseStudies < 1 && random() < 0.001 ){
          this.debug = true;
          print (" new case study! [" + x + ", " + y + "]");
          caseStudies++;
        } else { };
    }
	
	initialiseNeighbours(x, y) {
		let n = [false, false, false, false, false, false];

		if (this.land == true) {
			const odd = y%2;
			
			// above
			if (y >= 2) {
				n[0] = hexagons[x][y-2];
			}
			
			// top right
			if (y >= 1) {
				if (!odd || x < columns-1) {
					n[1] = hexagons[x+odd][y-1];
				}
			}
			
			// bottom right
			if (y < rows-1) {
				if (!odd || x < columns-1) {
					n[2] = hexagons[x+odd][y+1];
				}
			}
			
			// bottom
			if (y < rows-2) {
				n[3] = hexagons[x][y+2];
			}
			
			// bottom left
			if (y < rows-1) {
				if (odd || x >= 1) {
					n[4] = hexagons[x-1+odd][y+1];
				}
			}
			
			// top left
			if (y >= 1) {
				if (odd || x >= 1) {
					n[5] = hexagons[x-1+odd][y-1];
				}
			}
		}

		this.neighbours = n;
	}
	
	updateActive() {
		this.genes = this.nextGenes;
	}
  
	checkActive() {
      if ( this.land ) {
        if (this.debug){ print(this.genes) };
        this.nextGenes = this.genes;
        
        // For each alphanumeric 'slot' in the hex string,
        for ( let i = 0; i < 6; i++){
          // Find most common character in neighbouring hexes and adopt it.
          let neighbourGenes = [];

          for ( let j = 0; j < 6; j++){
            if (this.neighbours[j].land === true && this.neighbours[j].genes[i]){
              if(this.debug === true && i == 0){
                print("neighbour " + j + ": " + this.neighbours[j].genes);
              }
              neighbourGenes.push(this.neighbours[j].genes[i]);
            }
          }
          
          if(this.debug === true){
            print("before function: " + neighbourGenes);
          }
          let neighbourGeneMode = getMode(neighbourGenes, this.debug);

          // If there is one and only one character that appears the most, adopt it
          if (neighbourGeneMode.arr.length == 1 && neighbourGeneMode.count > 2) {
            this.nextGenes[i] = neighbourGeneMode.arr[0];
          } else if ( neighbourGeneMode.count > 1 ) {
            // Else if more than one has tied (with a count of more than 1) pick from them randomly
            this.nextGenes[i] = neighbourGeneMode.arr[Math.floor(random() * neighbourGeneMode.arr.length)];
          }
        }
        if (this.debug) { print(this.nextGenes)};
        
      }
	}
	
	checkNeighbours() {
		return true;
	}
	
	draw() {
        if (this.land == false) {
          fill(45, 67, 185);  
        } else if (this.genes) {
          let geneString = "#";
          for (let i = 0; i < 6; i++){
            geneString += this.genes[i];
          }
          fill(geneString);
		} else {
          fill(25, 155, 67);
		}
		
		push();
		translate(this.pixelPos.x, this.pixelPos.y);
		beginShape();
        if (this.debug){ strokeWeight(2), stroke("red"); }
		for (let i = 0; i < 6; i++) {
			vertex((hexRadius-hexMargin/2)*cos(i*Math.PI/3), (hexRadius-hexMargin/2)*sin(i*Math.PI/3));
		}
        strokeWeight(1);
		endShape(CLOSE);
		if (this.land === false){
          stroke(75, 135, 237);
          line(-hexRadius,0,hexRadius,0);
        }
        pop();
	}
}