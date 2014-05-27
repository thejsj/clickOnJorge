var showHightlightedBlock = false;

/* Canvas
******************************************/

var CanvasBlocks = function(game, sounds){

  this.game = game;
  this.sounds = sounds;
  this.canvas = document.getElementById('main-canvas');
  this.ctx = null; 
  this.gradients = {};
  this.body = document.getElementsByTagName('body')[0];
  this.color = 255;
  this.img = [];
  this.img[0] = document.getElementById("s-icon");
  this.img[1] = document.getElementById("1-icon");
  this.img[2] = document.getElementById("2-icon");
  this.img[3] = document.getElementById("3-icon");
  this.img[4] = document.getElementById("cj-icon");
  this.img[5] = document.getElementById("me-1");
  this.img[6] = document.getElementById("me-2");
  this.img[7] = document.getElementById("me-3");
  this.img[8] = document.getElementById("me-4");
  this.img[9] = document.getElementById("me-5");

  // NOTE: this will change...
  this.canvas.width = this.cWdth = jQuery(window).width();
  this.canvas.height = this.cHght = jQuery(window).height() - 52;

  this.xPos = this.canvas.scrollLeft;
  this.yPos = this.canvas.scrollTop;
  // Get Number of Elements
  this.chooseRandomBlockTimer; 

  /*  Visual Vars
  ******************/
  this.blocks = [];
  this.numElementsX; 
  this.numElementsY;
  this.BlockW; // = this.cWdth / this.numElementsX;
  this.BlockH; // = this.cHght / this.numElementsY;

  this.green = [91,233,193];
  this.white = [255,255,255];
  this.gray = [100,100,100];
  this.grays = [];
  for(var i = 0; i < 10; i ++){
    var color = parseInt(i * (255/10));
    this.grays[i] = [color, color, color];
  }
  this.black = [0,0,0];
  this.sizeNormal = 50; 
  this.sizeHover = 45;
  this.sizeHighlight = 60;

  // Image
  this.imageWidth;//  = this.BlockW - 30; 
  this.imageHeight;

  //Animations
  this.showNumbers = true;

  this.calculateNumOfLements = function(proportion){
    var resultFound = false;
    for(var i = 1; i < 100; i++){
      var ii = Math.pow(proportion, i); 
      var s = Math.pow(this.game.items, (1/proportion)); 
      var r = parseInt(Math.round(s / ii) * ii);
      if( r > 0){
        var rr = parseInt(this.game.items / r)
        if( r % proportion == 0 && rr % proportion == 0){
          if(this.cWdth > this.cHght){
            if(r > rr){
              this.numElementsX = r; 
              this.numElementsY = rr;
            }
            else {
              this.numElementsX = rr; 
              this.numElementsY = r;
            }
          }
          else {
            if(r > rr){
              this.numElementsX = rr; 
              this.numElementsY = r;
            }
            else {
              this.numElementsX = r; 
              this.numElementsY = rr;
            }
          }
          resultFound = true;
          break;
        }
      }
    }
    if(!resultFound){
      return false;
    }
  }

  this.initCanvas = function(){
    // Figure Out how many elements per row and per column & 
    var proportion = this.cWdth / this.cHght;
    var proportionIndex = 2;
    if(proportion > 3 || proportion < (1/3)){
      proportionIndex = 4;
    }
    
    // Draw Them
    if (this.canvas.getContext('2d')) { 

      /*  Canvas
      ******************/
      if (window.devicePixelRatio > 1) {
        $mainCanvas = jQuery('#main-canvas');

        var hidefCanvasWidth = $mainCanvas.attr('width');
        var hidefCanvasHeight = $mainCanvas.attr('height');
        var hidefCanvasCssWidth = hidefCanvasWidth;
        var hidefCanvasCssHeight = hidefCanvasHeight;
    
        $mainCanvas.attr('width', hidefCanvasWidth * window.devicePixelRatio);
        $mainCanvas.attr('height', hidefCanvasHeight * window.devicePixelRatio);
        $mainCanvas.css('width', hidefCanvasCssWidth);
        $mainCanvas.css('height', hidefCanvasCssHeight);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio); 

        alert('This Game Does Not Work Well in Retina Displays. Play At Your Own Risk.')
      }
      else {
        this.ctx = this.canvas.getContext('2d');
      }
      this.calculateNumOfLements(proportionIndex);
      this.BlockW = this.cWdth / this.numElementsX;
      this.BlockH = this.cHght / this.numElementsY;


      // Calculate Gradient
      this.gradients["main"] = calculateGradient(this.ctx, this.BlockW, this.BlockH, this.white, this.green, this.sizeNormal);
      this.gradients["highlight"] = calculateGradient(this.ctx, this.BlockW, this.BlockH, this.green, this.gray, this.sizeHighlight);
      this.gradients["hover"] = calculateGradient(this.ctx, this.BlockW, this.BlockH, this.green, this.black, this.sizeHover);
      this.gradients["click"] = calculateGradient(this.ctx, this.BlockW, this.BlockH, this.gray, this.black, this.sizeHover);
      this.gradients["clicked"] = calculateGradient(this.ctx, this.BlockW, this.BlockH, this.gray, this.black, this.sizeHover);
      // Define Spectrum 
      this.gradients["spectrum"] = [];
      for(var i = 0; i < 10; i++){
        this.gradients["spectrum"][i] = calculateGradient(this.ctx, this.BlockW, this.BlockH, this.grays[i], this.green, this.sizeHover);
      }
    }

    // Image Size
    this.createBlocks(); 
    this.drawBlocks(); 
    var thisCanvas = this;
  }

  this.createBlocks = function(){
    /* Create Elements 
    ******************************************/
    this.blocks = [];
    for(var i = 0; i < this.numElementsX; i++){
      for(var ii = 0; ii < this.numElementsY; ii++){
        this.blocks.push(new Block(
          i,
          ii,
          i * this.BlockW, 
          ii * this.BlockH,
          this.BlockW,
          this.BlockH
          )
        );
      }
    }
  }

  this.drawBlocks = function(){
    for(var i = 0; i < this.blocks.length; i++){
      this.blocks[i].drawBlock();
    }
  }
  this.animateBlocksFromRightToLeft = function(callback, animations, showNumbers, playSound){
    
    // Animations
    this.animationIndex = this.numElementsX; 
    this.animations = (animations === undefined) ? 3 : animations; 
    this.showNumbers = (showNumbers === undefined) ? true : showNumbers; 
    playSound = (playSound === undefined) ? true : playSound; 
    function animate(that){
      // Loop through all blocks
      for(var i = 0; i < that.blocks.length; i++){
        // If Animation Index is lower or equal to its X Position
        // Determine Index between 0 and 10
        var index = Math.min(10, Math.max(0,that.blocks[i].xi - that.animationIndex));
        // Set Animation Highlight State
        that.blocks[i].animationHighlight = index;
        if(that.showNumbers && index > 0){
           that.blocks[i].imageToShow = that.animations;
        }
      }
      if(that.animationIndex >= -that.numElementsX){
        that.animationIndex--;
        setTimeout(function(){
          animate(that); 
        }, 40);
      }
      else {
        that.animationIndex = that.numElementsX;
        // Reset Animation Index
        for(var i = 0; i < that.blocks.length; i++){
          that.blocks[i].animationHighlight = 0;
        }
        if(that.animations > 0){
          if(playSound){ 
            console.log(this.sounds);
            this.sounds.animationSound() 
          };
          that.animations--;
          animate(that);
        }
        else {
          if(playSound){ this.sounds.startGame() };
          if(callback !== undefined){
            callback();
          }
        }
      }
    }
    //if(playSound){ this.sounds.animationSound() };
    animate(this);
  }

  // onmousemove
  this.checkHover = function(position){
    for(var i = 0; i < this.blocks.length; i++){
      this.blocks[i].checkHover(position);
    }
  }
  // onmousedown
  this.checkClick = function(position){
    for(var i = 0; i < this.blocks.length; i++){
      this.blocks[i].checkClick(position);
    }
  }

  this.resetBlocks = function(){
    for(var i = 0; i < this.blocks.length; i++){
      this.blocks[i].resetBlock();
    }
  }

  this.turnOff = function(){
    for(var i = 0; i < this.blocks.length; i++){
      this.blocks[i].resetBlock();
      this.blocks[i].turnOff();
    }
  }

  this.turnOn = function(){
    for(var i = 0; i < this.blocks.length; i++){
      this.blocks[i].turnOn();
    }
  }

  this.forceHiglightBlocks = function(){
    for(var i = 0; i < this.blocks.length; i++){
      this.blocks[i].forceHiglight();
    }
  }
  
  this.chooseRandomBlock = function(key){
    if(key !== undefined){
      for(var i = 0; i < this.blocks.length; i++){
        if(i == key){
          this.blocks[i].highlightBlock(true);
        }
        else {
          this.blocks[i].highlightBlock();
        }
      }
      // Dispath On Block Highlithed Change
      jQuery(document).trigger("highlithedBlockChange");
    }
  }

  this.bindClickAndHover = function(){
    var thisCanvas = this;

    // Desktop
    this.body.onmousemove = function(event){
      thisCanvas.checkHover(getCursorPosition("#main-canvas", event)); 
    };
    this.body.onmousedown = function(event){
      thisCanvas.checkClick(getCursorPosition("#main-canvas", event)); 
      // Dispath On Click Event
      jQuery(document).trigger("canvasClicked");
    }

    // Movile 
    this.body.ontouchstart = function(event){
      thisCanvas.checkClick(getCursorPosition("#main-canvas", event)); 
      // Dispath On Click Event
      jQuery(document).trigger("canvasClicked");
    }
    // Dispath On Block Highlithed Change
    jQuery(document).trigger("gameStart");
    //jQuery(document).trigger( onGameStartEvent );
  }

  /* Block Object
  **************************/

  var thisGame = this;

  var Block = function(xIndex, yIndex, x, y, width, height){

    // Visual Stuff
    this.xi = xIndex; 
    this.yi = yIndex; 
    this.x = x; 
    this.y = y;
    this.w = width;
    this.h = height;
    this.default_image = parseInt(Math.random() * 4) + 5;

    // States
    this.hover = false;
    this.highlight = false; 
    this.click = false; // Clicked this last instance
    this.animationHighlight = 0;
    this.imageToShow = 0; 
    this.off = true;

    this.drawBlock = function(){
      // Draw Gradient
      thisGame.ctx.save();
      thisGame.ctx.translate(this.x,this.y);
        if(this.off || this.animationHighlight != 0){
          if(this.animationHighlight !== NaN && (this.animationHighlight > 0 && this.animationHighlight <= 9)){
            boxFillStyle = thisGame.gradients['spectrum'][this.animationHighlight];
          }
          else {
            boxFillStyle = thisGame.gradients['main'];
          }
        }
        else {
          this.imageToShow = 0;
          if(!this.click){ // Element has not been clicked
            if(this.hover && this.highlight){ // Element is highlighted and hovered
              this.imageToShow = 4;
              boxFillStyle =  thisGame.gradients['click'];
            }
            else if(this.hover){ // If it's hovered
              boxFillStyle = thisGame.gradients['highlight'];
            }
            else if(this.highlight){ // If it's highlighted
              this.imageToShow = 4;
              boxFillStyle = thisGame.gradients['hover'];
            }
            else if(this.clicked){
              boxFillStyle = thisGame.gradients['clicked'];
            }
            else { // Normal Block
              boxFillStyle = thisGame.gradients['main'];
            }
          } //clicked
          else {
            if(!this.highlight){ // If it's 
              thisGame.sounds.click();
              boxFillStyle = thisGame.gradients['main'];
            }
            else {
              thisGame.sounds.jorgeClick();
              this.imageToShow = 4;
              boxFillStyle =  thisGame.gradients['click'];
              this.click = false; 
              thisGame.game.clickOnJorge();
            }
          }
        }
        thisGame.ctx.fillStyle = boxFillStyle;
        thisGame.ctx.fill();
        thisGame.ctx.fillRect(0,0,this.w,this.h);
        thisGame.ctx.lineWidth = 1;
        thisGame.ctx.strokeStyle = "#fff";
        thisGame.ctx.stroke();
        thisGame.ctx.strokeRect(0,0,this.w,this.h);
      thisGame.ctx.restore();

      // Draw Text
      thisGame.ctx.save();
      thisGame.ctx.translate(this.x, this.y);
        thisGame.ctx.font="10px Arial";
        thisGame.ctx.textAlign = 'center';
        thisGame.ctx.fillStyle = '#777';
        thisGame.ctx.fill();
        if(this.imageToShow != 0){ // Show Highlighted Image
          if(this.h < this.w){
            this.imageHeight = this.h - 10; 
            this.imageWidth = parseInt(parseFloat(this.h - 10) * ((parseFloat(thisGame.img[this.imageToShow].width) / parseFloat(thisGame.img[this.imageToShow].height))));
          }
          else {
            this.imageWidth = this.w - 10; 
            this.imageHeight = parseInt(parseFloat(this.w - 10) * ((parseFloat(thisGame.img[this.imageToShow].height) / parseFloat(thisGame.img[this.imageToShow].width))));
          }
          thisGame.ctx.drawImage(thisGame.img[this.imageToShow],(this.w/2) - (this.imageWidth/2),(this.h/2) - (this.imageHeight/2),this.imageWidth, this.imageHeight);
        }
        else if(!this.off) { // Show a Block's Default Image
          if(this.h < this.w){
            this.imageHeight = this.h - 10; 
            this.imageWidth = parseInt(parseFloat(this.h - 10) * ((parseFloat(thisGame.img[this.default_image].width) / parseFloat(thisGame.img[this.default_image].height))));
          }
          else {
            this.imageWidth = this.w - 10; 
            this.imageHeight = parseInt(parseFloat(this.w - 10) * ((parseFloat(thisGame.img[this.default_image].height) / parseFloat(thisGame.img[this.default_image].width))));
          }
          thisGame.ctx.drawImage(thisGame.img[this.default_image],(this.w/2) - (this.imageWidth/2),(this.h/2) - (this.imageHeight/2),this.imageWidth, this.imageHeight);
        }
      thisGame.ctx.restore();
      if(this.click){
        this.click = false;
        this.clicked = true;
      }
    }

    this.checkHover = function(position){
      this.hover = this.checkPosition(position.x, position.y);
    }

    this.checkClick = function(position){
      this.clicked = false;
      this.click = this.checkPosition(position.x, position.y);
    }

    this.highlightBlock = function(bool){
      if(bool === undefined || !(bool == true || bool == false )){
        bool = false;
      }
      this.highlight = bool;
    }

    this.forceHiglight = function(){
      this.highlight = true;
    }

    this.checkPosition = function(mouseX, mouseY){
      if(mouseX >= this.x && mouseY >= this.y &&  mouseX <= (this.x + this.w) && mouseY <= (this.y + this.h)){
        return true;
      }
      else {
        return false;
      }
    }

    this.resetBlock = function(){
      this.hover = false;
      this.highlight = false; 
      this.click = false;
      this.clicked = false;
    }

    this.turnOff = function(){
      this.off = true;
    }

    this.turnOn = function(){
      this.off = false;
    }
  }

}
/* Functions
******************************************/

function showImage(imgPath, callback) {
  var myImage = new Image();
  myImage.name = imgPath;
  myImage.onload = findHHandWW;
  myImage.src = imgPath;
  function findHHandWW() {
    imgHeight = this.height;
    imgWidth = this.width;
    return true;
  }
  if(callback !== undefined)
  callback();
}

function calculateGradient(ctx, width, height, color1, color2, size) {
  var rx = width/2,
      ry = height/2;
  var grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, size); 
  grad.addColorStop(0, ['rgb(', (color1[0]), ', ', (color1[1]), ', ', (color1[2]), ')'].join(''));
  grad.addColorStop(1, ['rgb(', (color2[0]), ', ', (color2[1]), ', ', (color2[2]), ')'].join(''));
  return grad;
}

function getCursorPosition(canvas, event) {
  var x, y;
  canoffset = jQuery(canvas).offset();
  var position = {};
  position.x = event.clientX;// - Math.floor(canoffset.left);
  position.y = event.clientY - 52;//- Math.floor(canoffset.top) + 1;
  return position;
}

module.exports = CanvasBlocks; 
