"use strict";
const ver = 1937;

const hexRadius = 6;
const hexMargin = 0;

const oceanPercentage = 0.44;
const oceanMargin = {x: 0.1, y: 0.2};

let hexHeight, hexWidth, columns, rows;
let hexagons = [];

const alpha = "0123456789ABCDEF";
const numGeneTypes = 6;
let geneTypeDisplay = numGeneTypes;

function setup() {
    print(ver);
	hexWidth = hexRadius * 2;
	hexHeight = Math.sqrt(3)*hexRadius;
	columns = Math.ceil(window.innerWidth / (hexRadius * 3));
	rows = Math.ceil(window.innerHeight / (hexHeight / 2)) + 1;
	createCanvas((columns + 1/4) * (hexRadius * 3), (rows + 1) * (hexHeight / 2));
    noStroke();
	noiseDetail(8);
    background(45, 67, 185);
	for (let x = 0; x < columns; x++) {
      hexagons.push([]);
      for (let y = 0; y < rows; y++) {
        let genes = [];
        let culture = [];
        for (let i = 0; i < numGeneTypes; i++){
          // Each element of genes array is itself an array of 6 hexadecimal characters 
          genes[i] = [];
          for (let j = 0; j < 6; j++) {
              genes[i][j] = alpha[ Math.floor ( noise ( x + ( 1000 * j ) , ( y + ( 1000 * j ) ) ) * alpha.length) ];
          }
        }
        for (let i = 0; i < 6; i++){
          // culture is a single hexadecimal 'string' (an array of 6 values from 0 to f)
          culture[i] = alpha[ Math.floor ( random() * alpha.length ) ];
        }
        hexagons[x].push(new Hex(x, y, genes, culture));
      }
	}
	// neighbouring needs to be done after they're all initialised. We also draw the underlying map
	for (let x = 0; x < columns; x++) {
		for (let y = 0; y < rows; y++) {
		  hexagons[x][y].initialiseNeighbours(x, y);
          hexagons[x][y].drawTerrain();
		}
	}
}

function draw() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      let hex = hexagons[x][y];
      hex.drawCulture();
      if (!paused){
        hex.checkNeighbours();
      } 
    }
  }
  if (!paused) {
    update();
  }
  redrawAll = false;
}

function update() {
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < columns; x++) {
			let hex = hexagons[x][y];
			hex.updateGenes();
		}
	}
}

