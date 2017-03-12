"use strict"
//getMode = function(inputArray, debug) {
//
//  let sortedArray = inputArray.slice().sort();
//  
//  let maxFreq = 1;
//  let results = [];
//  let freq = 1;
//  
//  for ( let k = 0; k < sortedArray.length; k++){
//    if ( sortedArray[k] === sortedArray[k+1] ) {
//      freq++;
//    } else {
//      freq = 1;
//    }
//    if (freq === maxFreq){
//      results.push(sortedArray[k]);
//    } else if (freq > maxFreq){
//      results = [sortedArray[k]];
//      maxFreq = freq;
//    }
//  }
//  return {arr: results, count: maxFreq};
//}

let paused = false;
let redrawAll = false;

function keyPressed(){
  if (keyCode === 13) {
    // Enter for next turn!
    draw();
  } else if (keyCode === 32) {
    // Space bar to play or pause
    paused = !paused;
  } else if (keyCode === 71) {
    // G to toggle display mode
    geneTypeDisplay = ( geneTypeDisplay + 1 ) % ( numGeneTypes + 1 );
    redrawAll = true;
  }
}