class Hex {
  constructor(x, y, genes, culture) {

    // establish grid position
    this.pos = createVector(x, y);

    // establish pixel position
    this.pixelPos = createVector(0, 0);
    this.pixelPos.x = hexWidth * (1.5 * x + 0.5 + y % 2 * 0.75);
    this.pixelPos.y = hexHeight * (y * 0.5 + 0.5);

    // establish terrain
    this.land = getTerrain(x, y);
    
    // establish state
    this.genes = genes;
    this.nextGenes = genes;
    this.culture = culture;
    this.nextCulture = culture;
    this.visibleCulture = false;

    this.newGenes = [];
    for (let i = 0; i < numGeneTypes + 1; i++){
      this.newGenes.push(false);
    }

    // establish neighbours
    this.neighbours = [];
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

  updateGenes() {
    this.genes = this.nextGenes;
    this.culture = this.nextCulture;
  }

  checkNeighbours() {
    if ( this.land ) {
      this.nextGenes = this.genes;

      // Seed a new array of False values, which will be replaced with True if that gene changes (Culture is also tacked on as the last value)
      this.newGenes = [];
      for (let i = 0; i < numGeneTypes + 1; i++){
        this.newGenes.push(false);
      }

      let identicalNeighbours = [true, true, true, true, true, true];
      this.identicalNeighbourCount = 6;
      this.growthNeighbourCount = 6.0;

      // For each type of gene,
      for ( let i = 0; i < numGeneTypes; i++){
        // For each element of the hex string,
        for ( let j = 0; j < 6; j++){
          // there is a 50% chance of picking a replacement from a randomly selected neighbour.
          let pickNewGene = false;
          if (Math.random() < 0.5){
            pickNewGene = true;
          }

          // For each neighbour,
          let nextGeneSelection = []; 
          for ( let k = 0; k < 6; k++ ){
            // If we find a different gene (or ocean) this neighbour is not identical (used later in spreading culture)
            if ( identicalNeighbours[k] === true && ( this.neighbours[k].land === false || this.genes[i][j] !== this.neighbours[k].genes[i][j] ) ) {
              identicalNeighbours[k] = false;
              this.growthNeighbourCount--;
              this.identicalNeighbourCount--;
            }
            // If we decided earlier to pick a new gene, we build an array of neighbours' genes in the same slot to pick from randomly
            if ( pickNewGene === true && this.neighbours[k].land === true ){
              nextGeneSelection.push(this.neighbours[k].genes[i][j]);
            }
          }

          if (pickNewGene == true){
            let nextGene = nextGeneSelection[Math.floor(Math.random() * nextGeneSelection.length)];
            this.nextGenes[i][j] = nextGene;
            this.newGenes[i] = true;
          }
        }
      }

      // Now, if we have x or more neighbours that are identical (or water), our culture spreads to identical neighbours
      // Currently, this favours hexes below and/or to the right of others, as they are processed later and will overwrite previous culture spreads the same turn.
      // But at this stage, this is not worth coming up with a workaround as it would probably rely on a coin toss, which I don't want.
      if ( this.growthNeighbourCount > 1 ){
        for ( let i = 0; i < 6; i++){
          if (identicalNeighbours[i] === true){
            this.neighbours[i].nextCulture = this.culture;
            this.neighbours[i].newGenes[numGeneTypes] = true;
          }
        }
      }

      // Check whether to draw to map - hexes are only shown if they have an identical neighbour.
      for (let n = 0; (this.visibleCulture == false) && (n < 6); n++){
        let identicalCulture = true;
        for (let c = 0; (identicalCulture == true) && (c < 6); c++){
          if(this.culture[c] !== this.neighbours[n].culture[c]){
            identicalCulture = false;
          }
        }
        if (identicalCulture == true){
          this.visibleCulture = true;
          this.neighbours[n].visibleCulture = true;
        }
      }
    }
  }

  drawCulture() {
      if ( this.newGenes[geneTypeDisplay] === true || ( redrawAll === true && this.land === true ) ){
        push();
        if ( geneTypeDisplay < numGeneTypes ){
          let geneString = "#";
          for (let g = 0; g < 6; g++){
            geneString += this.genes[geneTypeDisplay][g];
          }
          fill(geneString);
        } else if ( this.visibleCulture === true ) {
          let cultureString = "#";
          for (let c = 0; c < 6; c++){
            cultureString += this.culture[c];
          }
          fill (cultureString);
        } else {
          this.drawTerrain();
          return;
        }
        translate(this.pixelPos.x, this.pixelPos.y);
        beginShape();
        for (let i = 0; i < 6; i++) {
            vertex((hexRadius-hexMargin/2)*cos(i*Math.PI/3), (hexRadius-hexMargin/2)*sin(i*Math.PI/3));
        }
        endShape(CLOSE);
        pop();
      }
	}
  
  drawTerrain() {
    push();
    if (this.land === false) {
      fill(45, 67, 185)
    } else {
      fill(25, 155, 67)
    }
    translate(this.pixelPos.x, this.pixelPos.y);
    beginShape();
    for (let i = 0; i < 6; i++) {
        vertex((hexRadius-hexMargin/2)*cos(i*Math.PI/3), (hexRadius-hexMargin/2)*sin(i*Math.PI/3));
    }
    endShape(CLOSE);
    strokeWeight(1);
    stroke(128, 128);
    line(-hexRadius,0,hexRadius,0);
    pop();
  }
}

function getTerrain(x, y){
  
  const noiseScale = 24;
  
  const baseNoise = noise( ( x * noiseScale ) / columns, ( y * noiseScale ) / ( columns * 5 ) );

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
    return false;
  } else {
    return true;
  }
}