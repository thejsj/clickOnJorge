(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* TODO

+ Browser Testing. 

	- IE10?

+ Mobile: Doesn't set canvas to correct height

+ Mobile: On Click Doesn't Work... 

+ Mobile: Not correct number of blocks

DONE:

- Regenearte Blocks Width and Height on New Game
w
- Add Google Analytics

- Increse Default Speed of Game

- Add Faces to all blocks

- Add FB Icons to Facebook Application Page

- Add High Scores URL

- Fix Bugs. Is it crashing? When? 

- Make menu Mobile Friendly

- Make All Images 100px by 100px. All should display correctly

- Optimize For Retina

- Sound on Animation

- Browser Testing. 
	
	- Safari: Width of Menu Items not set correclty

	- Firefox: Margin on top Menu Items not correct

Won't Do: 

+ Record "OUch"

*/

window.jQuery                = window.jQuery || require('jquery');
var ClickOnJorgeGameInstance = require('../classes/coj-game');
var GameInterface            = require('../classes/coj-interface');
var GameSounds               = require('../classes/coj-sound');
var CanvasBlocks             = require('../classes/coj-canvas');

(function ($) {

	var classes = [
		"no-canvas"   
		, "no-history" 
		, "no-rgba"
		, "no-opacity" 
		, "no-csstransitions"
		, "no-audio"
	];

	for(i in classes){
		if(jQuery("body").hasClass(classes[i])){
			jQuery("#site-unavailable-message").show();
		}
	}


	// Create New Game
	var currentGame = new ClickOnJorgeGameInstance();
	var gameInterface = new GameInterface(currentGame);
	var sounds = new GameSounds(); 
	var blocks = new CanvasBlocks(currentGame, sounds);
	var drawingLoopTimer;
	var updateLoopTimer;
	var interval_activated = true;

	function initGame(){
		// Make all the appropriate dialogs and sliders
		// then, bring up a dialog box with the instructions and settings

		gameInterface.mobileWarning();

		gameInterface.init(function(){
			// Calculate the number of blocks (x and y)
			// Create Gradients, block objects, and bind canvas element
			blocks.initCanvas();
			// Set a loop to continuesly draw in the canvas. This will never stop
			drawingLoopTimer = setInterval(function(){
				blocks.drawBlocks();
			}, 10);
			// When Animation Ends, bind clicks and Hover
			blocks.bindClickAndHover(); // This event dispathces gameStart Event
		});
	}

	/*   Add All Event Listeners 
	******************************/ 

	// On Game Start
	jQuery(document).on("gameStart",function(){
		// Reset time started, scores, random key, etc
		currentGame.startNewGame();
		// Bring up the scores already populated
		gameInterface.startGame();
		blocks.initCanvas(); 
		// Animate the blocks with a 3,2,1 countdown
		blocks.animateBlocksFromRightToLeft(function(){
			currentGame.startNewGame();
			// Reset block properties (clicked, hovered, highlight...)
			blocks.resetBlocks();
			blocks.turnOn();
			// Choose and initial random block to hightlight and continue doing this until the game stops
			blocks.chooseRandomBlock(currentGame.updateRandomKey());
			blocks.chooseRandomBlockTimer = setInterval(function(){
				blocks.chooseRandomBlock(currentGame.updateRandomKey());
			}, currentGame.time_interval() ); // The time interval was chosen in the settings

			// Start updating the time and the score
			interval_activated = true;
			updateLoopTimer = setInterval(function(){
				if(interval_activated){
					currentGame.calculateScore();
					if(currentGame.setTopTime()){
						gameInterface.updateAllStats();
					}
					else {
						try {
							jQuery( "body" ).trigger("gameEnd");
							jQuery( "body" ).trigger("timeRanOut");
						}
						catch(err){
							console.log("trying to dispatchEvent")
							console.log(err);
						}
					}
				}
			},100);
		}, 3, true, true);
	});


	// On Canvas Click
	jQuery(document).on("canvasClicked",function(){
		// Add to # of clicks executed by the user
		currentGame.increaseClicks();
	});


	// On Highlithed Block Change
	jQuery(document).on("highlithedBlockChange",function(){
		
	});


	// On Game End
	jQuery(document).on("gameEnd", function(event){
		gameInterface.stopGame(currentGame.jorgeClicks, currentGame.calculateScore());
		interval_activated = false;
		// Stop updating time and changing higlighted blocks
		clearInterval(updateLoopTimer);
		updateLoopTimer = undefined;
		clearInterval(blocks.chooseRandomBlockTimer);
		// Stop updating score and time
		currentGame.stopGame(); 
		gameInterface.updateAllStats();
		// Reset block properties (clicked, hovered, highlight...)
		blocks.turnOff();
	});

	jQuery(document).on("timeRanOut", function(event){
		sounds.lose();
		// Animate the blocks one time
		blocks.animateBlocksFromRightToLeft(function(){
			// Open a dialog saying that you won!
			gameInterface.openWinningDialog();
			callAjax(gameInterface.openFacebookLink);
			// Reset time started, scores, random key, etc
			currentGame.startNewGame();
			currentGame.stopGame(); 
		}, 0, false, false);
	});

	jQuery(document).on('game5secondsLeft', function(){
		if(interval_activated){
			sounds.gameAlmostDone();
			for(var i = 1; i < 5; i++){
				setTimeout(function(){
					if(interval_activated){
						sounds.gameAlmostDone();
					}
				}, i * 1000);
			}
			gameInterface.gameAlmostDone();
		}
	});

	document.onkeypress = function(){
		jQuery( "body" ).trigger("gameEnd");
	};


	function callAjax(callback){
		jQuery.post(
		// see tip #1 for how we declare global javascript variables
		MyAjax.ajaxurl,
		{
			// here we declare the parameters to send along with the request
			// this means the following action hooks will be fired:
			// wp_ajax_nopriv_myajax-submit and wp_ajax_myajax-submit
			action : 'myajax-submit',
			current_blocks: currentGame.items,
			current_speed : currentGame.speed,  
			current_score : currentGame.calculateScore(),
			current_clicks : currentGame.clicks, 
			current_jorgeClicks : currentGame.jorgeClicks, 
	 
			// other parameters can be added along with "action"
			message : MyAjax.message
		},
		function( response ) {
			console.log(response);
			// Let's create some uneeded anticipation!
			setTimeout(function(){
				if(response['made_high_score'] < 50){
					gameInterface.updateGameEndDialog(true);
					sounds.newHighScore();
				}
				else {
					gameInterface.updateGameEndDialog(false);
				}
				callback(response["new_post_url"]);
			}, 3000);
		});
	};

	jQuery(document).ready(function(){
		initGame();
		// For the Mobile Menu
		jQuery("a.mobile-menu").click(function(){
			jQuery("#menu-container").toggleClass('uncollapsed');
		});
	});	

}(window.jQuery));

},{"../classes/coj-canvas":2,"../classes/coj-game":3,"../classes/coj-interface":4,"../classes/coj-sound":5,"jquery":7}],2:[function(require,module,exports){
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
          if(playSound){ this.sounds.animationSound() };
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

},{}],3:[function(require,module,exports){
var ClickOnJorgeGameInstance= function() {
    "use strict";
    // Game On/Off
    this.keep_going = true;
    this.time_updating = true;
    // Difficulty Settings
    this.speed = 20;
    this.times_changed = 0;
    // Played...
    this.clicks = 0;
    this.jorgeClicks = 0; 
    // Random Key
    this.random_key = parseInt(Math.random() * this.items, 10);
    // Maximums and Minimums
    this.increment = 16;
    this.min_items = this.increment;
    this.max_items = this.increment * 10;
    this.items = this.max_items / 2;

    this.min_time_interval = 100;
    this.max_time_interval = 1000;
    this.min_speed = 1;
    this.max_speed = 100;

    this.start_time = null;
    this.game_duration = 1000 * 20; // 20 Seconds
    this.time_remaining = this.game_duration; 
    this.time_elapsed = 0;
    this.under_five_seconds_left = false; 

    this.startNewGame = function () {
        this.keep_going = true;
        this.time_updating = true;
        this.times_changed = 0;
        this.clicks = 0;
        this.jorgeClicks = 0;
        this.start_time = (new Date).getTime();
        this.time_elapsed = 0;
        this.time_remaining = this.game_duration; 
        this.under_five_seconds_left = false; 
        this.setTopTime();
    };

    this.increaseClicks = function (){
        this.clicks++; 
        return true;
    }
    this.setTopTime = function () {
        var that = this;
        that.time_elapsed = (new Date).getTime() - that.start_time;
        that.time_remaining = that.game_duration - that.time_elapsed;
        if(that.time_remaining <= 5000 && !that.under_five_seconds_left){
            that.under_five_seconds_left = true;
            jQuery(document).trigger('game5secondsLeft');
        }
        if(that.time_remaining <= 0){
            that.time_remaining = 0;
            return false;
        }
        else {
            return true;
        }
    }
    this.resetTimeCounter = function(){
        this.start_time = (new Date).getTime();
        this.setTopTime();
    };
    this.calculateScore = function () {
        if(this.times_changed < 1){
            this.times_changed = 1;
        }
        var score = Math.floor( ((this.items/3 * this.speed) * (this.jorgeClicks)) - ((this.clicks - this.jorgeClicks) * 5) ) + 50;
        return score;
    }
    this.stopGame = function () {
        this.keep_going = false;
        this.time_updating = false;
    }
    this.updateRandomKey = function () {
        this.random_key = parseInt(Math.random() * this.items);
        this.times_changed++;
        return this.random_key;
    }
    this.clickOnJorge = function(){
        this.jorgeClicks++;
    }
    this.time_interval = function(){
        return this.min_time_interval + (((this.max_time_interval - this.min_time_interval)/this.max_speed) * (this.max_speed - this.speed));
    }
    this.getTimeRemaining = function(){
        var timeDivided = parseFloat(this.time_remaining / 1000).toFixed(1); ;
        var timeDividedString = (timeDivided + "").split('.');
        timeDividedString = timeDividedString[0] + ".<span class='miliseconds'>" + timeDividedString[1] + "</span>";
        return timeDividedString
    }
    this.getClicks = function(){
        return this.jorgeClicks + "/" + this.clicks;
    }
}

module.exports = ClickOnJorgeGameInstance; 

},{}],4:[function(require,module,exports){
var GameInterface = function(game){

	this.currentGame = game;
	this.initComplete = false;

	this.init = function(initInterfaceCallback){
		var that = this;
		var animationTime = 750;

		/*******************

		Initial Creation of Modals and Sliders 

		*******************/

		// Bind Menu
		jQuery('#menu-container a').click(function(){
			jQuery('#menu-container').removeClass('uncollapsed');
		});

		// Set Canvas at Correct Height
		this.canvas_height = jQuery(window).height() - jQuery("#top_menu_container").outerHeight();
		jQuery('#main-canvas').height(this.canvas_height);

		jQuery("#stat_speed_modal").text(this.currentGame.speed);
		jQuery("#stat_items_modal").text(this.currentGame.items);

		// Add Sliders 
		jQuery("#speed-slider").slider({
	      range: "min",
	      value: this.currentGame.speed,
	      min: this.currentGame.min_speed,
	      max: this.currentGame.max_speed,
	      slide: function( event, ui ) {
	        that.currentGame.speed = ui.value;
	        that.updateAllStats();
	      }
	    });

		jQuery("#items-slider").slider({
	      range: "min",
	      value: this.currentGame.items,
	      min: this.currentGame.min_items,
	      max: this.currentGame.max_items,
	      step: this.currentGame.increment,
	      slide: function( event, ui ) {
	      	// INteract With Game
	        that.currentGame.items = ui.value;
	       	that.updateAllStats();
	      }
	    });

		// Append Dialog
		this.instructions = jQuery( "#instructions-dialog" );
		this.instructions.dialog({
			modal: true,
			show: animationTime,
			hide: animationTime,
			draggable: false,
 			resizable: false,
 			dialogClass:'instructions-dialog',
			open: function () {
				jQuery('.ui-widget-overlay').hide().fadeIn(animationTime);
			},
			beforeClose: function(){
				jQuery('.ui-widget-overlay:first')
					.clone()
					.appendTo('body')
					.show()
			},
			close: function(){
				jQuery('.ui-widget-overlay').fadeOut(animationTime, function(){
					jQuery(this).remove();
					
				});
				// When Pressed OK
				if(!this.initComplete){
					initInterfaceCallback();
					this.initComplete = true;
				}
				else {
					jQuery(document).trigger("gameStart");
				}
				
			},
			buttons: {
				Ok: function() {
					jQuery(this).dialog("close");	
				}
			}
	    });

	    // Append Dialog
		this.winningDialog = jQuery( "#winning-dialog" );
		this.winningDialog.dialog({
			autoOpen: false,
			modal: true,
			show: animationTime,
			hide: animationTime,
			draggable: false,
 			resizable: false,
 			dialogClass:'winning-dialog',
			open: function () {
				jQuery('.ui-widget-overlay').hide().fadeIn(animationTime);
			},
			beforeClose: function(){
				jQuery('.ui-widget-overlay:first')
					.clone()
					.appendTo('body')
					.show()
			},
			close: function(){
				// Hide Score, time, etc
				that.stopGame();
				jQuery('.ui-widget-overlay').fadeOut(animationTime, function(){
					jQuery(this).remove();
					// Open Dialog
					that.instructions.dialog("open");
				})
			},
			buttons: {
				"Play Again": function() {
					// TODO: Play Again, start new game
					jQuery(this).dialog("close");
				}, 
				"See High Scores": function(){
					// Redirect to page
					location.href=jQuery(this).data('high-scores-url');
				}
			}
		});

		// Append Dialog
		this.losingDialog = jQuery( "#losing-dialog" );
		this.losingDialog.dialog({
			autoOpen: false,
			modal: true,
			show: animationTime,
			hide: animationTime,
			draggable: false,
 			resizable: false,
			open: function () {
				jQuery('.ui-widget-overlay').hide().fadeIn(animationTime);
			},
			beforeClose: function(){
				jQuery('.ui-widget-overlay:first')
					.clone()
					.appendTo('body')
					.show()
			},
			close: function(){
				// Hide Score, time, etc
				that.stopGame();
				jQuery('.ui-widget-overlay').fadeOut(animationTime, function(){
					jQuery(this).remove();
					// Open Dialog
					that.instructions.dialog("open");
				})
			},
			buttons: {
				"Play Again": function() {
					// TODO: Play Again, start new game
					jQuery(this).dialog("close");
				}, 
				"See High Scores": function(){
					// Redirect to High Scores Page
					location.href=jQuery(this).data('high-scores-url');
				}
			}
		});

		// When the Restart Game Button is Clicked, Open Dialog
		jQuery("#restart-game").click(function(){
			jQuery(document).trigger("gameEnd");
			that.losingDialog.dialog("close");
			that.winningDialog.dialog("close");
			that.instructions.dialog("open");
		});
	}

	this.mobileWarning = function(){
		if(jQuery(document).width() < 768){
			alert("Warning: This game does not work well in mobile devices. Play at your own risk!");
		}
	}

	this.updateAllStats = function(){
		var that = this;
		// NOTE: This Doesn't work in IE apparently... :( .innerText  = ?;
		// http://stackoverflow.com/questions/121817/replace-text-inside-a-div-element
		document.getElementById("stat_items").textContent  = that.currentGame.items;
		document.getElementById("stat_items_modal").textContent  = that.currentGame.items;
		document.getElementById("stat_speed").textContent  = that.currentGame.speed;
        document.getElementById("stat_speed_modal").textContent  = that.currentGame.speed;
        document.getElementById("stat_clicks").textContent  = that.currentGame.getClicks();
        document.getElementById("stat_time").innerHTML  = that.currentGame.getTimeRemaining();
		document.getElementById("stat_score").textContent  = addCommas(convertToDecimal(that.currentGame.calculateScore(), 3));
	}

	this.startGame = function(){
		this.updateAllStats();
		jQuery(".left-top-container ").addClass('activated');
		jQuery('.game_stat').removeClass('time_warning');
		jQuery('#high_score_modal')
				.removeClass('high_score_false')
				.removeClass('high_score_true')
				.html('Did you make the high scores? <div class="spinner"></div>');
	}

	this.stopGame = function(jorgeClicks, finalScore){
		jQuery("#final_jorge_clicks_modal").text(jorgeClicks);
		jQuery("#final_score_modal").text(addCommas(finalScore));
		jQuery(".left-top-container").removeClass('activated');
	}

	this.openWinningDialog = function(event){
		this.losingDialog.dialog("close");
		this.instructions.dialog("close");
		this.winningDialog.dialog("open");
	}

	this.openLosingDialog = function(){
		this.winningDialog.dialog("close");
		this.instructions.dialog("close");
		this.losingDialog.dialog("open");
	}

	this.openFacebookLink = function(link){
	window.open(
		'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(link), 
		'facebook-share-dialog', 
		'width=626,height=436'
		);
	}

	this.updateGameEndDialog = function(highScorePosition){
		if(highScorePosition){
			jQuery('#high_score_modal')
				.addClass('high_score_true')
				.text("You made the high scores!");
		}
		else {
			jQuery('#high_score_modal')
				.addClass('high_score_false')
				.text("Sorry, you didn't make high scores.");
		}
	}

	this.gameAlmostDone = function(){
		jQuery('.game_stat').addClass('time_warning');
	}

}

/******************************

Utilities 

******************************/

function convertToDecimal(figure, decimals){
    if (!decimals) decimals = 2;
    var d = Math.pow(10,decimals);
    return (parseInt(figure*d)/d).toFixed(decimals);
};

function addCommas(nStr){
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1;
}

/******************************

Settings

******************************/

var alertFallback = true;
	if (typeof console === "undefined" || typeof console.log === "undefined") {
		console = {};
	if (alertFallback) {
		console.log = function(msg) {
		  alert(msg);
		};
	} else {
		console.log = function() {};
	}
}

jQuery.extend(
	jQuery.ui.dialog.prototype.options, { 
		show: "fade", 
		hide: "fade" 
	}
);

module.exports = GameInterface; 
},{}],5:[function(require,module,exports){
var T = require('timbre');

var GameSounds = function(){

	this.init = function(){

	};

	this.lose = function(){
		var sine1 = T("sin", {freq:20000000, mul:0.5});
		var sine2 = T("sin", {freq:20000000, mul:0.5});
		var r = 600;
		this.playBasicSound(sine1, sine2, r);
	};

	this.click = function(){
		var sine1 = T("sin", {freq:200, mul:0.1});
		var sine2 = T("sin", {freq:400, mul:3.5});
		var r = 150;
		this.playBasicSound(sine1, sine2, r);
	};

	this.jorgeClick = function(){
		var sine1 = T("sin", {freq:1200, mul:0.4});
		var sine2 = T("sin", {freq:600, mul:0.99});
		var r = 1200;
		this.playBasicSound(sine1, sine2, r);
	};

	this.gameAlmostDone = function(){
		var sine1 = T("sin", {freq:70000, mul:0.7});
		var sine2 = T("sin", {freq:500, mul:0.5});
		var r = 350;
		this.playBasicSound(sine1, sine2, r);
	};

	this.newHighScore = function(){
		var freq1 = T("pulse", {freq:4, add:500, mul:1000}).on("ended", function() {
			this.pause();
		});

		var freq2 = T("pulse", {freq:2, add:200, mul:600}).on("ended", function() {
			this.pause();
		})

		var sin1 = T("sin", {freq:freq1, mul:1});
		var sin2 = T("sin", {freq:freq2, mul:1});
		this.customSound = T("perc", {r:2500}, sin1, sin2).on("ended", function() {
		  this.pause();
		});
		this.customSound.bang().play();
	}

	this.animationSound = function(){
		var freq2 = T("pulse", {freq:1, add:200, mul:1200}).on("ended", function() {
			this.pause();
		})
		var sin2 = T("sin", {freq:freq2, mul:0.5});
		this.customSound = T("perc", {r:300},  sin2).on("ended", function() {
		  this.pause();
		});
		this.customSound.bang().play();
	}

	this.playBasicSound = function(sine1, sine2, r){
		this.loseSounds = T("perc", {r:r}, sine1, sine2).on("ended", function() {
		  this.pause();
		});
		this.loseSounds.bang().play();
	}

	this.startGame = function(){
		var freq2 = T("pulse", {freq:0.1, add:300, mul:2400}).on("ended", function() {
			this.pause();
		})
		var sin2 = T("sin", {freq:freq2, mul:2.0});
		this.customSound = T("perc", {r:450},  sin2).on("ended", function() {
		  this.pause();
		});
		this.customSound.bang().play();
	}

}

module.exports = GameSounds; 
},{"timbre":6}],6:[function(require,module,exports){
(function (global){
(function(t){"use strict";var e=function(){return g.apply(null,arguments)},i=Array.prototype.slice,s=0,n=1,r=2,a=3,o=[8e3,11025,12e3,16e3,22050,24e3,32e3,44100,48e3],h=[32,64,128,256],u="14.05.15",l=null,c={},f={},p="undefined"!=typeof module&&module.exports?"node":"undefined"!=typeof window?"browser":"unknown",d="browser"===p&&/(iPhone|iPad|iPod|Android)/i.test(navigator.userAgent),m=!1,v=120,g=function(){var e,s,n=i.call(arguments),r=n[0];switch(typeof r){case"string":c[r]?e=new c[r](n.slice(1)):f[r]?e=f[r](n.slice(1)):(s=/^(.+?)(?:\.(ar|kr))?$/.exec(r),s&&(r=s[1],c[r]?e=new c[r](n.slice(1)):f[r]&&(e=f[r](n.slice(1))),e&&s[2]&&e[s[2]]()));break;case"number":e=new R(n);break;case"boolean":e=new O(n);break;case"function":e=new D(n);break;case"object":if(null!==r){if(r instanceof S)return r;if(r.context instanceof S)return r.context;w(r)?e=new L(n):y(r)&&(e=new M(n))}}e===t&&(e=new I(n.slice(1)),console.warn('T("'+r+'") is not defined.'));var a=e._;return a.originkey=r,a.meta=b(e),a.emit("init"),e},b=function(t){for(var e,i,s=t._.meta,n=t;null!==n&&n.constructor!==Object;){e=Object.getOwnPropertyNames(n);for(var r=0,a=e.length;a>r;++r)s[e[r]]||(/^(constructor$|process$|_)/.test(e[r])?s[e[r]]="ignore":(i=Object.getOwnPropertyDescriptor(n,e[r]),"function"==typeof i.value?s[e[r]]="function":(i.get||i.set)&&(s[e[r]]="property")));n=Object.getPrototypeOf(n)}return s};Object.defineProperties(e,{version:{value:u},envtype:{value:p},envmobile:{value:d},env:{get:function(){return l.impl.env}},samplerate:{get:function(){return l.samplerate}},channels:{get:function(){return l.channels}},cellsize:{get:function(){return l.cellsize}},currentTime:{get:function(){return l.currentTime}},isPlaying:{get:function(){return l.status===n}},isRecording:{get:function(){return l.status===a}},amp:{set:function(t){"number"==typeof t&&(l.amp=t)},get:function(){return l.amp}},bpm:{set:function(t){"number"==typeof t&&t>=5&&300>=t&&(v=t)},get:function(){return v}}}),e.bind=function(t,i){return l.bind(t,i),e},e.setup=function(t){return l.setup(t),e},e.play=function(){return l.play(),e},e.pause=function(){return l.pause(),e},e.reset=function(){return l.reset(),l.events.emit("reset"),e},e.on=e.addListener=function(t,i){return l.on(t,i),e},e.once=function(t,i){return l.once(t,i),e},e.off=e.removeListener=function(t,i){return l.off(t,i),e},e.removeAllListeners=function(t){return l.removeAllListeners(t),e},e.listeners=function(t){return l.listeners(t)},e.rec=function(){return l.rec.apply(l,arguments)},e.timevalue=function(){var t=function(t){var e,i=v;return(e=/^bpm(\d+(?:\.\d+)?)/i.exec(t))&&(i=Math.max(5,Math.min(300,+(e[1]||0)))),i};return function(i){var s,n,r;if(s=/^(\d+(?:\.\d+)?)Hz$/i.exec(i))return 0===+s[1]?0:1e3/+s[1];if(s=/L(\d+)?(\.*)$/i.exec(i))return n=1e3*60/t(i)*(4/(s[1]||4)),n*=[1,1.5,1.75,1.875][(s[2]||"").length]||1;if(s=/^(\d+(?:\.\d+)?|\.(?:\d+))(min|sec|m)s?$/i.exec(i))switch(s[2]){case"min":return 1e3*60*+(s[1]||0);case"sec":return 1e3*+(s[1]||0);case"m":return+(s[1]||0)}return(s=/^(?:([0-5]?[0-9]):)?(?:([0-5]?[0-9]):)(?:([0-5]?[0-9]))(?:\.([0-9]{1,3}))?$/.exec(i))?(r=3600*(s[1]||0)+60*(s[2]||0)+(s[3]||0),r=1e3*r+(0|((s[4]||"")+"00").substr(0,3))):(s=/(\d+)\.(\d+)\.(\d+)$/i.exec(i))?(r=480*(4*s[1]+ +s[2])+ +s[3],1e3*60/t(i)*(r/480)):(s=/(\d+)ticks$/i.exec(i))?1e3*60/t(i)*(s[1]/480):(s=/^(\d+)samples(?:\/(\d+)Hz)?$/i.exec(i))?1e3*s[1]/(s[2]||e.samplerate):0}}();var _=e.fn={SignalArray:Float32Array,currentTimeIncr:0,emptycell:null,FINISHED_STATE:s,PLAYING_STATE:n,UNSCHEDULED_STATE:r,SCHEDULED_STATE:a},y=_.isArray=Array.isArray,w=_.isDictionary=function(t){return"object"==typeof t&&t.constructor===Object};_.nop=function(){return this},_.isSignalArray=function(t){return t instanceof _.SignalArray?!0:Array.isArray(t)&&t.__klass&&2===t.__klass.type?!0:!1},_.extend=function(t,e){function i(){this.constructor=t}e=e||S;for(var s in e)e.hasOwnProperty(s)&&(t[s]=e[s]);return i.prototype=e.prototype,t.prototype=new i,t.__super__=e.prototype,t},_.constructorof=function(t,e){for(var i=t&&t.prototype;i;){if(i===e.prototype)return!0;i=Object.getPrototypeOf(i)}return!1},_.register=function(t,e){_.constructorof(e,S)?c[t]=e:f[t]=e},_.alias=function(t,e){c[e]?c[t]=c[e]:f[e]&&(f[t]=f[e])},_.getClass=function(t){return c[t]},_.pointer=function(t,e,i){return e=t.byteOffset+e*t.constructor.BYTES_PER_ELEMENT,"number"==typeof i?new t.constructor(t.buffer,e,i):new t.constructor(t.buffer,e)},_.nextTick=function(t){return l.nextTick(t),e},_.fixAR=function(t){t._.ar=!0,t._.aronly=!0},_.fixKR=function(t){t._.ar=!1,t._.kronly=!0},_.changeWithValue=function(){var t=this._,e=t.value*t.mul+t.add;isNaN(e)&&(e=0);for(var i=this.cells[0],s=0,n=i.length;n>s;++s)i[s]=e},_.changeWithValue.unremovable=!0,_.clone=function(t){var e=new t.constructor([]);return e._.ar=t._.ar,e._.mul=t._.mul,e._.add=t._.add,e._.bypassed=t._.bypassed,e},_.timer=function(){var t=function(t){return function(){-1===l.timers.indexOf(t)&&(l.timers.push(t),l.events.emit("addObject"),t._.emit("start"),_.buddies_start(t))}},e=function(t){return function(){var e=l.timers.indexOf(t);-1!==e&&(l.timers.splice(e,1),t._.emit("stop"),l.events.emit("removeObject"),_.buddies_stop(t))}};return function(i){var s=t(i),n=e(i);return i.nodeType=S.TIMER,i.start=function(){return l.nextTick(s),i},i.stop=function(){return l.nextTick(n),i},i}}(),_.listener=function(){var t=function(t){return function(){-1===l.listeners.indexOf(t)&&(l.listeners.push(t),l.events.emit("addObject"),t._.emit("listen"),_.buddies_start(t))}},e=function(t){return function(){var e=l.listeners.indexOf(t);-1!==e&&(l.listeners.splice(e,1),t._.emit("unlisten"),l.events.emit("removeObject"),_.buddies_stop(t))}};return function(i){var s=t(i),n=e(i);return i.nodeType=S.LISTENER,i.listen=function(){return arguments.length&&i.append.apply(i,arguments),i.nodes.length&&l.nextTick(s),i},i.unlisten=function(){return arguments.length&&i.remove.apply(i,arguments),i.nodes.length||l.nextTick(n),i},i}}(),_.make_onended=function(t,e){return function(){if(t.playbackState=s,"number"==typeof e)for(var i=t.cells[0],n=t.cells[1],r=t.cells[2],a=0,o=n.length;o>a;++a)i[0]=n[a]=r[a]=e;t._.emit("ended")}},_.inputSignalAR=function(t){var e,i,s,r,a,o,h=t.cells[0],u=t.cells[1],l=t.cells[2],c=t.nodes,f=c.length,p=h.length,d=t.tickID;if(2===t.numChannels){if(s=!0,0!==f){for(e=0;f>e;++e)if(c[e].playbackState===n){c[e].process(d),u.set(c[e].cells[1]),l.set(c[e].cells[2]),s=!1,++e;break}for(;f>e;++e)if(c[e].playbackState===n)for(c[e].process(d),a=c[e].cells[1],o=c[e].cells[2],i=p;i;)i-=8,u[i]+=a[i],l[i]+=o[i],u[i+1]+=a[i+1],l[i+1]+=o[i+1],u[i+2]+=a[i+2],l[i+2]+=o[i+2],u[i+3]+=a[i+3],l[i+3]+=o[i+3],u[i+4]+=a[i+4],l[i+4]+=o[i+4],u[i+5]+=a[i+5],l[i+5]+=o[i+5],u[i+6]+=a[i+6],l[i+6]+=o[i+6],u[i+7]+=a[i+7],l[i+7]+=o[i+7]}s&&(u.set(_.emptycell),l.set(_.emptycell))}else{if(s=!0,0!==f){for(e=0;f>e;++e)if(c[e].playbackState===n){c[e].process(d),h.set(c[e].cells[0]),s=!1,++e;break}for(;f>e;++e)if(c[e].playbackState===n)for(r=c[e].process(d).cells[0],i=p;i;)i-=8,h[i]+=r[i],h[i+1]+=r[i+1],h[i+2]+=r[i+2],h[i+3]+=r[i+3],h[i+4]+=r[i+4],h[i+5]+=r[i+5],h[i+6]+=r[i+6],h[i+7]+=r[i+7]}s&&h.set(_.emptycell)}},_.inputSignalKR=function(t){var e,i=t.nodes,s=i.length,r=t.tickID,a=0;for(e=0;s>e;++e)i[e].playbackState===n&&(a+=i[e].process(r).cells[0][0]);return a},_.outputSignalAR=function(t){var e,i=t.cells[0],s=t.cells[1],n=t.cells[2],r=t._.mul,a=t._.add;if(2===t.numChannels)for(e=i.length;e;)e-=8,s[e]=s[e]*r+a,n[e]=n[e]*r+a,s[e+1]=s[e+1]*r+a,n[e+1]=n[e+1]*r+a,s[e+2]=s[e+2]*r+a,n[e+2]=n[e+2]*r+a,s[e+3]=s[e+3]*r+a,n[e+3]=n[e+3]*r+a,s[e+4]=s[e+4]*r+a,n[e+4]=n[e+4]*r+a,s[e+5]=s[e+5]*r+a,n[e+5]=n[e+5]*r+a,s[e+6]=s[e+6]*r+a,n[e+6]=n[e+6]*r+a,s[e+7]=s[e+7]*r+a,n[e+7]=n[e+7]*r+a,i[e]=.5*(s[e]+n[e]),i[e+1]=.5*(s[e+1]+n[e+1]),i[e+2]=.5*(s[e+2]+n[e+2]),i[e+3]=.5*(s[e+3]+n[e+3]),i[e+4]=.5*(s[e+4]+n[e+4]),i[e+5]=.5*(s[e+5]+n[e+5]),i[e+6]=.5*(s[e+6]+n[e+6]),i[e+7]=.5*(s[e+7]+n[e+7]);else if(1!==r||0!==a)for(e=i.length;e;)e-=8,i[e]=i[e]*r+a,i[e+1]=i[e+1]*r+a,i[e+2]=i[e+2]*r+a,i[e+3]=i[e+3]*r+a,i[e+4]=i[e+4]*r+a,i[e+5]=i[e+5]*r+a,i[e+6]=i[e+6]*r+a,i[e+7]=i[e+7]*r+a},_.outputSignalKR=function(t){var e,i=t.cells[0],s=t.cells[1],n=t.cells[2],r=t._.mul,a=t._.add,o=i[0]*r+a;if(2===t.numChannels)for(e=i.length;e;)e-=8,i[e]=i[e+1]=i[e+2]=i[e+3]=i[e+4]=i[e+5]=i[e+6]=i[e+7]=s[e]=s[e+1]=s[e+2]=s[e+3]=s[e+4]=s[e+5]=s[e+6]=s[e+7]=n[e]=n[e+1]=n[e+2]=n[e+3]=n[e+4]=n[e+5]=n[e+6]=n[e+7]=o;else for(e=i.length;e;)e-=8,i[e]=i[e+1]=i[e+2]=i[e+3]=i[e+4]=i[e+5]=i[e+6]=i[e+7]=o},_.buddies_start=function(t){var e,i,s,n=t._.buddies;for(i=0,s=n.length;s>i;++i)switch(e=n[i],e.nodeType){case S.DSP:e.play();break;case S.TIMER:e.start();break;case S.LISTENER:e.listen()}},_.buddies_stop=function(t){var e,i,s,n=t._.buddies;for(i=0,s=n.length;s>i;++i)switch(e=n[i],e.nodeType){case S.DSP:e.pause();break;case S.TIMER:e.stop();break;case S.LISTENER:e.unlisten()}},_.fix_iOS6_1_problem=function(t){l.fix_iOS6_1_problem(t)};var x=e.modules={},k=x.EventEmitter=function(){function e(t){this.context=t,this.events={}}var s=e.prototype;return s.emit=function(e){var s=this.events[e];if(!s)return!1;var n;if("function"==typeof s){switch(arguments.length){case 1:s.call(this.context);break;case 2:s.call(this.context,arguments[1]);break;case 3:s.call(this.context,arguments[1],arguments[2]);break;default:n=i.call(arguments,1),s.apply(this.context,n)}return!0}if(y(s)){n=i.call(arguments,1);for(var r=s.slice(),a=0,o=r.length;o>a;++a)r[a]instanceof S?r[a].bang.apply(r[a],n):r[a].apply(this.context,n);return!0}return s instanceof S?(n=i.call(arguments,1),s.bang.apply(s,n),t):!1},s.on=function(t,e){if("function"!=typeof e&&!(e instanceof S))throw Error("addListener takes instances of Function or timbre.Object");var i=this.events;return i[t]?y(i[t])?i[t].push(e):i[t]=[i[t],e]:i[t]=e,this},s.once=function(t,e){var i,s=this;if("function"==typeof e)i=function(){s.off(t,i),e.apply(s.context,arguments)};else{if(!(e instanceof S))throw Error("once takes instances of Function or timbre.Object");i=function(){s.off(t,i),e.bang.apply(e,arguments)}}return i.listener=e,s.on(t,i),this},s.off=function(t,e){if("function"!=typeof e&&!(e instanceof S))throw Error("removeListener takes instances of Function or timbre.Object");var i=this.events;if(!i[t])return this;var s=i[t];if(y(s)){for(var n=-1,r=0,a=s.length;a>r;++r)if(s[r]===e||s[r].listener&&s[r].listener===e){n=r;break}if(0>n)return this;s.splice(n,1),0===s.length&&(i[t]=null)}else(s===e||s.listener&&s.listener===e)&&(i[t]=null);return this},s.removeAllListeners=function(t){var e=this.events,i=!1,s=e[t];if(y(s))for(var n=s.length;n--;){var r=s[n];r.unremovable?i=!0:this.off(t,r)}else s&&(s.unremovable?i=!0:this.off(t,s));return i||(e[t]=null),this},s.listeners=function(t){var e,i=this.events;if(!i[t])return[];if(i=i[t],!y(i))return i.unremovable?[]:[i];i=i.slice(),e=[];for(var s=0,n=i.length;n>s;++s)i[s].unremovable||e.push(i[s]);return e},e}(),A=x.Deferred=function(){function t(t){this.context=t||this,this._state="pending",this._doneList=[],this._failList=[],this._promise=new e(this)}function e(t){this.context=t.context,this.then=t.then,this.done=function(){return t.done.apply(t,arguments),this},this.fail=function(){return t.fail.apply(t,arguments),this},this.pipe=function(){return t.pipe.apply(t,arguments)},this.always=function(){return t.always.apply(t,arguments),this},this.promise=function(){return this},this.isResolved=function(){return t.isResolved()},this.isRejected=function(){return t.isRejected()}}var s=t.prototype,n=function(t,e,i,s){if("pending"===this._state){this._state=t;for(var n=0,r=e.length;r>n;++n)e[n].apply(i,s);this._doneList=this._failList=null}},r=function(t){return t&&"function"==typeof t.promise};return s.resolve=function(){var t=i.call(arguments,0);return n.call(this,"resolved",this._doneList,this.context||this,t),this},s.resolveWith=function(t){var e=i.call(arguments,1);return n.call(this,"resolved",this._doneList,t,e),this},s.reject=function(){var t=i.call(arguments,0);return n.call(this,"rejected",this._failList,this.context||this,t),this},s.rejectWith=function(t){var e=i.call(arguments,1);return n.call(this,"rejected",this._failList,t,e),this},s.promise=function(){return this._promise},s.done=function(){for(var t=i.call(arguments),e="resolved"===this._state,s="pending"===this._state,n=this._doneList,r=0,a=t.length;a>r;++r)"function"==typeof t[r]&&(e?t[r]():s&&n.push(t[r]));return this},s.fail=function(){for(var t=i.call(arguments),e="rejected"===this._state,s="pending"===this._state,n=this._failList,r=0,a=t.length;a>r;++r)"function"==typeof t[r]&&(e?t[r]():s&&n.push(t[r]));return this},s.always=function(){return this.done.apply(this,arguments),this.fail.apply(this,arguments),this},s.then=function(t,e){return this.done(t).fail(e)},s.pipe=function(e,s){var n=this,a=new t(this.context);return this.done(function(){var t=e.apply(n.context,arguments);r(t)?t.then(function(){var e=i.call(arguments);a.resolveWith.apply(a,[t].concat(e))}):a.resolveWith(n,t)}),this.fail(function(){if("function"==typeof s){var t=s.apply(n.context,arguments);r(t)&&t.fail(function(){var e=i.call(arguments);a.rejectWith.apply(a,[t].concat(e))})}else a.reject.apply(a,arguments)}),a.promise()},s.isResolved=function(){return"resolved"===this._state},s.isRejected=function(){return"rejected"===this._state},s.state=function(){return this._state},t.when=function(e){var s=0,n=i.call(arguments),a=n.length,o=a;1!==a||r(e)||(o=0);var h=1===o?e:new t,u=function(t,e){return function(s){e[t]=arguments.length>1?i.call(arguments):s,--o||h.resolve.apply(h,e)}};if(a>1)for(var l=Array(a),c=function(){h.reject()};a>s;++s)n[s]&&r(n[s])?n[s].promise().done(u(s,l)).fail(c):(l[s]=n[s],--o);return o||h.resolve.apply(h,n),h.promise()},t}(),S=e.Object=function(){function s(t,i){this._={};var r=this._.events=new k(this);if(this._.emit=function(){return r.emit.apply(r,arguments)},w(i[0])){var a=i.shift(),o=a["in"];this.once("init",function(){this.set(a),o&&(y(o)?this.append.apply(this,o):o instanceof s&&this.append(o))})}switch(this.tickID=-1,this.nodes=i.map(e),this.cells=[],this.numChannels=t,t){case 0:this.L=this.R=new T(null),this.cells[0]=this.cells[1]=this.cells[2]=this.L.cell;break;case 1:this.L=this.R=new T(this),this.cells[0]=this.cells[1]=this.cells[2]=this.L.cell;break;case 2:this.L=new T(this),this.R=new T(this),this.cells[0]=new _.SignalArray(l.cellsize),this.cells[1]=this.L.cell,this.cells[2]=this.R.cell}this.playbackState=n,this.nodeType=s.DSP,this._.ar=!0,this._.mul=1,this._.add=0,this._.dac=null,this._.bypassed=!1,this._.meta={},this._.samplerate=l.samplerate,this._.cellsize=l.cellsize,this._.buddies=[]}s.DSP=1,s.TIMER=2,s.LISTENER=3;var r=s.prototype;return Object.defineProperties(r,{isAr:{get:function(){return this._.ar}},isKr:{get:function(){return!this._.ar}},isBypassed:{get:function(){return this._.bypassed}},isEnded:{get:function(){return!(1&this.playbackState)}},mul:{set:function(t){"number"==typeof t&&(this._.mul=t,this._.emit("setMul",t))},get:function(){return this._.mul}},add:{set:function(t){"number"==typeof t&&(this._.add=t,this._.emit("setAdd",t))},get:function(){return this._.add}},buddies:{set:function(t){y(t)||(t=[t]),this._.buddies=t.filter(function(t){return t instanceof s})},get:function(){return this._.buddies}}}),r.toString=function(){return this.constructor.name},r.valueOf=function(){return l.tickID!==this.tickID&&this.process(l.tickID),this.cells[0][0]},r.append=function(){if(arguments.length>0){var t=i.call(arguments).map(e);this.nodes=this.nodes.concat(t),this._.emit("append",t)}return this},r.appendTo=function(t){return t.append(this),this},r.remove=function(){if(arguments.length>0){for(var t,e=this.nodes,i=[],s=0,n=arguments.length;n>s;++s)-1!==(t=e.indexOf(arguments[s]))&&(i.push(e[t]),e.splice(t,1));i.length>0&&this._.emit("remove",i)}return this},r.removeFrom=function(t){return t.remove(this),this},r.removeAll=function(){var t=this.nodes.slice();return this.nodes=[],t.length>0&&this._.emit("remove",t),this},r.removeAtIndex=function(t){var e=this.nodes[t];return e&&(this.nodes.splice(t,1),this._.emit("remove",[e])),this},r.postMessage=function(t){return this._.emit("message",t),this},r.to=function(t){if(t instanceof s)t.append(this);else{var e=i.call(arguments);w(e[1])?e.splice(2,0,this):e.splice(1,0,this),t=g.apply(null,e)}return t},r.splice=function(t,e,i){var n;return e?e instanceof s&&(n=e.nodes.indexOf(i),-1!==n&&e.nodes.splice(n,1),t instanceof s?(t.nodes.push(this),e.nodes.push(t)):e.nodes.push(this)):this._.dac&&(t instanceof s?i instanceof s?i._.dac&&(i._.dac._.node=t,t._.dac=i._.dac,i._.dac=null,t.nodes.push(this)):this._.dac&&(this._.dac._.node=t,t._.dac=this._.dac,this._.dac=null,t.nodes.push(this)):i instanceof s&&i._.dac&&(i._.dac._.node=this,this._.dac=i._.dac,i._.dac=null)),this},r.on=r.addListener=function(t,e){return this._.events.on(t,e),this},r.once=function(t,e){return this._.events.once(t,e),this},r.off=r.removeListener=function(t,e){return this._.events.off(t,e),this},r.removeAllListeners=function(t){return this._.events.removeAllListeners(t),this},r.listeners=function(t){return this._.events.listeners(t)},r.set=function(t,e){var i,s,n=this._.meta;switch(typeof t){case"string":switch(n[t]){case"property":this[t]=e;break;case"function":this[t](e);break;default:for(i=this;null!==i;)s=Object.getOwnPropertyDescriptor(i,t),s&&("function"==typeof s.value?(n[t]="function",this[t](e)):(s.get||s.set)&&(n[t]="property",this[t]=e)),i=Object.getPrototypeOf(i)}break;case"object":for(i in t)this.set(i,t[i])}return this},r.get=function(e){return"property"===this._.meta[e]?this[e]:t},r.bang=function(){return this._.emit.apply(this,["bang"].concat(i.call(arguments))),this},r.process=_.nop,r.bypass=function(){return this._.bypassed=0===arguments.length?!0:!!arguments[0],this},r.play=function(){var t=this._.dac;return null===t&&(t=this._.dac=new j(this)),t.play()&&this._.emit.apply(this,["play"].concat(i.call(arguments))),_.buddies_start(this),this},r.pause=function(){var t=this._.dac;return t&&t.playbackState===n&&(t.pause(),this._.dac=null,this._.emit("pause")),_.buddies_stop(this),this},r.start=r.stop=r.listen=r.unlisten=function(){return this},r.ar=function(){return(0===arguments.length?0:!arguments[0])?this.kr(!0):this._.kronly||(this._.ar=!0,this._.emit("ar",!0)),this},r.kr=function(){return(0===arguments.length?0:!arguments[0])?this.ar(!0):this._.aronly||(this._.ar=!1,this._.emit("ar",!1)),this},r.plot="browser"===p?function(e){var i=this._,s=e.target;if(!s)return this;var n,r=e.width||s.width||320,a=e.height||s.height||240,o=(e.x||0)+.5,h=e.y||0,u=s.getContext("2d");n=e.foreground!==t?e.foreground:i.plotForeground||"rgb(  0, 128, 255)";var l;l=e.background!==t?e.background:i.plotBackground||"rgb(255, 255, 255)";var c,f,p,d,m,v=e.lineWidth||i.plotLineWidth||1,g=!!i.plotCyclic,b=i.plotData||this.cells[0],_=e.range||i.plotRange||[-1.2,1.2],y=_[0],w=a/(_[1]-y),x=r/b.length,k=b.length;if(u.save(),u.rect(o,h,r,a),null!==l&&(u.fillStyle=l,u.fillRect(o,h,r,a)),i.plotBefore&&i.plotBefore.call(this,u,o,h,r,a),i.plotBarStyle)for(u.fillStyle=n,c=0,m=0;k>m;++m)p=(b[m]-y)*w,f=a-p,u.fillRect(c+o,f+h,x,p),c+=x;else{for(u.strokeStyle=n,u.lineWidth=v,u.beginPath(),c=0,d=a-(b[0]-y)*w,u.moveTo(c+o,d+h),m=1;k>m;++m)c+=x,f=a-(b[m]-y)*w,u.lineTo(c+o,f+h);g?u.lineTo(c+x+o,d+h):u.lineTo(c+x+o,f+h),u.stroke()}i.plotAfter&&i.plotAfter.call(this,u,o,h,r,a);var A=e.border||i.plotBorder;return A&&(u.strokeStyle="string"==typeof A?A:"#000",u.lineWidth=1,u.strokeRect(o,h,r,a)),u.restore(),this}:_.nop,s}(),T=e.ChannelObject=function(){function t(t){e.Object.call(this,-1,[]),_.fixAR(this),this._.parent=t,this.cell=new _.SignalArray(l.cellsize),this.L=this.R=this,this.cells[0]=this.cells[1]=this.cells[2]=this.cell,this.numChannels=1}return _.extend(t),t.prototype.process=function(t){return this.tickID!==t&&(this.tickID=t,this._.parent&&this._.parent.process(t)),this},t}(),I=function(){function t(t){S.call(this,2,t)}return _.extend(t),t.prototype.process=function(t){var e=this._;return this.tickID!==t&&(this.tickID=t,e.ar?(_.inputSignalAR(this),_.outputSignalAR(this)):(this.cells[0][0]=_.inputSignalKR(this),_.outputSignalKR(this))),this},_.register("+",t),t}(),R=function(){function t(t){if(S.call(this,1,[]),_.fixKR(this),this.value=t[0],w(t[1])){var e=t[1];this.once("init",function(){this.set(e)})}this.on("setAdd",_.changeWithValue),this.on("setMul",_.changeWithValue)}_.extend(t);var e=t.prototype;return Object.defineProperties(e,{value:{set:function(t){"number"==typeof t&&(this._.value=isNaN(t)?0:t,_.changeWithValue.call(this))},get:function(){return this._.value}}}),t}(),O=function(){function t(t){if(S.call(this,1,[]),_.fixKR(this),this.value=t[0],w(t[1])){var e=t[1];this.once("init",function(){this.set(e)})}this.on("setAdd",_.changeWithValue),this.on("setMul",_.changeWithValue)}_.extend(t);var e=t.prototype;return Object.defineProperties(e,{value:{set:function(t){this._.value=t?1:0,_.changeWithValue.call(this)},get:function(){return!!this._.value}}}),t}(),D=function(){function t(t){if(S.call(this,1,[]),_.fixKR(this),this.func=t[0],this._.value=0,w(t[1])){var e=t[1];this.once("init",function(){this.set(e)})}this.on("setAdd",_.changeWithValue),this.on("setMul",_.changeWithValue)}_.extend(t);var e=t.prototype;return Object.defineProperties(e,{func:{set:function(t){"function"==typeof t&&(this._.func=t)},get:function(){return this._.func}},args:{set:function(t){this._.args=y(t)?t:[t]},get:function(){return this._.args}}}),e.bang=function(){var t=this._,e=i.call(arguments).concat(t.args),s=t.func.apply(this,e);return"number"==typeof s&&(t.value=s,_.changeWithValue.call(this)),this._.emit("bang"),this},t}(),M=function(){function t(t){S.call(this,1,[]);var e,i;for(e=0,i=t[0].length;i>e;++e)this.append(t[0][e]);if(w(t[1])){var s=t[1];this.once("init",function(){this.set(s)})}}_.extend(t);var e=t.prototype;return Object.defineProperties(e,{}),e.bang=function(){var t,e,s=["bang"].concat(i.call(arguments)),n=this.nodes;for(t=0,e=n.length;e>t;++t)n[t].bang.apply(n[t],s);return this},e.postMessage=function(t){var e,i,s=this.nodes;for(e=0,i=s.length;i>e;++e)s[e].postMessage(t);return this},e.process=function(t){var e=this._;return this.tickID!==t&&(this.tickID=t,e.ar?(_.inputSignalAR(this),_.outputSignalAR(this)):(this.cells[0][0]=_.inputSignalKR(this),_.outputSignalKR(this))),this},t}(),L=function(){function t(t){if(S.call(this,1,[]),_.fixKR(this),w(t[1])){var e=t[1];this.once("init",function(){this.set(e)})}}_.extend(t);var e=t.prototype;return Object.defineProperties(e,{}),t}(),j=function(){function t(t){S.call(this,2,[]),this.playbackState=s;var n=this._;n.node=t,n.onplay=e(this),n.onpause=i(this)}_.extend(t);var e=function(t){return function(){-1===l.inlets.indexOf(t)&&(l.inlets.push(t),l.events.emit("addObject"),t.playbackState=n,t._.emit("play"))}},i=function(t){return function(){var e=l.inlets.indexOf(t);-1!==e&&(l.inlets.splice(e,1),t.playbackState=s,t._.emit("pause"),l.events.emit("removeObject"))}},r=t.prototype;return r.play=function(){return l.nextTick(this._.onplay),-1===l.inlets.indexOf(this)},r.pause=function(){l.nextTick(this._.onpause)},r.process=function(t){var e=this._.node;1&e.playbackState?(e.process(t),this.cells[1].set(e.cells[1]),this.cells[2].set(e.cells[2])):(this.cells[1].set(_.emptycell),this.cells[2].set(_.emptycell))},t}(),P=function(){function e(){this.context=this,this.tickID=0,this.impl=null,this.amp=.8,this.status=s,this.samplerate=44100,this.channels=2,this.cellsize=64,this.streammsec=20,this.streamsize=0,this.currentTime=0,this.nextTicks=[],this.inlets=[],this.timers=[],this.listeners=[],this.deferred=null,this.recStart=0,this.recBuffers=null,this.delayProcess=r(this),this.events=null,_.currentTimeIncr=1e3*this.cellsize/this.samplerate,_.emptycell=new _.SignalArray(this.cellsize),this.reset(!0)}var r=function(t){return function(){t.recStart=Date.now(),t.process()}},u=e.prototype;u.bind=function(t,e){if("function"==typeof t){var i=new t(this,e);this.impl=i,this.impl.defaultSamplerate&&(this.samplerate=this.impl.defaultSamplerate)}return this},u.setup=function(e){return"object"==typeof e&&(-1!==o.indexOf(e.samplerate)&&(this.samplerate=e.samplerate<=this.impl.maxSamplerate?e.samplerate:this.impl.maxSamplerate),-1!==h.indexOf(e.cellsize)&&(this.cellsize=e.cellsize),"undefined"!=typeof Float64Array&&e.f64!==t&&(m=!!e.f64,_.SignalArray=m?Float64Array:Float32Array)),_.currentTimeIncr=1e3*this.cellsize/this.samplerate,_.emptycell=new _.SignalArray(this.cellsize),this},u.getAdjustSamples=function(t){var e,i;return t=t||this.samplerate,e=this.streammsec/1e3*t,i=Math.ceil(Math.log(e)*Math.LOG2E),i=8>i?8:i>14?14:i,1<<i},u.play=function(){return this.status===s&&(this.status=n,this.streamsize=this.getAdjustSamples(),this.strmL=new _.SignalArray(this.streamsize),this.strmR=new _.SignalArray(this.streamsize),this.impl.play(),this.events.emit("play")),this},u.pause=function(){return this.status===n&&(this.status=s,this.impl.pause(),this.events.emit("pause")),this},u.reset=function(t){return t&&(this.events=new k(this).on("addObject",function(){this.status===s&&this.play()}).on("removeObject",function(){this.status===n&&0===this.inlets.length+this.timers.length+this.listeners.length&&this.pause()})),this.currentTime=0,this.nextTicks=[],this.inlets=[],this.timers=[],this.listeners=[],this},u.process=function(){var t,e,i,s,n,r,o,h,u=this.tickID,l=this.strmL,c=this.strmR,f=this.amp,p=this.streamsize,d=0,m=this.cellsize,v=this.streamsize/this.cellsize,g=this.timers,b=this.inlets,y=this.listeners,w=_.currentTimeIncr;for(s=0;p>s;++s)l[s]=c[s]=0;for(;v--;){for(++u,n=0,r=g.length;r>n;++n)1&g[n].playbackState&&g[n].process(u);for(n=0,r=b.length;r>n;++n)if(t=b[n],t.process(u),1&t.playbackState)for(e=t.cells[1],i=t.cells[2],o=0,s=d;m>o;++o,++s)l[s]+=e[o],c[s]+=i[o];for(d+=m,n=0,r=y.length;r>n;++n)1&y[n].playbackState&&y[n].process(u);for(this.currentTime+=w,h=this.nextTicks.splice(0),n=0,r=h.length;r>n;++n)h[n]()}for(s=0;p>s;++s)t=l[s]*f,-1>t?t=-1:t>1&&(t=1),l[s]=t,t=c[s]*f,-1>t?t=-1:t>1&&(t=1),c[s]=t;this.tickID=u;var x=this.currentTime;if(this.status===a){if(2===this.recCh)this.recBuffers.push(new _.SignalArray(l)),this.recBuffers.push(new _.SignalArray(c));else{var k=new _.SignalArray(l.length);for(s=0,p=k.length;p>s;++s)k[s]=.5*(l[s]+c[s]);this.recBuffers.push(k)}if(x>=this.maxDuration)this.deferred.sub.reject();else if(x>=this.recDuration)this.deferred.sub.resolve();else{var A=Date.now();A-this.recStart>20?setTimeout(this.delayProcess,10):this.process()}}},u.nextTick=function(t){this.status===s?t():this.nextTicks.push(t)},u.rec=function(){_.fix_iOS6_1_problem(!0);var t=new A(this);if(this.deferred)return console.warn("rec deferred is exists??"),t.reject().promise();if(this.status!==s)return console.log("status is not none",this.status),t.reject().promise();var e=0,n=arguments,r=w(n[e])?n[e++]:{},o=n[e];if("function"!=typeof o)return console.warn("no function"),t.reject().promise();this.deferred=t,this.status=a,this.reset();var h=new g("+"),u=new A(this),c={done:function(){u.resolve.apply(u,i.call(arguments))},send:function(){h.append.apply(h,arguments)}},f=this;return u.then(l,function(){_.fix_iOS6_1_problem(!1),l.call(f,!0)}),this.deferred.sub=u,this.savedSamplerate=this.samplerate,this.samplerate=r.samplerate||this.samplerate,this.recDuration=r.recDuration||1/0,this.maxDuration=r.maxDuration||6e5,this.recCh=r.ch||1,2!==this.recCh&&(this.recCh=1),this.recBuffers=[],this.streamsize=this.getAdjustSamples(),this.strmL=new _.SignalArray(this.streamsize),this.strmR=new _.SignalArray(this.streamsize),this.inlets.push(h),o(c),setTimeout(this.delayProcess,10),t.promise()};var l=function(){this.status=s,this.reset();var t,e=this.recBuffers,i=this.samplerate,n=this.streamsize;this.samplerate=this.savedSamplerate,t=1/0!==this.recDuration?0|.001*this.recDuration*i:(e.length>>this.recCh-1)*n;var r,a,o=0|t/n,h=0,u=0,l=t;if(2===this.recCh){var c=new _.SignalArray(t),f=new _.SignalArray(t),p=new _.SignalArray(t);for(a=0;o>a;++a)if(c.set(e[h++],u),f.set(e[h++],u),u+=n,l-=n,l>0&&n>l){c.set(e[h++].subarray(0,l),u),f.set(e[h++].subarray(0,l),u);break}for(a=0,o=t;o>a;++a)p[a]=.5*(c[a]+f[a]);r={samplerate:i,channels:2,buffer:[p,c,f]}}else{var d=new _.SignalArray(t);for(a=0;o>a;++a)if(d.set(e[h++],u),u+=n,l-=n,l>0&&n>l){d.set(e[h++].subarray(0,l),u);break}r={samplerate:i,channels:1,buffer:[d]}}var m=[].concat.apply([r],arguments);this.deferred.resolve.apply(this.deferred,m),this.deferred=null};return u.on=function(t,e){this.events.on(t,e)},u.once=function(t,e){this.events.once(t,e)},u.off=function(t,e){this.events.off(t,e)},u.removeAllListeners=function(t){this.events.removeListeners(t)},u.listeners=function(t){return this.events.listeners(t)},u.fix_iOS6_1_problem=function(t){this.impl.fix_iOS6_1_problem&&this.impl.fix_iOS6_1_problem(t)},e}(),F=null,q=null;"undefined"!=typeof window&&(q=window.AudioContext||window.webkitAudioContext),F=q!==t?function(t){var e,i=new q;_._audioContext=i,this.maxSamplerate=i.sampleRate,this.defaultSamplerate=i.sampleRate,this.env="webkit";var s=navigator.userAgent;if(s.match(/linux/i)?t.streammsec*=8:s.match(/win(dows)?\s*(nt 5\.1|xp)/i)&&(t.streammsec*=4),this.play=function(){var s,n,r,a=t.getAdjustSamples(i.sampleRate),o=t.streamsize;t.samplerate===i.sampleRate?s=function(e){var i=e.outputBuffer;t.process(),i.getChannelData(0).set(t.strmL),i.getChannelData(1).set(t.strmR)}:2*t.samplerate===i.sampleRate?s=function(e){var i,s,n=t.strmL,r=t.strmR,a=e.outputBuffer,o=a.getChannelData(0),h=a.getChannelData(1),u=a.length;for(t.process(),i=s=0;u>i;i+=2,++s)o[i]=o[i+1]=n[s],h[i]=h[i+1]=r[s]}:(n=o,r=t.samplerate/i.sampleRate,s=function(e){var i,s=t.strmL,a=t.strmR,h=e.outputBuffer,u=h.getChannelData(0),l=h.getChannelData(1),c=h.length;for(i=0;c>i;++i)n>=o&&(t.process(),n-=o),u[i]=s[0|n],l[i]=a[0|n],n+=r}),e=i.createScriptProcessor(a,2,t.channels),e.onaudioprocess=s,e.connect(i.destination)},this.pause=function(){e.disconnect()},d){var n=0,r=i.createBufferSource();this.fix_iOS6_1_problem=function(t){n+=t?1:-1,1===n?(r.noteOn(0),r.connect(i.destination)):0===n&&r.disconnect()}}}:function(){this.maxSamplerate=48e3,this.defaultSamplerate=44100,this.env="nop",this.play=function(){},this.pause=function(){}},l=(new P).bind(F);var E=e;"node"===p?module.exports=global.timbre=E:"browser"===p&&(E.noConflict=function(){var t=window.timbre,e=window.T;return function(i){return window.T===E&&(window.T=e),i&&window.timbre===E&&(window.timbre=t),E}}(),window.timbre=window.T=E),function(){function t(t){try{return e.plugins&&e.mimeTypes&&e.mimeTypes.length?e.plugins["Shockwave Flash"].description.match(/([0-9]+)/)[t]:new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version").match(/([0-9]+)/)[t]}catch(i){return-1}}if("nop"===l.impl.env&&"browser"===p&&!d){var e=navigator;if(!(10>t(0))){var i,s="TimbreFlashPlayerDiv",n=function(){var t=document.getElementsByTagName("script");if(t&&t.length)for(var e,i=0,s=t.length;s>i;++i)if(e=/^(.*\/)timbre(?:\.dev)?\.js$/i.exec(t[i].src))return e[1]+"timbre.swf"}();window.timbrejs_flashfallback_init=function(){function t(t){var e=0;this.maxSamplerate=44100,this.defaultSamplerate=44100,this.env="flash",this.play=function(){var s,r=Array(t.streamsize*t.channels),a=t.streammsec,o=0,h=1e3*(t.streamsize/t.samplerate),u=Date.now();s=function(){if(!(o>Date.now()-u)){var e=t.strmL,s=t.strmR,n=r.length,a=e.length;for(t.process();a--;)r[--n]=0|32768*s[a],r[--n]=0|32768*e[a];i.writeAudio(r.join(" ")),o+=h}},i.setup?(i.setup(t.channels,t.samplerate),e=setInterval(s,a)):console.warn("Cannot find "+n)},this.pause=function(){0!==e&&(i.cancel(),clearInterval(e),e=0)}}l.bind(t),delete window.timbrejs_flashfallback_init};var r,a,o=n,h=o+"?"+ +new Date,u="TimbreFlashPlayer",c=document.createElement("div");c.id=s,c.style.display="inline",c.width=c.height=1,e.plugins&&e.mimeTypes&&e.mimeTypes.length?(r=document.createElement("object"),r.id=u,r.classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",r.width=r.height=1,r.setAttribute("data",h),r.setAttribute("type","application/x-shockwave-flash"),a=document.createElement("param"),a.setAttribute("name","allowScriptAccess"),a.setAttribute("value","always"),r.appendChild(a),c.appendChild(r)):c.innerHTML='<object id="'+u+'" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="1" height="1"><param name="movie" value="'+h+'" /><param name="bgcolor" value="#FFFFFF" /><param name="quality" value="high" /><param name="allowScriptAccess" value="always" /></object>',window.addEventListener("load",function(){document.body.appendChild(c),i=document[u]
})}}}()})(),function(t){"use strict";function e(t){this.samplerate=t,this.frequency=340,this.Q=1,this.gain=0,this.x1L=this.x2L=this.y1L=this.y2L=0,this.x1R=this.x2R=this.y1R=this.y2R=0,this.b0=this.b1=this.b2=this.a1=this.a2=0,this.setType("lpf")}var i=e.prototype;i.process=function(t,e){var i,s,n,r,a,o,h=this.x1L,u=this.x2L,l=this.y1L,c=this.y2L,f=this.x1R,p=this.x2R,d=this.y1R,m=this.y2R,v=this.b0,g=this.b1,b=this.b2,_=this.a1,y=this.a2;for(a=0,o=t.length;o>a;++a)i=t[a],n=v*i+g*h+b*u-_*l-y*c,u=h,h=i,c=l,l=n,s=e[a],r=v*s+g*f+b*p-_*d-y*m,p=f,f=s,m=d,d=r,t[a]=n,e[a]=r;this.x1L=h,this.x2L=u,this.y1L=l,this.y2L=c,this.x1R=f,this.x2R=p,this.y1R=d,this.y2R=m},i.setType=function(t){var e;(e=s[t])&&(this.type=t,e.call(this,this.frequency,this.Q,this.gain))},i.setParams=function(t,e,i){this.frequency=t,this.Q=e,this.gain=i;var n=s[this.type];return n&&n.call(this,t,e,i),this};var s={lowpass:function(t,e){if(t/=.5*this.samplerate,t>=1)this.b0=1,this.b1=this.b2=this.a1=this.a2=0;else if(0>=t)this.b0=this.b1=this.b2=this.a1=this.a2=0;else{e=0>e?0:e;var i=Math.pow(10,.05*e),s=Math.sqrt(.5*(4-Math.sqrt(16-16/(i*i)))),n=Math.PI*t,r=.5*s*Math.sin(n),a=.5*(1-r)/(1+r),o=(.5+a)*Math.cos(n),h=.25*(.5+a-o);this.b0=2*h,this.b1=4*h,this.b2=this.b0,this.a1=2*-o,this.a2=2*a}},highpass:function(t,e){if(t/=.5*this.samplerate,t>=1)this.b0=this.b1=this.b2=this.a1=this.a2=0;else if(0>=t)this.b0=1,this.b1=this.b2=this.a1=this.a2=0;else{e=0>e?0:e;var i=Math.pow(10,.05*e),s=Math.sqrt((4-Math.sqrt(16-16/(i*i)))/2),n=Math.PI*t,r=.5*s*Math.sin(n),a=.5*(1-r)/(1+r),o=(.5+a)*Math.cos(n),h=.25*(.5+a+o);this.b0=2*h,this.b1=-4*h,this.b2=this.b0,this.a1=2*-o,this.a2=2*a}},bandpass:function(t,e){if(t/=.5*this.samplerate,t>0&&1>t)if(e>0){var i=Math.PI*t,s=Math.sin(i)/(2*e),n=Math.cos(i),r=1/(1+s);this.b0=s*r,this.b1=0,this.b2=-s*r,this.a1=-2*n*r,this.a2=(1-s)*r}else this.b0=this.b1=this.b2=this.a1=this.a2=0;else this.b0=this.b1=this.b2=this.a1=this.a2=0},lowshelf:function(t,e,i){t/=.5*this.samplerate;var s=Math.pow(10,i/40);if(t>=1)this.b0=s*s,this.b1=this.b2=this.a1=this.a2=0;else if(0>=t)this.b0=1,this.b1=this.b2=this.a1=this.a2=0;else{var n=Math.PI*t,r=1,a=.5*Math.sin(n)*Math.sqrt((s+1/s)*(1/r-1)+2),o=Math.cos(n),h=2*Math.sqrt(s)*a,u=s+1,l=s-1,c=1/(u+l*o+h);this.b0=s*(u-l*o+h)*c,this.b1=2*s*(l-u*o)*c,this.b2=s*(u-l*o-h)*c,this.a1=-2*(l+u*o)*c,this.a2=(u+l*o-h)*c}},highshelf:function(t,e,i){t/=.5*this.samplerate;var s=Math.pow(10,i/40);if(t>=1)this.b0=1,this.b1=this.b2=this.a1=this.a2=0;else if(0>=t)this.b0=s*s,this.b1=this.b2=this.a1=this.a2=0;else{var n=Math.PI*t,r=1,a=.5*Math.sin(n)*Math.sqrt((s+1/s)*(1/r-1)+2),o=Math.cos(n),h=2*Math.sqrt(s)*a,u=s+1,l=s-1,c=1/(u-l*o+h);this.b0=s*(u+l*o+h)*c,this.b1=-2*s*(l+u*o)*c,this.b2=s*(u+l*o-h)*c,this.a1=2*(l-u*o)*c,this.a2=(u-l*o-h)*c}},peaking:function(t,e,i){if(t/=.5*this.samplerate,t>0&&1>t){var s=Math.pow(10,i/40);if(e>0){var n=Math.PI*t,r=Math.sin(n)/(2*e),a=Math.cos(n),o=1/(1+r/s);this.b0=(1+r*s)*o,this.b1=-2*a*o,this.b2=(1-r*s)*o,this.a1=this.b1,this.a2=(1-r/s)*o}else this.b0=s*s,this.b1=this.b2=this.a1=this.a2=0}else this.b0=1,this.b1=this.b2=this.a1=this.a2=0},notch:function(t,e){if(t/=.5*this.samplerate,t>0&&1>t)if(e>0){var i=Math.PI*t,s=Math.sin(i)/(2*e),n=Math.cos(i),r=1/(1+s);this.b0=r,this.b1=-2*n*r,this.b2=r,this.a1=this.b1,this.a2=(1-s)*r}else this.b0=this.b1=this.b2=this.a1=this.a2=0;else this.b0=1,this.b1=this.b2=this.a1=this.a2=0},allpass:function(t,e){if(t/=.5*this.samplerate,t>0&&1>t)if(e>0){var i=Math.PI*t,s=Math.sin(i)/(2*e),n=Math.cos(i),r=1/(1+s);this.b0=(1-s)*r,this.b1=-2*n*r,this.b2=(1+s)*r,this.a1=this.b1,this.a2=this.b0}else this.b0=-1,this.b1=this.b2=this.a1=this.a2=0;else this.b0=1,this.b1=this.b2=this.a1=this.a2=0}};s.lpf=s.lowpass,s.hpf=s.highpass,s.bpf=s.bandpass,s.bef=s.notch,s.brf=s.notch,s.apf=s.allpass,t.modules.Biquad=e}(timbre),function(t){"use strict";function e(e){this.samplerate=e;var i=Math.round(Math.log(.1*e)*Math.LOG2E);this.buffersize=1<<i,this.bufferL=new t.fn.SignalArray(this.buffersize+1),this.bufferR=new t.fn.SignalArray(this.buffersize+1),this.wave=null,this._wave=null,this.writeIndex=this.buffersize>>1,this.readIndex=0,this.delayTime=20,this.rate=4,this.depth=20,this.feedback=.2,this.wet=.5,this.phase=0,this.phaseIncr=0,this.phaseStep=4,this.setWaveType("sin"),this.setDelayTime(this.delayTime),this.setRate(this.rate)}var i=e.prototype,s=[];s[0]=function(){for(var t=new Float32Array(512),e=0;512>e;++e)t[e]=Math.sin(2*Math.PI*(e/512));return t}(),s[1]=function(){for(var t,e=new Float32Array(512),i=0;512>i;++i)t=i/512-.25,e[i]=1-4*Math.abs(Math.round(t)-t);return e}(),i.setWaveType=function(t){"sin"===t?(this.wave=t,this._wave=s[0]):"tri"===t&&(this.wave=t,this._wave=s[1])},i.setDelayTime=function(t){this.delayTime=t;for(var e=this.writeIndex-(0|.001*t*this.samplerate);0>e;)e+=this.buffersize;this.readIndex=e},i.setRate=function(t){this.rate=t,this.phaseIncr=512*this.rate/this.samplerate*this.phaseStep},i.process=function(t,e){var i,s,n,r,a,o=this.bufferL,h=this.bufferR,u=this.buffersize,l=u-1,c=this._wave,f=this.phase,p=this.phaseIncr,d=this.writeIndex,m=this.readIndex,v=this.depth,g=this.feedback,b=this.wet,_=1-b,y=t.length,w=this.phaseStep;for(r=0;y>r;){for(n=c[0|f]*v,f+=p;f>512;)f-=512;for(a=0;w>a;++a,++r)s=m+u+n&l,i=.5*(o[s]+o[s+1]),o[d]=t[r]-i*g,t[r]=t[r]*_+i*b,i=.5*(h[s]+h[s+1]),h[d]=e[r]-i*g,e[r]=e[r]*_+i*b,d=d+1&l,m=m+1&l}this.phase=f,this.writeIndex=d,this.readIndex=m},t.modules.Chorus=e}(timbre),function(t){"use strict";function e(e,s){this.samplerate=e,this.channels=s,this.lastPreDelayFrames=0,this.preDelayReadIndex=0,this.preDelayWriteIndex=n,this.ratio=-1,this.slope=-1,this.linearThreshold=-1,this.dbThreshold=-1,this.dbKnee=-1,this.kneeThreshold=-1,this.kneeThresholdDb=-1,this.ykneeThresholdDb=-1,this.K=-1,this.attackTime=.003,this.releaseTime=.25,this.preDelayTime=.006,this.dbPostGain=0,this.effectBlend=1,this.releaseZone1=.09,this.releaseZone2=.16,this.releaseZone3=.42,this.releaseZone4=.98,this.detectorAverage=0,this.compressorGain=1,this.meteringGain=1,this.delayBufferL=new t.fn.SignalArray(i),this.delayBufferR=2===s?new t.fn.SignalArray(i):this.delayBufferL,this.preDelayTime=6,this.preDelayReadIndex=0,this.preDelayWriteIndex=n,this.maxAttackCompressionDiffDb=-1,this.meteringReleaseK=1-Math.exp(-1/(.325*this.samplerate)),this.setAttackTime(this.attackTime),this.setReleaseTime(this.releaseTime),this.setPreDelayTime(this.preDelayTime),this.setParams(-24,30,12)}var i=1024,s=i-1,n=256,r=5,a=e.prototype;a.clone=function(){var t=new e(this.samplerate,this.channels);return t.setAttackTime(this.attackTime),t.setReleaseTime(this.releaseTime),t.setPreDelayTime(this.preDelayTime),t.setParams(this.dbThreshold,this.dbKnee,this.ratio),t},a.setAttackTime=function(t){this.attackTime=Math.max(.001,t),this._attackFrames=this.attackTime*this.samplerate},a.setReleaseTime=function(t){this.releaseTime=Math.max(.001,t);var e=this.releaseTime*this.samplerate,i=.0025;this._satReleaseFrames=i*this.samplerate;var s=e*this.releaseZone1,n=e*this.releaseZone2,r=e*this.releaseZone3,a=e*this.releaseZone4;this._kA=.9999999999999998*s+1.8432219684323923e-16*n-1.9373394351676423e-16*r+8.824516011816245e-18*a,this._kB=-1.5788320352845888*s+2.3305837032074286*n-.9141194204840429*r+.1623677525612032*a,this._kC=.5334142869106424*s-1.272736789213631*n+.9258856042207512*r-.18656310191776226*a,this._kD=.08783463138207234*s-.1694162967925622*n+.08588057951595272*r-.00429891410546283*a,this._kE=-.042416883008123074*s+.1115693827987602*n-.09764676325265872*r+.028494263462021576*a},a.setPreDelayTime=function(t){this.preDelayTime=t;var e=t*this.samplerate;if(e>i-1&&(e=i-1),this.lastPreDelayFrames!==e){this.lastPreDelayFrames=e;for(var s=0,n=this.delayBufferL.length;n>s;++s)this.delayBufferL[s]=this.delayBufferR[s]=0;this.preDelayReadIndex=0,this.preDelayWriteIndex=e}},a.setParams=function(t,e,i){this._k=this.updateStaticCurveParameters(t,e,i);var s=this.saturate(1,this._k),n=1/s;n=Math.pow(n,.6),this._masterLinearGain=Math.pow(10,.05*this.dbPostGain)*n},a.kneeCurve=function(t,e){return this.linearThreshold>t?t:this.linearThreshold+(1-Math.exp(-e*(t-this.linearThreshold)))/e},a.saturate=function(t,e){var i;if(this.kneeThreshold>t)i=this.kneeCurve(t,e);else{var s=t?20*Math.log(t)*Math.LOG10E:-1e3,n=this.ykneeThresholdDb+this.slope*(s-this.kneeThresholdDb);i=Math.pow(10,.05*n)}return i},a.slopeAt=function(t,e){if(this.linearThreshold>t)return 1;var i=1.001*t,s=t?20*Math.log(t)*Math.LOG10E:-1e3,n=i?20*Math.log(i)*Math.LOG10E:-1e3,r=this.kneeCurve(t,e),a=this.kneeCurve(i,e),o=r?20*Math.log(r)*Math.LOG10E:-1e3,h=a?20*Math.log(a)*Math.LOG10E:-1e3;return(h-o)/(n-s)},a.kAtSlope=function(t){for(var e=this.dbThreshold+this.dbKnee,i=Math.pow(10,.05*e),s=.1,n=1e4,r=5,a=0;15>a;++a){var o=this.slopeAt(i,r);t>o?n=r:s=r,r=Math.sqrt(s*n)}return r},a.updateStaticCurveParameters=function(t,e,i){this.dbThreshold=t,this.linearThreshold=Math.pow(10,.05*t),this.dbKnee=e,this.ratio=i,this.slope=1/this.ratio,this.kneeThresholdDb=t+e,this.kneeThreshold=Math.pow(10,.05*this.kneeThresholdDb);var s=this.kAtSlope(1/this.ratio),n=this.kneeCurve(this.kneeThreshold,s);return this.ykneeThresholdDb=n?20*Math.log(n)*Math.LOG10E:-1e3,this._k=s,this._k},a.process=function(t,e){for(var i=1-this.effectBlend,n=this.effectBlend,a=this._k,o=this._masterLinearGain,h=this._satReleaseFrames,u=this._kA,l=this._kB,c=this._kC,f=this._kD,p=this._kE,d=64,m=t.length/d,v=0,g=this.detectorAverage,b=this.compressorGain,_=this.maxAttackCompressionDiffDb,y=1/this._attackFrames,w=this.preDelayReadIndex,x=this.preDelayWriteIndex,k=this.detectorAverage,A=this.delayBufferL,S=this.delayBufferR,T=this.meteringGain,I=this.meteringReleaseK,R=0;m>R;++R){var O,D=Math.asin(g)/(.5*Math.PI),M=D>b,L=b/D,j=L?20*Math.log(L)*Math.LOG10E:-1e3;if((1/0===j||isNaN(j))&&(j=-1),M){_=-1,L=j,L=-12>L?0:L>0?3:.25*(L+12);var P=L*L,F=P*L,q=P*P,E=u+l*L+c*P+f*F+p*q,C=r/E;O=Math.pow(10,.05*C)}else{(-1===_||j>_)&&(_=j);var B=Math.max(.5,_);L=.25/B,O=1-Math.pow(L,y)}for(var z=d;z--;){var N=0,G=.5*(t[v]+e[v]);A[x]=t[v],S[x]=e[v],0>G&&(G*=-1),G>N&&(N=G);var W=N;0>W&&(W*=-1);var V=this.saturate(W,a),K=1e-4>=W?1:V/W,$=K?-20*Math.log(K)*Math.LOG10E:1e3;2>$&&($=2);var Y=$/h,H=Math.pow(10,.05*Y)-1,Q=K>k,Z=Q?H:1;k+=(K-k)*Z,k>1&&(k=1),1>O?b+=(D-b)*O:(b*=O,b>1&&(b=1));var U=Math.sin(.5*Math.PI*b),X=i+n*o*U,J=20*Math.log(U)*Math.LOG10E;T>J?T=J:T+=(J-T)*I,t[v]=A[w]*X,e[v]=S[w]*X,v++,w=w+1&s,x=x+1&s}1e-6>k&&(k=1e-6),1e-6>b&&(b=1e-6)}this.preDelayReadIndex=w,this.preDelayWriteIndex=x,this.detectorAverage=k,this.compressorGain=b,this.maxAttackCompressionDiffDb=_,this.meteringGain=T},a.reset=function(){this.detectorAverage=0,this.compressorGain=1,this.meteringGain=1;for(var t=0,e=this.delayBufferL.length;e>t;++t)this.delayBufferL[t]=this.delayBufferR[t]=0;this.preDelayReadIndex=0,this.preDelayWriteIndex=n,this.maxAttackCompressionDiffDb=-1},t.modules.Compressor=e}(timbre),function(t){"use strict";function e(){}e.prototype.decode=function(t,i,s){if("string"==typeof t){if(/\.wav$/.test(t))return e.wav_decode(t,i,s);if(e.ogg_decode&&/\.ogg$/.test(t))return e.ogg_decode(t,i,s);if(e.mp3_decode&&/\.mp3$/.test(t))return e.mp3_decode(t,i,s)}else if("object"==typeof t){if("wav"===t.type)return e.wav_decode(t.data,i,s);if(e.ogg_decode&&"ogg"===t.type)return e.ogg_decode(t.data,i,s);if(e.mp3_decode&&"mp3"===t.type)return e.mp3_decode(t.data,i,s)}return e.webkit_decode?"object"==typeof t?e.webkit_decode(t.data||t,i,s):e.webkit_decode(t,i,s):e.moz_decode?e.moz_decode(t,i,s):(i(!1),void 0)},t.modules.Decoder=e,e.getBinaryWithPath="browser"===t.envtype?function(e,i){t.fn.fix_iOS6_1_problem(!0);var s=new XMLHttpRequest;s.open("GET",e),s.responseType="arraybuffer",s.onreadystatechange=function(){4===s.readyState&&(s.response?i(new Uint8Array(s.response)):void 0!==s.responseBody&&i(new Uint8Array(VBArray(s.responseBody).toArray())),t.fn.fix_iOS6_1_problem(!1))},s.send()}:function(t,e){e("no support")};var i=function(t){for(var e,i,s,n,r,a=new Int32Array(t.length/3),o=0,h=t.length,u=0;h>o;)e=t[o++],i=t[o++],s=t[o++],n=e+(i<<8)+(s<<16),r=8388608&n?n-16777216:n,a[u++]=r;return a};e.wav_decode=function(){var t=function(t,e,s){if("RIFF"!==String.fromCharCode(t[0],t[1],t[2],t[3]))return e(!1);var n=t[4]+(t[5]<<8)+(t[6]<<16)+(t[7]<<24);if(n+8!==t.length)return e(!1);if("WAVE"!==String.fromCharCode(t[8],t[9],t[10],t[11]))return e(!1);if("fmt "!==String.fromCharCode(t[12],t[13],t[14],t[15]))return e(!1);for(var r=t[22]+(t[23]<<8),a=t[24]+(t[25]<<8)+(t[26]<<16)+(t[27]<<24),o=t[34]+(t[35]<<8),h=36;t.length>h&&"data"!==String.fromCharCode(t[h],t[h+1],t[h+2],t[h+3]);)h+=1;if(h>=t.length)return e(!1);h+=4;var u=t[h]+(t[h+1]<<8)+(t[h+2]<<16)+(t[h+3]<<24),l=(u/r>>1)/a;if(h+=4,u>t.length-h)return e(!1);var c,f,p;c=new Float32Array(0|l*a),2===r&&(f=new Float32Array(c.length),p=new Float32Array(c.length)),e({samplerate:a,channels:r,buffer:[c,f,p],duration:l}),8===o?t=new Int8Array(t.buffer,h):16===o?t=new Int16Array(t.buffer,h):32===o?t=new Int32Array(t.buffer,h):24===o&&(t=i(new Uint8Array(t.buffer,h)));var d,m,v,g=1/((1<<o-1)-1);if(2===r)for(h=m=0,d=c.length;d>h;++h)v=f[h]=t[m++]*g,v+=p[h]=t[m++]*g,c[h]=.5*v;else for(h=0,d=c.length;d>h;++h)c[h]=t[h]*g;s()};return function(i,s,n){"string"==typeof i?e.getBinaryWithPath(i,function(e){t(e,s,n)}):t(i,s,n)}}(),e.webkit_decode=function(){if(t.fn._audioContext!==void 0){var i=t.fn._audioContext,s=function(t,e,s){var n,r,a,o,h;if("string"==typeof t)return s(!1);var u;try{u=i.createBuffer(t.buffer,!1)}catch(l){return e(!1)}n=i.sampleRate,r=u.numberOfChannels,2===r?(a=u.getChannelData(0),o=u.getChannelData(1)):a=o=u.getChannelData(0),h=a.length/n;for(var c=new Float32Array(a),f=0,p=c.length;p>f;++f)c[f]=.5*(c[f]+o[f]);e({samplerate:n,channels:r,buffer:[c,a,o],duration:h}),s()};return function(t,i,n){if(t instanceof File){var r=new FileReader;r.onload=function(t){s(new Uint8Array(t.target.result),i,n)},r.readAsArrayBuffer(t)}else"string"==typeof t?e.getBinaryWithPath(t,function(t){s(t,i,n)}):s(t,i,n)}}}(),e.moz_decode=function(){return"function"==typeof Audio&&"function"==typeof(new Audio).mozSetup?function(t,e,i){var s,n,r,a,o,h,u=0,l=new Audio(t);l.volume=0,l.addEventListener("loadedmetadata",function(){s=l.mozSampleRate,n=l.mozChannels,h=l.duration,r=new Float32Array(0|l.duration*s),2===n&&(a=new Float32Array(0|l.duration*s),o=new Float32Array(0|l.duration*s)),2===n?l.addEventListener("MozAudioAvailable",function(t){for(var e,i=t.frameBuffer,s=0,n=i.length;n>s;s+=2)e=a[u]=i[s],e+=o[u]=i[s+1],r[u]=.5*e,u+=1},!1):l.addEventListener("MozAudioAvailable",function(t){for(var e=t.frameBuffer,i=0,s=e.length;s>i;++i)r[i]=e[i],u+=1},!1),l.play(),setTimeout(function(){e({samplerate:s,channels:n,buffer:[r,a,o],duration:h})},1e3)},!1),l.addEventListener("ended",function(){i()},!1),l.load()}:void 0}()}(timbre),function(t){"use strict";function e(t){this.samplerate=t||44100,this.value=s,this.status=f,this.curve="linear",this.step=1,this.releaseNode=null,this.loopNode=null,this.emit=null,this._envValue=new i(t),this._table=[],this._initValue=s,this._curveValue=0,this._defaultCurveType=r,this._index=0,this._counter=0}function i(t){this.samplerate=t,this.value=s,this.step=1,this._curveType=r,this._curveValue=0,this._grow=0,this._a2=0,this._b1=0,this._y1=0,this._y2=0}var s=e.ZERO=1e-6,n=e.CurveTypeSet=0,r=e.CurveTypeLin=1,a=e.CurveTypeExp=2,o=e.CurveTypeSin=3,h=e.CurveTypeWel=4,u=e.CurveTypeCurve=5,l=e.CurveTypeSqr=6,c=e.CurveTypeCub=7,f=e.StatusWait=0,p=e.StatusGate=1,d=e.StatusSustain=2,m=e.StatusRelease=3,v=e.StatusEnd=4,g={set:n,lin:r,linear:r,exp:a,exponential:a,sin:o,sine:o,wel:h,welch:h,sqr:l,squared:l,cub:c,cubed:c};e.CurveTypeDict=g;var b=e.prototype;b.clone=function(){var t=new e(this.samplerate);return t._table=this._table,t._initValue=this._initValue,t.setCurve(this.curve),null!==this.releaseNode&&t.setReleaseNode(this.releaseNode+1),null!==this.loopNode&&t.setLoopNode(this.loopNode+1),t.setStep(this.step),t.reset(),t},b.setTable=function(t){this._initValue=t[0],this._table=t.slice(1),this.value=this._envValue.value=this._initValue,this._index=0,this._counter=0,this.status=f},b.setCurve=function(t){"number"==typeof t?(this._defaultCurveType=u,this._curveValue=t,this.curve=t):(this._defaultCurveType=g[t]||null,this.curve=t)},b.setReleaseNode=function(t){"number"==typeof t&&t>0&&(this.releaseNode=t-1)},b.setLoopNode=function(t){"number"==typeof t&&t>0&&(this.loopNode=t-1)},b.setStep=function(t){this.step=this._envValue.step=t},b.reset=function(){this.value=this._envValue.value=this._initValue,this._index=0,this._counter=0,this.status=f},b.release=function(){null!==this.releaseNode&&(this._counter=0,this.status=m)},b.getInfo=function(t){var e,i,s=this._table,n=0,r=1/0,a=1/0,o=!1;for(e=0,i=s.length;i>e;++e){this.loopNode===e&&(r=n),this.releaseNode===e&&(t>n?n+=t:n=t,a=n);var h=s[e];Array.isArray(h)&&(n+=h[1])}return 1/0!==r&&1/0===a&&(n+=t,o=!0),{totalDuration:n,loopBeginTime:r,releaseBeginTime:a,isEndlessLoop:o}},b.calcStatus=function(){var t,e,i,s,a=this.status,o=this._table,h=this._index,l=this._counter,c=this._curveValue,g=this._defaultCurveType,b=this.loopNode,_=this.releaseNode,y=this._envValue,w=null;switch(a){case f:case v:break;case p:case m:for(;0>=l;)if(h>=o.length){if(a===p&&null!==b){h=b;continue}a=v,l=1/0,s=n,w="ended"}else if(a!==p||h!==_)t=o[h++],e=t[0],s=null===t[2]?g:t[2],s===u&&(c=t[3],.001>Math.abs(c)&&(s=r)),i=t[1],l=y.setNext(e,i,s,c);else{if(null!==b&&_>b){h=b;continue}a=d,l=1/0,s=n,w="sustained"}}return this.status=a,this.emit=w,this._index=h,this._counter=l,a},b.next=function(){return 1&this.calcStatus()&&(this.value=this._envValue.next()||s),this._counter-=1,this.value},b.process=function(t){var e,i=this._envValue,n=t.length;if(1&this.calcStatus())for(e=0;n>e;++e)t[e]=i.next()||s;else{var r=this.value||s;for(e=0;n>e;++e)t[e]=r}this.value=t[n-1],this._counter-=t.length},i.prototype.setNext=function(t,e,i,s){var f,p,d,m,v,g,b,y=this.step,w=this.value,x=0|.001*e*this.samplerate/y;switch(1>x&&(x=1,i=n),i){case n:this.value=t;break;case r:f=(t-w)/x;break;case a:f=0!==w?Math.pow(t/w,1/x):0;break;case o:p=Math.PI/x,m=.5*(t+w),v=2*Math.cos(p),g=.5*(t-w),b=g*Math.sin(.5*Math.PI-p),w=m-g;break;case h:p=.5*Math.PI/x,v=2*Math.cos(p),t>=w?(m=w,g=0,b=-Math.sin(p)*(t-w)):(m=t,g=w-t,b=Math.cos(p)*(w-t)),w=m+g;break;case u:d=(t-w)/(1-Math.exp(s)),m=w+d,v=d,f=Math.exp(s/x);break;case l:g=Math.sqrt(w),b=Math.sqrt(t),f=(b-g)/x;break;case c:g=Math.pow(w,.33333333),b=Math.pow(t,.33333333),f=(b-g)/x}return this.next=_[i],this._grow=f,this._a2=m,this._b1=v,this._y1=g,this._y2=b,x};var _=[];_[n]=function(){return this.value},_[r]=function(){return this.value+=this._grow,this.value},_[a]=function(){return this.value*=this._grow,this.value},_[o]=function(){var t=this._b1*this._y1-this._y2;return this.value=this._a2-t,this._y2=this._y1,this._y1=t,this.value},_[h]=function(){var t=this._b1*this._y1-this._y2;return this.value=this._a2+t,this._y2=this._y1,this._y1=t,this.value},_[u]=function(){return this._b1*=this._grow,this.value=this._a2-this._b1,this.value},_[l]=function(){return this._y1+=this._grow,this.value=this._y1*this._y1,this.value},_[c]=function(){return this._y1+=this._grow,this.value=this._y1*this._y1*this._y1,this.value},i.prototype.next=_[n],t.modules.Envelope=e,t.modules.EnvelopeValue=i}(timbre),function(t){"use strict";function e(e){e="number"==typeof e?e:512,e=1<<Math.ceil(Math.log(e)*Math.LOG2E),this.length=e,this.buffer=new t.fn.SignalArray(e),this.real=new t.fn.SignalArray(e),this.imag=new t.fn.SignalArray(e),this._real=new t.fn.SignalArray(e),this._imag=new t.fn.SignalArray(e),this.mag=new t.fn.SignalArray(e>>1),this.minDecibels=-30,this.maxDecibels=-100;var i=s.get(e);this._bitrev=i.bitrev,this._sintable=i.sintable,this._costable=i.costable}var i=e.prototype;i.setWindow=function(e){if("string"==typeof e){var i=/([A-Za-z]+)(?:\(([01]\.?\d*)\))?/.exec(e);if(null!==i){var s=i[1].toLowerCase(),r=void 0!==i[2]?+i[2]:.25,a=n[s];if(a){this._window||(this._window=new t.fn.SignalArray(this.length));var o=this._window,h=0,u=this.length;for(r=0>r?0:r>1?1:r;u>h;++h)o[h]=a(h,u,r);this.windowName=e}}}},i.forward=function(t){var e,i,s,n,r,a,o,h,u,l,c,f=this.buffer,p=this.real,d=this.imag,m=this._window,v=this._bitrev,g=this._sintable,b=this._costable,_=f.length;if(m)for(e=0;_>e;++e)f[e]=t[e]*m[e];else f.set(t);for(e=0;_>e;++e)p[e]=f[v[e]],d[e]=0;for(s=1;_>s;s=n)for(r=0,n=s+s,a=_/n,i=0;s>i;i++){for(o=b[r],h=g[r],e=i;_>e;e+=n)u=e+s,l=h*d[u]+o*p[u],c=o*d[u]-h*p[u],p[u]=p[e]-l,p[e]+=l,d[u]=d[e]-c,d[e]+=c;r+=a}var y,w,x=this.mag;for(e=0;_>e;++e)y=p[e],w=d[e],x[e]=Math.sqrt(y*y+w*w);return{real:p,imag:d}},i.inverse=function(t,e){var i,s,n,r,a,o,h,u,l,c,f,p=this.buffer,d=this._real,m=this._imag,v=this._bitrev,g=this._sintable,b=this._costable,_=p.length;for(i=0;_>i;++i)s=v[i],d[i]=+t[s],m[i]=-e[s];for(n=1;_>n;n=r)for(a=0,r=n+n,o=_/r,s=0;n>s;s++){for(h=b[a],u=g[a],i=s;_>i;i+=r)l=i+n,c=u*m[l]+h*d[l],f=h*m[l]-u*d[l],d[l]=d[i]-c,d[i]+=c,m[l]=m[i]-f,m[i]+=f;a+=o}for(i=0;_>i;++i)p[i]=d[i]/_;return p},i.getFrequencyData=function(t){var e,i=this.minDecibels,s=Math.min(this.mag.length,t.length);if(s){var n,r=this.mag,a=0;for(e=0;s>e;++e)n=r[e],t[e]=n?20*Math.log(n)*Math.LOG10E:i,t[e]>a&&(a=t[e])}return t};var s={get:function(e){return s[e]||function(){var i,n,r=function(){var t,i,s,n,r;for(t=new Int16Array(e),r=e>>1,i=s=0;t[i]=s,!(++i>=e);){for(n=r;s>=n;)s-=n,n>>=1;s+=n}return t}(),a=Math.floor(Math.log(e)/Math.LN2),o=new t.fn.SignalArray((1<<a)-1),h=new t.fn.SignalArray((1<<a)-1),u=2*Math.PI;for(i=0,n=o.length;n>i;++i)o[i]=Math.sin(u*(i/e)),h[i]=Math.cos(u*(i/e));return s[e]={bitrev:r,sintable:o,costable:h},s[e]}()}},n=function(){var t=Math.PI,e=2*Math.PI,i=Math.abs,s=Math.pow,n=Math.cos,r=Math.sin,a=function(e){return r(t*e)/(t*e)},o=Math.E;return{rectangular:function(){return 1},hann:function(t,i){return.5*(1-n(e*t/(i-1)))},hamming:function(t,i){return.54-.46*n(e*t/(i-1))},tukery:function(e,i,s){return s*(i-1)/2>e?.5*(1+n(t*(2*e/(s*(i-1))-1))):e>(i-1)*(1-s/2)?.5*(1+n(t*(2*e/(s*(i-1))-2/s+1))):1},cosine:function(e,i){return r(t*e/(i-1))},lanczos:function(t,e){return a(2*t/(e-1)-1)},triangular:function(t,e){return 2/(e+1)*((e+1)/2-i(t-(e-1)/2))},bartlett:function(t,e){return 2/(e-1)*((e-1)/2-i(t-(e-1)/2))},gaussian:function(t,e,i){return s(o,-.5*s((t-(e-1)/2)/(i*(e-1)/2),2))},bartlettHann:function(t,s){return.62-.48*i(t/(s-1)-.5)-.38*n(e*t/(s-1))},blackman:function(i,s,r){var a=(1-r)/2,o=.5,h=r/2;return a-o*n(e*i/(s-1))+h*n(4*t*i/(s-1))}}}();t.modules.FFT=e}(timbre),function(t){"use strict";function e(t){this.samplerate=t||44100,this.wave=null,this.step=1,this.frequency=0,this.value=0,this.phase=0,this.feedback=!1,this._x=0,this._lastouts=0,this._coeff=r/this.samplerate,this._radtoinc=r/(2*Math.PI)}function i(t,e,i,s){var n,r,a,o,h,u=l[e];if(void 0!==u){switch("function"==typeof u&&(u=u()),i){case"@1":for(r=512;1024>r;++r)u[r]=0;break;case"@2":for(r=512;1024>r;++r)u[r]=Math.abs(u[r]);break;case"@3":for(r=256;512>r;++r)u[r]=0;for(r=512;768>r;++r)u[r]=Math.abs(u[r]);for(r=768;1024>r;++r)u[r]=0;break;case"@4":for(n=new Float32Array(1024),r=0;512>r;++r)n[r]=u[r<<1];u=n;break;case"@5":for(n=new Float32Array(1024),r=0;512>r;++r)n[r]=Math.abs(u[r<<1]);u=n}if(void 0!==s&&50!==s){for(s*=.01,s=0>s?0:s>1?1:s,n=new Float32Array(1024),a=0|1024*s,r=0;a>r;++r)n[r]=u[0|512*(r/a)];for(h=1024-a,o=0;1024>r;++r,++o)n[r]=u[0|512*(o/h)+512];u=n}if("+"===t)for(r=0;1024>r;++r)u[r]=.5*u[r]+.5;else if("-"===t)for(r=0;1024>r;++r)u[r]*=-1;return u}}function s(t){var e=new Float32Array(1024),i=t.length>>1;if(-1!==[2,4,8,16,32,64,128,256,512,1024].indexOf(i))for(var s=0,n=0;i>s;++s){var r=parseInt(t.substr(2*s,2),16);r=128&r?(r-256)/128:r/127;for(var a=0,o=1024/i;o>a;++a)e[n++]=r}return e}function n(t){var e=new Float32Array(1024);if(8===t.length){var i,s,n=parseInt(t,16),r=new Float32Array(8);for(r[0]=1,i=0;7>i;++i)r[i+1]=.0625*(15&n),n>>=4;for(i=0;8>i;++i){var a=0,o=(i+1)/1024;for(s=0;1024>s;++s)e[s]+=Math.sin(2*Math.PI*a)*r[i],a+=o}var h,u=0;for(i=0;1024>i;++i)(h=Math.abs(e[i]))>u&&(u=h);if(u>0)for(i=0;1024>i;++i)e[i]/=u}return e}var r=1024,a=r-1,o=e.prototype;o.setWave=function(e){var i,s,n=this.wave;if(this.wave||(this.wave=new Float32Array(r+1)),"function"==typeof e)for(i=0;r>i;++i)n[i]=e(i/r);else if(t.fn.isSignalArray(e))if(e.length===n.length)n.set(e);else for(s=e.length/r,i=0;r>i;++i)n[i]=e[0|i*s];else"string"==typeof e&&void 0!==(s=h(e))&&this.wave.set(s);this.wave[r]=this.wave[0]},o.clone=function(){var t=new e(this.samplerate);return t.wave=this.wave,t.step=this.step,t.frequency=this.frequency,t.value=this.value,t.phase=this.phase,t.feedback=this.feedback,t},o.reset=function(){this._x=0},o.next=function(){var t=this._x,e=0|t+this.phase*this._radtoinc;return this.value=this.wave[e&a],t+=this.frequency*this._coeff*this.step,t>r&&(t-=r),this._x=t,this.value},o.process=function(t){var e,i,s,n,o,h,u=this.wave,l=this._radtoinc,c=this._x,f=this.frequency*this._coeff,p=this.step;if(this.feedback){var d=this._lastouts;for(l*=this.phase,h=0;p>h;++h)e=c+d*l,i=0|e,s=e-i,i&=a,n=u[i],o=u[i+1],t[h]=d=n+s*(o-n),c+=f;this._lastouts=d}else{var m=this.phase*l;for(h=0;p>h;++h)e=c+m,i=0|e,s=e-i,i&=a,n=u[i],o=u[i+1],t[h]=n+s*(o-n),c+=f}c>r&&(c-=r),this._x=c,this.value=t[t.length-1]},o.processWithFreqArray=function(t,e){var i,s,n,o,h,u,l=this.wave,c=this._radtoinc,f=this._x,p=this._coeff,d=this.step;if(this.feedback){var m=this._lastouts;for(c*=this.phase,u=0;d>u;++u)i=f+m*c,s=0|i,n=i-s,s&=a,o=l[s],h=l[s+1],t[u]=m=o+n*(h-o),f+=e[u]*p;this._lastouts=m}else{var v=this.phase*this._radtoinc;for(u=0;d>u;++u)i=f+v,s=0|i,n=i-s,s&=a,o=l[s],h=l[s+1],t[u]=o+n*(h-o),f+=e[u]*p}f>r&&(f-=r),this._x=f,this.value=t[t.length-1]},o.processWithPhaseArray=function(t,e){var i,s,n,o,h,u,l=this.wave,c=this._radtoinc,f=this._x,p=this.frequency*this._coeff,d=this.step;if(this.feedback){var m=this._lastouts;for(c*=this.phase,u=0;d>u;++u)i=f+m*c,s=0|i,n=i-s,s&=a,o=l[s],h=l[s+1],t[u]=m=o+n*(h-o),f+=p;this._lastouts=m}else for(u=0;d>u;++u)i=f+e[u]*c,s=0|i,n=i-s,s&=a,o=l[s],h=l[s+1],t[u]=o+n*(h-o),f+=p;f>r&&(f-=r),this._x=f,this.value=t[t.length-1]},o.processWithFreqAndPhaseArray=function(t,e,i){var s,n,o,h,u,l,c=this.wave,f=this._radtoinc,p=this._x,d=this._coeff,m=this.step;if(this.feedback){var v=this._lastouts;for(f*=this.phase,l=0;m>l;++l)s=p+v*f,n=0|s,o=s-n,n&=a,h=c[n],u=c[n+1],t[l]=v=h+o*(u-h),p+=e[l]*d;this._lastouts=v}else for(l=0;m>l;++l)s=p+i[l]*r,n=0|s,o=s-n,n&=a,h=c[n],u=c[n+1],t[l]=h+o*(u-h),p+=e[l]*d;p>r&&(p-=r),this._x=p,this.value=t[t.length-1]};var h=function(t){var e=l[t];if(void 0!==e)return"function"==typeof e&&(e=e()),e;var r;if(r=/^([\-+]?)(\w+)(?:\((@[0-7])?:?(\d+)?\))?$/.exec(t),null!==r){var a=r[1],o=r[2],h=r[3],u=r[4];if(e=i(a,o,h,u),void 0!==e)return l[t]=e,e}return r=/^wavb\(((?:[0-9a-fA-F][0-9a-fA-F])+)\)$/.exec(t),null!==r?s(r[1]):(r=/^wavc\(([0-9a-fA-F]{8})\)$/.exec(t),null!==r?n(r[1]):void 0)};e.getWavetable=h;var u=function(e,i){var s,n,r=new Float32Array(1024);if("function"==typeof i)for(n=0;1024>n;++n)r[n]=i(n/1024);else if(t.fn.isSignalArray(i))if(i.length===r.length)r.set(i);else for(s=i.length/1024,n=0;1024>n;++n)r[n]=i[0|n*s];l[e]=r};e.setWavetable=u;var l={sin:function(){for(var t=new Float32Array(1024),e=0;1024>e;++e)t[e]=Math.sin(2*Math.PI*(e/1024));return t},cos:function(){for(var t=new Float32Array(1024),e=0;1024>e;++e)t[e]=Math.cos(2*Math.PI*(e/1024));return t},pulse:function(){for(var t=new Float32Array(1024),e=0;1024>e;++e)t[e]=512>e?1:-1;return t},tri:function(){for(var t,e=new Float32Array(1024),i=0;1024>i;++i)t=i/1024-.25,e[i]=1-4*Math.abs(Math.round(t)-t);return e},saw:function(){for(var t,e=new Float32Array(1024),i=0;1024>i;++i)t=i/1024,e[i]=2*(t-Math.round(t));return e},fami:function(){for(var t=[0,.125,.25,.375,.5,.625,.75,.875,.875,.75,.625,.5,.375,.25,.125,0,-.125,-.25,-.375,-.5,-.625,-.75,-.875,-1,-1,-.875,-.75,-.625,-.5,-.375,-.25,-.125],e=new Float32Array(1024),i=0;1024>i;++i)e[i]=t[0|i/1024*t.length];return e},konami:function(){for(var t=[-.625,-.875,-.125,.75,.5,.125,.5,.75,.25,-.125,.5,.875,.625,0,.25,.375,-.125,-.75,0,.625,.125,-.5,-.375,-.125,-.75,-1,-.625,0,-.375,-.875,-.625,-.25],e=new Float32Array(1024),i=0;1024>i;++i)e[i]=t[0|i/1024*t.length];return e}};t.modules.Oscillator=e}(timbre),function(t){"use strict";function e(e,a){this.samplerate=e;var o,h,u=e/44100;for(h=2*n.length,this.comb=Array(h),this.combout=Array(h),o=0;h>o;++o)this.comb[o]=new i(n[o%n.length]*u),this.combout[o]=new t.fn.SignalArray(a);for(h=2*r.length,this.allpass=Array(h),o=0;h>o;++o)this.allpass[o]=new s(r[o%r.length]*u);this.outputs=[new t.fn.SignalArray(a),new t.fn.SignalArray(a)],this.damp=0,this.wet=.33,this.setRoomSize(.5),this.setDamp(.5)}function i(e){this.buffer=new t.fn.SignalArray(0|e),this.buffersize=this.buffer.length,this.bufidx=0,this.feedback=0,this.filterstore=0,this.damp=0}function s(e){this.buffer=new t.fn.SignalArray(0|e),this.buffersize=this.buffer.length,this.bufidx=0}var n=[1116,1188,1277,1356,1422,1491,1557,1617],r=[225,556,441,341],a=e.prototype;a.setRoomSize=function(t){var e=this.comb,i=.28*t+.7;this.roomsize=t,e[0].feedback=e[1].feedback=e[2].feedback=e[3].feedback=e[4].feedback=e[5].feedback=e[6].feedback=e[7].feedback=e[8].feedback=e[9].feedback=e[10].feedback=e[11].feedback=e[12].feedback=e[13].feedback=e[14].feedback=e[15].feedback=i},a.setDamp=function(t){var e=this.comb,i=.4*t;this.damp=t,e[0].damp=e[1].damp=e[2].damp=e[3].damp=e[4].damp=e[5].damp=e[6].damp=e[7].damp=e[8].damp=e[9].damp=e[10].damp=e[11].damp=e[12].damp=e[13].damp=e[14].damp=e[15].damp=i},a.process=function(t,e){var i,s=this.comb,n=this.combout,r=this.allpass,a=this.outputs[0],o=this.outputs[1],h=this.wet,u=1-h,l=t.length;for(s[0].process(t,n[0]),s[1].process(t,n[1]),s[2].process(t,n[2]),s[3].process(t,n[3]),s[4].process(t,n[4]),s[5].process(t,n[5]),s[6].process(t,n[6]),s[7].process(t,n[7]),s[8].process(e,n[8]),s[9].process(e,n[9]),s[10].process(e,n[10]),s[11].process(e,n[11]),s[12].process(e,n[12]),s[13].process(e,n[13]),s[14].process(e,n[14]),s[15].process(e,n[15]),i=0;l>i;++i)a[i]=n[0][i]+n[1][i]+n[2][i]+n[3][i]+n[4][i]+n[5][i]+n[6][i]+n[7][i],o[i]=n[8][i]+n[9][i]+n[10][i]+n[11][i]+n[12][i]+n[13][i]+n[14][i]+n[15][i];for(r[0].process(a,a),r[1].process(a,a),r[2].process(a,a),r[3].process(a,a),r[4].process(o,o),r[5].process(o,o),r[6].process(o,o),r[7].process(o,o),i=0;l>i;++i)t[i]=a[i]*h+t[i]*u,e[i]=o[i]*h+e[i]*u},i.prototype.process=function(t,e){var i,s,n,r=this.buffer,a=this.buffersize,o=this.bufidx,h=this.filterstore,u=this.feedback,l=this.damp,c=1-l,f=t.length;for(n=0;f>n;++n)i=.015*t[n],s=r[o],h=s*c+h*l,r[o]=i+h*u,++o>=a&&(o=0),e[n]=s;this.bufidx=o,this.filterstore=h},s.prototype.process=function(t,e){var i,s,n,r,a=this.buffer,o=this.buffersize,h=this.bufidx,u=t.length;for(r=0;u>r;++r)i=t[r],n=a[h],s=-i+n,a[h]=i+.5*n,++h>=o&&(h=0),e[r]=s;this.bufidx=h},t.modules.Reverb=e}(timbre),function(t){"use strict";function e(t){return new i(t)}function i(t){if(this.fragments=[],t){var e=t.samplerate||44100,i=t.buffer[0].length/e;this.fragments.push(new s(t,0,i))}}function s(t,e,i,s,n,r,o){t||(t=a),this.buffer=t.buffer[0],this.samplerate=t.samplerate||44100,this.start=e,this._duration=i,this.reverse=s||!1,this.pitch=n||100,this.stretch=r||!1,this.pan=o||50}function n(t,e){this.tape=t,this.fragments=t.fragments,this.samplerate=e||44100,this.isEnded=!1,this.buffer=null,this.bufferIndex=0,this.bufferIndexIncr=0,this.bufferBeginIndex=0,this.bufferEndIndex=0,this.fragment=null,this.fragmentIndex=0,this.panL=.5,this.panR=.5}var r=new Float32Array(60),a={buffer:r,samplerate:1};e.silence=function(t){return new e(a).slice(0,1).fill(t)},e.join=function(t){for(var e=new i,s=0;t.length>s;s++)t[s]instanceof i&&e.add_fragments(t[s].fragments);return e},e.Tape=i,i.prototype.add_fragment=function(t){return this.fragments.push(t),this},i.prototype.add_fragments=function(t){for(var e=0;t.length>e;e++)this.fragments.push(t[e]);return this},i.prototype.duration=function(){for(var t=0,e=0;this.fragments.length>e;e++)t+=this.fragments[e].duration();
return t},i.prototype.slice=function(t,e){var s=this.duration();t+e>s&&(e=s-t);for(var n=new i,r=t,a=e,o=0;this.fragments.length>o;o++){var h=this.fragments[o],u=h.create(r,a),l=u[0];if(r=u[1],a=u[2],l&&n.add_fragment(l),0===a)break}return n},i.prototype.cut=i.prototype.slice,i.prototype.concat=function(t){var e=new i;return e.add_fragments(this.fragments),e.add_fragments(t.fragments),e},i.prototype.loop=function(t){var e,s=[];for(e=0;this.fragments.length>e;e++)s.push(this.fragments[e].clone());var n=new i;for(e=0;t>e;e++)n.add_fragments(s);return n},i.prototype.times=i.prototype.loop,i.prototype.split=function(t){for(var e=this.duration()/t,i=[],s=0;t>s;s++)i.push(this.slice(s*e,e));return i},i.prototype.fill=function(t){var e=this.duration();if(0===e)throw"EmptyFragment";var i=0|t/e,s=t%e;return this.loop(i).plus(this.slice(0,s))},i.prototype.replace=function(t,s,n){var r=new i,a=t+s;r=r.plus(this.slice(0,t));var o=r.duration();t>o&&(r=r.plus(e.silence(t-o))),r=r.plus(n);var h=this.duration();return h>a&&(r=r.plus(this.slice(a,h-a))),r},i.prototype.reverse=function(){for(var t=new i,e=this.fragments.length;e--;){var s=this.fragments[e].clone();s.reverse=!s.isReversed(),t.add_fragment(s)}return t},i.prototype.pitch=function(t,e){var s=new i;e=e||!1;for(var n=0;this.fragments.length>n;n++){var r=this.fragments[n].clone();r.pitch*=.01*t,r.stretch=e,s.add_fragment(r)}return s},i.prototype.stretch=function(t){var e=100*(1/(.01*t));return this.pitch(e,!0)},i.prototype.pan=function(t){var e=new i;t>100?t=100:0>t&&(t=0);for(var s=0;this.fragments.length>s;s++){var n=this.fragments[s].clone();n.pan=t,e.add_fragment(n)}return e},i.prototype.silence=function(){return e.silence(this.duration())},i.prototype.join=function(t){for(var e=new i,s=0;t.length>s;s++)t[s]instanceof i&&e.add_fragments(t[s].fragments);return e},i.prototype.getBuffer=function(){var t=44100;this.fragments.length>0&&(t=this.fragments[0].samplerate);var e=new n(this,t),i=0|this.duration()*t;return{samplerate:t,buffer:e.fetch(i)}},s.prototype.duration=function(){return this._duration*(100/this.pitch)},s.prototype.original_duration=function(){return this._duration},s.prototype.isReversed=function(){return this.reverse},s.prototype.isStretched=function(){return this.stretched},s.prototype.create=function(t,e){var i=this.duration();if(t>=i)return[null,t-i,e];var s,n=t+e>=i;n?(s=i-t,e-=s):(s=e,e=0);var r=this.clone();return r.start=this.start+.01*t*this.pitch,r._duration=.01*s*this.pitch,r.reverse=!1,[r,0,e]},s.prototype.clone=function(){var t=new s;return t.buffer=this.buffer,t.samplerate=this.samplerate,t.start=this.start,t._duration=this._duration,t.reverse=this.reverse,t.pitch=this.pitch,t.stretch=this.stretch,t.pan=this.pan,t},e.Fragment=s,e.TapeStream=n,n.prototype.reset=function(){return this.isEnded=!1,this.buffer=null,this.bufferIndex=0,this.bufferIndexIncr=0,this.bufferBeginIndex=0,this.bufferEndIndex=0,this.fragment=null,this.fragmentIndex=0,this.panL=.5,this.panR=.5,this.isLooped=!1,this},n.prototype.fetch=function(e){var i=new t.fn.SignalArray(e),s=new t.fn.SignalArray(e),n=this.fragments;if(0===n.length)return[i,s];for(var a,o=100*this.samplerate,h=this.buffer,u=this.bufferIndex,l=this.bufferIndexIncr,c=this.bufferBeginIndex,f=this.bufferEndIndex,p=this.fragment,d=this.fragmentIndex,m=this.panL,v=this.panR,g=0;e>g;g++){for(;!h||c>u||u>=f;)if(!p||n.length>d)p=n[d++],h=p.buffer,l=p.samplerate/o*p.pitch,c=p.start*p.samplerate,f=c+p.original_duration()*p.samplerate,a=.01*p.pan,m=1-a,v=a,p.reverse?(l*=-1,u=f+l):u=c;else{if(!this.isLooped){this.isEnded=!0,h=r,l=0,u=0;break}h=null,u=0,l=0,c=0,f=0,p=null,d=0}i[g]=h[0|u]*m,s[g]=h[0|u]*v,u+=l}return this.buffer=h,this.bufferIndex=u,this.bufferIndexIncr=l,this.bufferBeginIndex=c,this.bufferEndIndex=f,this.fragment=p,this.fragmentIndex=d,this.panL=m,this.panR=v,[i,s]},t.modules.Scissor=e}(timbre),function(t){"use strict";function e(e){this.samplerate=e;var i=Math.ceil(Math.log(1.5*e)*Math.LOG2E);this.buffersize=1<<i,this.buffermask=this.buffersize-1,this.writeBufferL=new t.fn.SignalArray(this.buffersize),this.writeBufferR=new t.fn.SignalArray(this.buffersize),this.readBufferL=this.writeBufferL,this.readBufferR=this.writeBufferR,this.delaytime=null,this.feedback=null,this.cross=null,this.mix=null,this.prevL=0,this.prevR=0,this.readIndex=0,this.writeIndex=0,this.setParams(125,.25,!1,.45)}var i=e.prototype;i.setParams=function(t,e,i,s){if(this.delaytime!==t){this.delaytime=t;var n=0|.001*t*this.samplerate;n>this.buffermask&&(n=this.buffermask),this.writeIndex=this.readIndex+n&this.buffermask}this.feedback!==e&&(this.feedback=e),this.cross!==i&&(this.cross=i,i?(this.readBufferL=this.writeBufferR,this.readBufferR=this.writeBufferL):(this.readBufferL=this.writeBufferL,this.readBufferR=this.writeBufferR)),this.mix!==s&&(this.mix=s)},i.process=function(t,e){var i,s,n=this.readBufferL,r=this.readBufferR,a=this.writeBufferL,o=this.writeBufferR,h=this.readIndex,u=this.writeIndex,l=this.buffermask,c=this.feedback,f=this.mix,p=1-f,d=this.prevL,m=this.prevR,v=t.length;for(s=0;v>s;++s)i=n[h],a[u]=t[s]-i*c,t[s]=d=.5*(t[s]*p+i*f+d),i=r[h],o[u]=e[s]-i*c,e[s]=m=.5*(e[s]*p+i*f+m),h+=1,u=u+1&l;this.readIndex=h&this.buffermask,this.writeIndex=u,this.prevL=d,this.prevR=m},t.modules.StereoDelay=e}(timbre),function(t){"use strict";var e=t.fn,i=t.modules;e.register("audio",function(t){var i=e.getClass("buffer"),r=new i(t);return r.playbackState=e.FINISHED_STATE,r._.isLoaded=!1,Object.defineProperties(r,{isLoaded:{get:function(){return this._.isLoaded}}}),r.load=s,r.loadthis=n,r});var s=function(s){var n=this,r=this._,a=new i.Deferred(this),o=arguments,h=1;a.done(function(){n._.emit("done")}),"function"==typeof o[h]&&(a.done(o[h++]),"function"==typeof o[h]&&a.fail(o[h++])),r.loadedTime=0;var u=function(i,s){var r=n._;i?(n.playbackState=e.PLAYING_STATE,r.samplerate=i.samplerate,r.channels=i.channels,r.bufferMix=null,r.buffer=i.buffer,r.phase=0,r.phaseIncr=i.samplerate/t.samplerate,r.duration=1e3*i.duration,r.currentTime=0,r.isReversed&&(r.phaseIncr*=-1,r.phase=i.buffer[0].length+r.phaseIncr),n._.emit("loadedmetadata")):a.reject(s)},l=function(){n._.isLoaded=!0,n._.plotFlush=!0,n._.emit("loadeddata"),a.resolveWith(n)};return(new i.Decoder).decode(s,u,l),a.promise()},n=function(){return s.apply(this,arguments),this}}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var s=this._;s.biquad=new n(s.samplerate),s.freq=t(340),s.band=t(1),s.gain=t(0),s.plotBefore=a,s.plotRange=[-18,18],s.plotFlush=!0}var i=t.fn,s=t.modules.FFT,n=t.modules.Biquad,r=20;i.extend(e);var a=function(t,e,i,s,n){t.lineWidth=1,t.strokeStyle="rgb(192, 192, 192)";for(var a=.5*this._.samplerate,o=1;10>=o;++o)for(var h=1;4>=h;h++){var u=o*Math.pow(10,h);if(!(r>=u||u>=a)){t.beginPath();var l=Math.log(u/r)/Math.log(a/r);l=(0|l*s+e)+.5,t.moveTo(l,i),t.lineTo(l,i+n),t.stroke()}}var c=n/6;for(o=1;6>o;o++){t.beginPath();var f=(0|i+o*c)+.5;t.moveTo(e,f),t.lineTo(e+s,f),t.stroke()}},o=e.prototype;Object.defineProperties(o,{type:{set:function(t){var e=this._;t!==e.biquad.type&&(e.biquad.setType(t),e.plotFlush=!0)},get:function(){return this._.biquad.type}},freq:{set:function(e){this._.freq=t(e)},get:function(){return this._.freq}},cutoff:{set:function(e){this._.freq=t(e)},get:function(){return this._.freq}},res:{set:function(e){this._.band=t(e)},get:function(){return this._.band}},Q:{set:function(e){this._.band=t(e)},get:function(){return this._.band}},band:{set:function(e){this._.band=t(e)},get:function(){return this._.band}},gain:{set:function(e){this._.gain=t(e)},get:function(){return this._.gain}}}),o.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t,i.inputSignalAR(this);var s=e.freq.process(t).cells[0][0],n=e.band.process(t).cells[0][0],r=e.gain.process(t).cells[0][0];(e.prevFreq!==s||e.prevband!==n||e.prevGain!==r)&&(e.prevFreq=s,e.prevband=n,e.prevGain=r,e.biquad.setParams(s,n,r),e.plotFlush=!0),e.bypassed||e.biquad.process(this.cells[1],this.cells[2]),i.outputSignalAR(this)}return this};var h=new s(2048),u=t.Object.prototype.plot;o.plot=function(t){if(this._.plotFlush){var e=new n(this._.samplerate);e.setType(this.type),e.setParams(this.freq.valueOf(),this.band.valueOf(),this.gain.valueOf());var i=new Float32Array(h.length);i[0]=1,e.process(i,i),h.forward(i);var s,a,o,l,c,f,p,d,m=512,v=new Float32Array(m),g=.5*this._.samplerate,b=new Float32Array(m);for(h.getFrequencyData(b),s=0;m>s;++s)o=Math.pow(g/r,s/m)*r,a=o/(g/b.length),l=0|a,c=a-l,0===l?p=f=d=b[l]:(f=b[l-1],p=b[l],d=(1-c)*f+c*p),v[s]=d;this._.plotData=v,this._.plotFlush=null}return u.call(this,t)},i.register("biquad",e),i.register("lowpass",function(t){return new e(t).set("type","lowpass")}),i.register("highpass",function(t){return new e(t).set("type","highpass")}),i.register("bandpass",function(t){return new e(t).set("type","bandpass")}),i.register("lowshelf",function(t){return new e(t).set("type","lowshelf")}),i.register("highshelf",function(t){return new e(t).set("type","highshelf")}),i.register("peaking",function(t){return new e(t).set("type","peaking")}),i.register("notch",function(t){return new e(t).set("type","notch")}),i.register("allpass",function(t){return new e(t).set("type","allpass")}),i.alias("lpf","lowpass"),i.alias("hpf","highpass"),i.alias("bpf","bandpass"),i.alias("bef","notch"),i.alias("brf","notch"),i.alias("apf","allpass")}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),i.fixAR(this);var s=this._;s.pitch=t(1),s.samplerate=44100,s.channels=0,s.bufferMix=null,s.buffer=[],s.isLooped=!1,s.isReversed=!1,s.duration=0,s.currentTime=0,s.currentTimeObj=null,s.phase=0,s.phaseIncr=0,s.onended=i.make_onended(this,0),s.onlooped=r(this)}var i=t.fn,s=t.modules.Scissor.Tape,n=function(t){return i.isSignalArray(t)||t instanceof Float32Array};i.extend(e);var r=function(t){return function(){var e=t._;e.phase>=e.buffer[0].length?e.phase=0:0>e.phase&&(e.phase=e.buffer[0].length+e.phaseIncr),t._.emit("looped")}},a=e.prototype,o=function(e){var i=this._;if("object"==typeof e){var r,a,o=[];n(e)?(o[0]=e,a=1):"object"==typeof e&&(e instanceof t.Object?e=e.buffer:e instanceof s&&(e=e.getBuffer()),Array.isArray(e.buffer)?n(e.buffer[0])&&(n(e.buffer[1])&&n(e.buffer[2])?(a=2,o=e.buffer):(a=1,o=[e.buffer[0]])):n(e.buffer)&&(a=1,o=[e.buffer]),"number"==typeof e.samplerate&&(r=e.samplerate)),o.length&&(r>0&&(i.samplerate=e.samplerate),i.bufferMix=null,i.buffer=o,i.phase=0,i.phaseIncr=i.samplerate/t.samplerate,i.duration=1e3*i.buffer[0].length/i.samplerate,i.currentTime=0,i.plotFlush=!0,this.reverse(i.isReversed))}};Object.defineProperties(a,{buffer:{set:o,get:function(){var t=this._;return{samplerate:t.samplerate,channels:t.channels,buffer:t.buffer}}},pitch:{set:function(e){this._.pitch=t(e)},get:function(){return this._.pitch}},isLooped:{get:function(){return this._.isLooped}},isReversed:{get:function(){return this._.isReversed}},samplerate:{get:function(){return this._.samplerate}},duration:{get:function(){return this._.duration}},currentTime:{set:function(e){if("number"==typeof e){var i=this._;e>=0&&i.duration>=e&&(i.phase=e/1e3*i.samplerate,i.currentTime=e)}else e instanceof t.Object?this._.currentTimeObj=e:null===e&&(this._.currentTimeObj=null)},get:function(){return this._.currentTimeObj?this._.currentTimeObj:this._.currentTime}}}),a.clone=function(){var t=this._,e=i.clone(this);return t.buffer.length&&o.call(e,{buffer:t.buffer,samplerate:t.samplerate,channels:t.channels}),e.loop(t.isLooped),e.reverse(t.isReversed),e},a.slice=function(e,s){var n=this._,r=t(n.originkey),a=n.isReversed;if(n.buffer.length){if(e="number"==typeof e?0|.001*e*n.samplerate:0,s="number"==typeof s?0|.001*s*n.samplerate:n.buffer[0].length,e>s){var h=e;e=s,s=h,a=!a}2===n.channels?o.call(r,{buffer:[i.pointer(n.buffer[0],e,s-e),i.pointer(n.buffer[1],e,s-e),i.pointer(n.buffer[2],e,s-e)],samplerate:n.samplerate}):o.call(r,{buffer:i.pointer(n.buffer[0],e,s-e),samplerate:n.samplerate}),r.playbackState=i.PLAYING_STATE}return r.loop(n.isLooped),r.reverse(n.isReversed),r},a.reverse=function(t){var e=this._;return e.isReversed=!!t,e.isReversed?(e.phaseIncr>0&&(e.phaseIncr*=-1),0===e.phase&&e.buffer.length&&(e.phase=e.buffer[0].length+e.phaseIncr)):0>e.phaseIncr&&(e.phaseIncr*=-1),this},a.loop=function(t){return this._.isLooped=!!t,this},a.bang=function(t){return this.playbackState=t===!1?i.FINISHED_STATE:i.PLAYING_STATE,this._.phase=0,this._.emit("bang"),this},a.process=function(t){var e=this._;if(!e.buffer.length)return this;if(this.tickID!==t){this.tickID=t;var s,n,r,a=this.cells[1],o=this.cells[2],h=e.phase,u=e.cellsize;if(2===e.channels?(n=e.buffer[1],r=e.buffer[2]):n=r=e.buffer[0],e.currentTimeObj){var l,c=e.currentTimeObj.process(t).cells[0],f=.001*e.samplerate;for(s=0;u>s;++s)l=c[s],h=l*f,a[s]=n[0|h]||0,o[s]=r[0|h]||0;e.phase=h,e.currentTime=l}else{var p=e.pitch.process(t).cells[0][0],d=e.phaseIncr*p;for(s=0;u>s;++s)a[s]=n[0|h]||0,o[s]=r[0|h]||0,h+=d;h>=n.length?e.isLooped?i.nextTick(e.onlooped):i.nextTick(e.onended):0>h&&(e.isLooped?i.nextTick(e.onlooped):i.nextTick(e.onended)),e.phase=h,e.currentTime+=i.currentTimeIncr}i.outputSignalAR(this)}return this};var h=t.Object.prototype.plot;a.plot=function(t){var e,i,s=this._;if(s.plotFlush){2===s.channels?(e=s.buffer[1],i=s.buffer[2]):e=i=s.buffer[0];for(var n=new Float32Array(2048),r=0,a=e.length/2048,o=0;2048>o;o++)n[o]=.5*(e[0|r]+i[0|r]),r+=a;s.plotData=n,s.plotFlush=null}return h.call(this,t)},i.register("buffer",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var n=new s(this._.samplerate);n.setDelayTime(20),n.setRate(4),n.depth=20,n.feedback=.2,n.mix=.33,this._.chorus=n}var i=t.fn,s=t.modules.Chorus;i.extend(e);var n=e.prototype;Object.defineProperties(n,{type:{set:function(t){this._.chorus.setDelayTime(t)},get:function(){return this._.chorus.wave}},delay:{set:function(t){t>=.5&&80>=t&&this._.chorus.setDelayTime(t)},get:function(){return this._.chorus.delayTime}},rate:{set:function(t){"number"==typeof t&&t>0&&this._.chorus.setRate(t)},get:function(){return this._.chorus.rate}},depth:{set:function(t){"number"==typeof t&&t>=0&&100>=t&&(t*=this._.samplerate/44100,this._.chorus.depth=t)},get:function(){return this._.chorus.depth}},fb:{set:function(t){"number"==typeof t&&t>=-1&&1>=t&&(this._.chorus.feedback=.99996*t)},get:function(){return this._.chorus.feedback}},mix:{set:function(e){this._.mix=t(e)},get:function(){return this._.mix}}}),n.process=function(t){var e=this._;return this.tickID!==t&&(this.tickID=t,i.inputSignalAR(this),e.bypassed||e.chorus.process(this.cells[1],this.cells[2]),i.outputSignalAR(this)),this},i.register("chorus",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e);var i=this._;i.min=-.8,i.max=.8}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{minmax:{set:function(t){var e=this._;"number"==typeof t&&(e.min=-Math.abs(t),e.max=-e.min)},get:function(){return this._.max}},min:{set:function(t){var e=this._;"number"==typeof t&&(t>e.max?e.max=t:e.min=t)},get:function(){return this._.min}},max:{set:function(t){var e=this._;"number"==typeof t&&(e.min>t?e.min=t:e.max=t)},get:function(){return this._.max}}}),s.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s,n,r=this.cells[1],a=this.cells[2],o=r.length,h=e.min,u=e.max;if(e.ar){for(i.inputSignalAR(this),s=0;o>s;++s)n=r[s],h>n?n=h:n>u&&(n=u),r[s]=n,n=a[s],h>n?n=h:n>u&&(n=u),a[s]=n;i.outputSignalAR(this)}else n=i.inputSignalKR(this),h>n?n=h:n>u&&(n=u),this.cells[0][0]=n,i.outputSignalKR(this)}return this},i.register("clip",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var s=this._;s.prevThresh=-24,s.prevKnee=30,s.prevRatio=12,s.thresh=t(s.prevThresh),s.knee=t(s.prevKnee),s.ratio=t(s.prevRatio),s.postGain=6,s.reduction=0,s.attack=3,s.release=25,s.comp=new n(s.samplerate),s.comp.dbPostGain=s.postGain,s.comp.setAttackTime(.001*s.attack),s.comp.setReleaseTime(.001*s.release),s.comp.setPreDelayTime(6),s.comp.setParams(s.prevThresh,s.prevKnee,s.prevRatio)}var i=t.fn,s=t.timevalue,n=t.modules.Compressor;i.extend(e);var r=e.prototype;Object.defineProperties(r,{thresh:{set:function(e){this._.thresh=t(e)},get:function(){return this._.thresh}},thre:{set:function(e){this._.thresh=t(e)},get:function(){return this._.thre}},knee:{set:function(e){this._.kne=t(e)},get:function(){return this._.knee}},ratio:{set:function(e){this._.ratio=t(e)},get:function(){return this._.ratio}},gain:{set:function(t){"number"==typeof t&&(this._.comp.dbPostGain=t)},get:function(){return this._.comp.dbPostGain}},attack:{set:function(t){"string"==typeof t&&(t=s(t)),"number"==typeof t&&(t=0>t?0:t>1e3?1e3:t,this._.attack=t,this._.comp.setAttackTime(.001*t))},get:function(){return this._.attack}},release:{set:function(t){"string"==typeof t&&(t=s(t)),"number"==typeof t&&(t=0>t?0:t>1e3?1e3:t,this._.release=t,this._.comp.setReleaseTime(.001*t))},get:function(){return this._.release}},reduction:{get:function(){return this._.reduction}}}),r.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t,i.inputSignalAR(this);var s=e.thresh.process(t).cells[0][0],n=e.knee.process(t).cells[0][0],r=e.ratio.process(t).cells[0][0];(e.prevThresh!==s||e.prevKnee!==n||e.prevRatio!==r)&&(e.prevThresh=s,e.prevKnee=n,e.prevRatio=r,e.comp.setParams(s,n,r)),e.bypassed||(e.comp.process(this.cells[1],this.cells[2]),e.reduction=e.comp.meteringGain),i.outputSignalAR(this)}return this},i.register("comp",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var s=this._;s.time=t(100),s.fb=t(.2),s.cross=t(!1),s.mix=.33,s.delay=new n(s.samplerate)}var i=t.fn,s=t.timevalue,n=t.modules.StereoDelay;i.extend(e);var r=e.prototype;Object.defineProperties(r,{time:{set:function(e){"string"==typeof e&&(e=s(e)),this._.time=t(e)},get:function(){return this._.time}},fb:{set:function(e){this._.fb=t(e)},get:function(){return this._.fb}},cross:{set:function(e){this._.cross=t(e)},get:function(){return this._.cross}},mix:{set:function(t){"number"==typeof t&&(t=t>1?1:0>t?0:t,this._.mix=t)},get:function(){return this._.mix}}}),r.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s=e.time.process(t).cells[0][0],n=e.fb.process(t).cells[0][0],r=0!==e.cross.process(t).cells[0][0],a=e.mix;(e.prevTime!==s||e.prevFb!==n||e.prevCross!==r||e.prevMix!==a)&&(e.prevTime=s,e.prevFb=n,e.prevCross=r,e.prevMix=a,e.delay.setParams(s,n,r,a)),i.inputSignalAR(this),e.bypassed||e.delay.process(this.cells[1],this.cells[2]),i.outputSignalAR(this)}return this},i.register("delay",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var s=this._;s.pre=t(60),s.post=t(-18),s.x1L=s.x2L=s.y1L=s.y2L=0,s.x1R=s.x2R=s.y1R=s.y2R=0,s.b0=s.b1=s.b2=s.a1=s.a2=0,s.cutoff=0,s.Q=1,s.preScale=0,s.postScale=0}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{cutoff:{set:function(t){"number"==typeof t&&t>0&&(this._.cutoff=t)},get:function(){return this._.cutoff}},pre:{set:function(e){this._.pre=t(e)},get:function(){return this._.pre}},post:{set:function(e){this._.post=t(e)},get:function(){return this._.post}}}),s.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t,i.inputSignalAR(this);var s=-e.pre.process(t).cells[0][0],r=-e.post.process(t).cells[0][0];if((e.prevPreGain!==s||e.prevPostGain!==r)&&(e.prevPreGain=s,e.prevPostGain=r,e.preScale=Math.pow(10,.05*-s),e.postScale=Math.pow(10,.05*-r)),!e.bypassed){var a,o,h,u,l,c=this.cells[1],f=this.cells[2],p=e.preScale,d=e.postScale;if(e.cutoff){e.prevCutoff!==e.cutoff&&(e.prevCutoff=e.cutoff,n(e));var m=e.x1L,v=e.x2L,g=e.y1L,b=e.y2L,_=e.x1R,y=e.x2R,w=e.y1R,x=e.y2R,k=e.b0,A=e.b1,S=e.b2,T=e.a1,I=e.a2;for(a=0,o=c.length;o>a;++a)u=c[a]*p,l=k*u+A*m+S*v-T*g-I*b,h=l*d,-1>h?h=-1:h>1&&(h=1),c[a]=h,v=m,m=u,b=g,g=l,u=f[a]*p,l=k*u+A*_+S*y-T*w-I*x,h=l*d,-1>h?h=-1:h>1&&(h=1),f[a]=h,y=_,_=u,x=w,w=l;e.x1L=m,e.x2L=v,e.y1L=g,e.y2L=b,e.x1R=_,e.x2R=y,e.y1R=w,e.y2R=x}else for(a=0,o=c.length;o>a;++a)h=c[a]*p*d,-1>h?h=-1:h>1&&(h=1),c[a]=h,h=f[a]*p*d,-1>h?h=-1:h>1&&(h=1),f[a]=h}i.outputSignalAR(this)}return this};var n=function(t){var e=2*Math.PI*t.cutoff/t.samplerate,i=Math.cos(e),s=Math.sin(e),n=s/(2*t.Q),r=1/(1+n);t.b0=.5*(1-i)*r,t.b1=1-i*r,t.b2=.5*(1-i)*r,t.a1=-2*i*r,t.a2=1-n*r};i.register("dist",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),this._.ar=!1}var i=t.fn;i.extend(e);var s=e.prototype;s.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s,n,r,a,o,h,u=this.nodes,l=this.cells[0],c=this.cells[1],f=this.cells[2],p=u.length,d=l.length;if(e.ar){if(u.length>0)for(u[0].process(t),a=u[0].cells[1],o=u[0].cells[2],c.set(a),f.set(o),s=1;p>s;++s)for(u[s].process(t),a=u[s].cells[1],o=u[s].cells[2],n=0;d>n;++n)h=a[n],c[n]=0===h?0:c[n]/h,h=o[n],f[n]=0===h?0:f[n]/h;else for(n=0;d>n;++n)c[n]=f[s]=0;i.outputSignalAR(this)}else{if(u.length>0)for(r=u[0].process(t).cells[0][0],s=1;p>s;++s)h=u[s].process(t).cells[0][0],r=0===h?0:r/h;else r=0;l[0]=r,i.outputSignalKR(this)}}return this},i.register("/",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e);var i=this._;i.env=new r(i.samplerate),i.env.setStep(i.cellsize),i.tmp=new s.SignalArray(i.cellsize),i.ar=!1,i.plotFlush=!0,i.onended=h(this),this.on("ar",o)}function i(t,e,i,s,n,r){var a=i;return"number"==typeof t[s]?a=t[s]:"number"==typeof t[n]?a=t[n]:r&&("string"==typeof t[s]?a=r(t[s]):"string"==typeof t[n]&&(a=r(t[n]))),e>a&&(a=e),a}var s=t.fn,n=t.timevalue,r=t.modules.Envelope,a=s.isDictionary;s.extend(e);var o=function(t){this._.env.setStep(t?1:this._.cellsize)},h=function(t){return function(){t._.emit("ended")}},u=e.prototype;Object.defineProperties(u,{table:{set:function(t){Array.isArray(t)&&(l.call(this,t),this._.plotFlush=!0)},get:function(){return this._.env.table}},curve:{set:function(t){this._.env.setCurve(t)},get:function(){return this._.env.curve}},releaseNode:{set:function(t){this._.env.setReleaseNode(t),this._.plotFlush=!0},get:function(){return this._.env.releaseNode+1}},loopNode:{set:function(t){this._.env.setLoopNode(t),this._.plotFlush=!0},get:function(){return this._.env.loopNode+1}}}),u.clone=function(){var t=s.clone(this);return t._.env=this._.env.clone(),t},u.reset=function(){return this._.env.reset(),this},u.release=function(){var t=this._;return t.env.release(),t.emit("released"),this},u.bang=function(){var t=this._;return t.env.reset(),t.env.status=r.StatusGate,t.emit("bang"),this},u.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var i,n=this.cells[1],r=this.cells[2],a=e.cellsize;if(this.nodes.length)s.inputSignalAR(this);else for(i=0;a>i;++i)n[i]=r[i]=1;var o,h=null;if(e.ar){var u=e.tmp;for(e.env.process(u),i=0;a>i;++i)n[i]*=u[i],r[i]*=u[i];h=e.env.emit}else{for(o=e.env.next(),i=0;a>i;++i)n[i]*=o,r[i]*=o;h=e.env.emit}s.outputSignalAR(this),h&&("ended"===h?s.nextTick(e.onended):this._.emit(h,e.value))}return this};var l=function(t){for(var e,i,s,a,o=this._.env,h=[t[0]||f],u=1,l=t.length;l>u;++u)e=t[u][0]||f,i=t[u][1],s=t[u][2],"number"!=typeof i&&(i="string"==typeof i?n(i):10),10>i&&(i=10),"number"==typeof s?(a=s,s=r.CurveTypeCurve):(s=r.CurveTypeDict[s]||null,a=0),h.push([e,i,s,a]);o.setTable(h)},c=t.Object.prototype.plot;u.plot=function(t){if(this._.plotFlush){var e,i,s=this._.env.clone(),n=s.getInfo(1e3),a=n.totalDuration,o=n.loopBeginTime,h=n.releaseBeginTime,u=new Float32Array(256),l=0,f=a/u.length,p=!1,d=0|.001*a*this._.samplerate;for(d/=u.length,s.setStep(d),s.status=r.StatusGate,e=0,i=u.length;i>e;++e)u[e]=s.next(),l+=f,!p&&l>=h&&(s.release(),p=!0);this._.plotData=u,this._.plotBefore=function(t,e,i,s,n){var r,u;1/0!==o&&1/0!==h&&(r=e+s*(o/a),u=e+s*(h/a),u-=r,t.fillStyle="rgba(224, 224, 224, 0.8)",t.fillRect(r,0,u,n)),1/0!==h&&(r=e+s*(h/a),u=s-r,t.fillStyle="rgba(212, 212, 212, 0.8)",t.fillRect(r,0,u,n))};var m=1/0,v=-1/0;for(e=0;i>e;++e)m>u[e]?m=u[e]:u[e]>v&&(v=u[e]);1>v&&(v=1),this._.plotRange=[m,v],this._.plotData=u,this._.plotFlush=null}return c.call(this,t)},s.register("env",e);var f=r.ZERO;s.register("perc",function(t){a(t[0])||t.unshift({});var s=t[0],r=i(s,10,10,"a","attackTime",n),o=i(s,10,1e3,"r","releaseTime",n),h=i(s,f,1,"lv","level");return s.table=[f,[h,r],[f,o]],new e(t)}),s.register("adsr",function(t){a(t[0])||t.unshift({});var s=t[0],r=i(s,10,10,"a","attackTime",n),o=i(s,10,300,"d","decayTime",n),h=i(s,f,.5,"s","sustainLevel"),u=i(s,10,1e3,"r","decayTime",n),l=i(s,f,1,"lv","level");return s.table=[f,[l,r],[h,o],[f,u]],s.releaseNode=3,new e(t)}),s.register("adshr",function(t){a(t[0])||t.unshift({});var s=t[0],r=i(s,10,10,"a","attackTime",n),o=i(s,10,300,"d","decayTime",n),h=i(s,f,.5,"s","sustainLevel"),u=i(s,10,500,"h","holdTime",n),l=i(s,10,1e3,"r","decayTime",n),c=i(s,f,1,"lv","level");return s.table=[f,[c,r],[h,o],[h,u],[f,l]],new e(t)}),s.register("asr",function(t){a(t[0])||t.unshift({});var s=t[0],r=i(s,10,10,"a","attackTime",n),o=i(s,f,.5,"s","sustainLevel"),h=i(s,10,1e3,"r","releaseTime",n);return s.table=[f,[o,r],[f,h]],s.releaseNode=2,new e(t)}),s.register("dadsr",function(t){a(t[0])||t.unshift({});var s=t[0],r=i(s,10,100,"dl","delayTime",n),o=i(s,10,10,"a","attackTime",n),h=i(s,10,300,"d","decayTime",n),u=i(s,f,.5,"s","sustainLevel"),l=i(s,10,1e3,"r","relaseTime",n),c=i(s,f,1,"lv","level");return s.table=[f,[f,r],[c,o],[u,h],[f,l]],s.releaseNode=4,new e(t)}),s.register("ahdsfr",function(t){a(t[0])||t.unshift({});var s=t[0],r=i(s,10,10,"a","attackTime",n),o=i(s,10,10,"h","holdTime",n),h=i(s,10,300,"d","decayTime",n),u=i(s,f,.5,"s","sustainLevel"),l=i(s,10,5e3,"f","fadeTime",n),c=i(s,10,1e3,"r","relaseTime",n),p=i(s,f,1,"lv","level");return s.table=[f,[p,r],[p,o],[u,h],[f,l],[f,c]],s.releaseNode=5,new e(t)}),s.register("linen",function(t){a(t[0])||t.unshift({});var s=t[0],r=i(s,10,10,"a","attackTime",n),o=i(s,10,1e3,"s","sustainTime",n),h=i(s,10,1e3,"r","releaseTime",n),u=i(s,f,1,"lv","level");return s.table=[f,[u,r],[u,o],[f,h]],new e(t)}),s.register("env.tri",function(t){a(t[0])||t.unshift({});var s=t[0],r=i(s,20,1e3,"dur","duration",n),o=i(s,f,1,"lv","level");return r*=.5,s.table=[f,[o,r],[f,r]],new e(t)}),s.register("env.cutoff",function(t){a(t[0])||t.unshift({});var s=t[0],r=i(s,10,100,"r","relaseTime",n),o=i(s,f,1,"lv","level");return s.table=[o,[f,r]],new e(t)})}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var s=this._;s.biquads=Array(7),s.plotBefore=o,s.plotRange=[-18,18],s.plotFlush=!0}var i=t.fn,s=t.modules.FFT,n=t.modules.Biquad,r=20,a={hpf:0,lf:1,lmf:2,mf:3,hmf:4,hf:5,lpf:6};i.extend(e);var o=function(t,e,i,s,n){t.lineWidth=1,t.strokeStyle="rgb(192, 192, 192)";for(var a=.5*this._.samplerate,o=1;10>=o;++o)for(var h=1;4>=h;h++){var u=o*Math.pow(10,h);if(!(r>=u||u>=a)){t.beginPath();var l=Math.log(u/r)/Math.log(a/r);l=(0|l*s+e)+.5,t.moveTo(l,i),t.lineTo(l,i+n),t.stroke()}}var c=n/6;for(o=1;6>o;o++){t.beginPath();var f=(0|i+o*c)+.5;t.moveTo(e,f),t.lineTo(e+s,f),t.stroke()}},h=e.prototype;Object.defineProperties(h,{params:{set:function(t){if("object"==typeof t)for(var e=Object.keys(t),i=0,s=e.length;s>i;++i){var n=t[e[i]];Array.isArray(n)?this.setParams(e[i],n[0],n[1],n[2]):this.setParams(e[i])}}}}),h.setParams=function(t,e,i,s){var r=this._;if("string"==typeof t&&(t=a[t]),t>=0&&r.biquads.length>t){if(t|=0,"number"==typeof e&&"number"==typeof i){"number"!=typeof s&&(s=0);var o=r.biquads[t];if(!o)switch(o=r.biquads[t]=new n(r.samplerate),t){case 0:o.setType("highpass");break;case r.biquads.length-1:o.setType("lowpass");break;default:o.setType("peaking")}o.setParams(e,i,s)}else r.biquads[t]=void 0;r.plotFlush=!0}return this},h.getParams=function(t){var e=this._,i=e.biquads[0|t];return i?{freq:i.frequency,Q:i.Q,gain:i.gain}:void 0},h.process=function(t){var e=this._;if(this.tickID!==t){if(this.tickID=t,i.inputSignalAR(this),!e.bypassed)for(var s=this.cells[1],n=this.cells[2],r=e.biquads,a=0,o=r.length;o>a;++a)r[a]&&r[a].process(s,n);i.outputSignalAR(this)}return this};var u=new s(2048),l=t.Object.prototype.plot;h.plot=function(t){if(this._.plotFlush){var e=this._,i=new Float32Array(u.length);i[0]=1;for(var s=0,a=e.biquads.length;a>s;++s){var o=this.getParams(s);if(o){var h=new n(e.samplerate);0===s?h.setType("highpass"):s===a-1?h.setType("lowpass"):h.setType("peaking"),h.setParams(o.freq,o.Q,o.gain),h.process(i,i)}}u.forward(i);var c,f,p,d,m,v,g,b=512,_=new Float32Array(b),y=.5*e.samplerate,w=new Float32Array(b);for(u.getFrequencyData(w),s=0;b>s;++s)f=Math.pow(y/r,s/b)*r,c=f/(y/w.length),p=0|c,d=c-p,0===p?v=m=g=w[p]:(m=w[p-1],v=w[p],g=(1-d)*m+d*v),_[s]=g;this._.plotData=_,this._.plotFlush=null}return l.call(this,t)},i.register("eq",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.listener(this),i.fixAR(this),this.real=new t.ChannelObject(this),this.imag=new t.ChannelObject(this),this.cells[3]=this.real.cell,this.cells[4]=this.imag.cell;var n=this._;n.fft=new s(2*n.cellsize),n.fftCell=new i.SignalArray(n.fft.length),n.prevCell=new i.SignalArray(n.cellsize),n.freqs=new i.SignalArray(n.fft.length>>1),n.plotFlush=!0,n.plotRange=[0,32],n.plotBarStyle=!0}var i=t.fn,s=t.modules.FFT;i.extend(e);var n=e.prototype;Object.defineProperties(n,{window:{set:function(t){this._.fft.setWindow(t)},get:function(){return this._.fft.windowName}},spectrum:{get:function(){return this._.fft.getFrequencyData(this._.freqs)}}}),n.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t,i.inputSignalAR(this),i.outputSignalAR(this);var s=this.cells[0],n=e.cellsize;e.fftCell.set(e.prevCell),e.fftCell.set(s,n),e.fft.forward(e.fftCell),e.prevCell.set(s),e.plotFlush=!0,this.cells[3].set(e.fft.real.subarray(0,n)),this.cells[4].set(e.fft.imag.subarray(0,n))}return this};var r=t.Object.prototype.plot;n.plot=function(t){return this._.plotFlush&&(this._.plotData=this.spectrum,this._.plotFlush=null),r.call(this,t)},i.register("fft",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),i.fixAR(this);var s=this._;s.freq=t(440),s.reg=32768,s.shortFlag=!1,s.phase=0,s.lastValue=0}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{shortFlag:{set:function(t){this._.shortFlag=!!t},get:function(){return this._.shortFlag}},freq:{set:function(e){this._.freq=t(e)},get:function(){return this._.freq}}}),s.process=function(t){var e=this._,i=this.cells[0];if(this.tickID!==t){this.tickID=t;var s,n,r=e.lastValue,a=e.phase,o=e.freq.process(t).cells[0][0]/e.samplerate,h=e.reg,u=e.mul,l=e.add;if(e.shortFlag)for(s=0,n=i.length;n>s;++s)a>=1&&(h>>=1,h|=(1&(h^h>>6))<<15,r=(1&h)-.5,a-=1),i[s]=r*u+l,a+=o;else for(s=0,n=i.length;n>s;++s)a>=1&&(h>>=1,h|=(1&(h^h>>1))<<15,r=(1&h)-.5,a-=1),i[s]=r*u+l,a+=o;e.reg=h,e.phase=a,e.lastValue=r}return this},i.register("fnoise",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this),this._.selected=0,this._.outputs=[]}var i=t.fn,s=function(){function e(e){t.Object.call(this,2,[]),i.fixAR(this),this._.parent=e}return i.extend(e),e.prototype.process=function(t){return this.tickID!==t&&(this.tickID=t,this._.parent.process(t)),this},e}();i.extend(e);var n=e.prototype;Object.defineProperties(n,{selected:{set:function(t){var e=this._;if("number"==typeof t){e.selected=t;for(var s=e.outputs,n=0,r=s.length;r>n;++n)s[n]&&(s[n].cells[0].set(i.emptycell),s[n].cells[1].set(i.emptycell),s[n].cells[2].set(i.emptycell))}},get:function(){return this._.selected}}}),n.at=function(t){var e=this._,i=e.outputs[t];return i||(e.outputs[t]=i=new s(this)),i},n.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t,i.inputSignalAR(this),i.outputSignalAR(this);var s=e.outputs[e.selected];s&&(s.cells[0].set(this.cells[0]),s.cells[1].set(this.cells[1]),s.cells[2].set(this.cells[2]))}return this},i.register("gate",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),i.fixAR(this);var n=this._;n.fft=new s(2*n.cellsize),n.fftCell=new i.SignalArray(this._.fft.length),n.realBuffer=new i.SignalArray(this._.fft.length),n.imagBuffer=new i.SignalArray(this._.fft.length)
}var i=t.fn,s=t.modules.FFT;i.extend(e);var n=e.prototype;Object.defineProperties(n,{real:{set:function(e){this._.real=t(e)},get:function(){return this._.real}},imag:{set:function(e){this._.imag=t(e)},get:function(){return this._.imag}}}),n.process=function(t){var e=this._;if(this.tickID!==t&&(this.tickID=t,e.real&&e.imag)){var s=this.cells[0],n=e.realBuffer,r=e.imagBuffer,a=e.real.process(t).cells[0],o=e.imag.process(t).cells[0];n.set(a),r.set(o),s.set(e.fft.inverse(n,r).subarray(0,e.cellsize)),i.outputSignalAR(this)}return this},i.register("ifft",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),i.timer(this),i.fixKR(this);var s=this._;s.interval=t(1e3),s.count=0,s.delay=0,s.timeout=1/0,s.currentTime=0,s.delaySamples=0,s.countSamples=0,s.onended=i.make_onended(this),this.on("start",n)}var i=t.fn,s=t.timevalue;i.extend(e);var n=function(){var t=this._;this.playbackState=i.PLAYING_STATE,t.delaySamples=0|t.samplerate*.001*t.delay,t.countSamples=t.count=t.currentTime=0};Object.defineProperty(n,"unremovable",{value:!0,writable:!1});var r=e.prototype;Object.defineProperties(r,{interval:{set:function(e){"string"==typeof e&&(e=s(e),0>=e&&(e=0)),this._.interval=t(e)},get:function(){return this._.interval}},delay:{set:function(t){"string"==typeof t&&(t=s(t)),"number"==typeof t&&t>=0&&(this._.delay=t,this._.delaySamples=0|this._.samplerate*.001*t)},get:function(){return this._.delay}},count:{set:function(t){"number"==typeof t&&(this._.count=t)},get:function(){return this._.count}},timeout:{set:function(t){"string"==typeof t&&(t=s(t)),"number"==typeof t&&t>=0&&(this._.timeout=t)},get:function(){return this._.timeout}},currentTime:{get:function(){return this._.currentTime}}}),r.bang=function(){var t=this._;return this.playbackState=i.PLAYING_STATE,t.delaySamples=0|t.samplerate*.001*t.delay,t.countSamples=t.count=t.currentTime=0,t.emit("bang"),this},r.process=function(t){var e=this.cells[0],s=this._;if(this.tickID!==t){this.tickID=t,s.delaySamples>0&&(s.delaySamples-=e.length);var n=s.interval.process(t).cells[0][0];if(0>=s.delaySamples&&(s.countSamples-=e.length,0>=s.countSamples)){s.countSamples+=0|.001*s.samplerate*n;for(var r=this.nodes,a=s.count,o=a*s.mul+s.add,h=0,u=e.length;u>h;++h)e[h]=o;for(var l=0,c=r.length;c>l;++l)r[l].bang(a);s.count+=1}s.currentTime+=i.currentTimeIncr,s.currentTime>=s.timeout&&i.nextTick(s.onended)}return this},i.register("interval",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),i.fixAR(this);var s=this._,n=Math.ceil(Math.log(s.samplerate)*Math.LOG2E);s.buffersize=1<<n,s.buffermask=s.buffersize-1,s.buffer=new i.SignalArray(s.buffersize),s.time=0,s.readIndex=0,s.writeIndex=0}var i=t.fn,s=t.timevalue;i.extend(e);var n=e.prototype;Object.defineProperties(n,{time:{set:function(t){if("string"==typeof t&&(t=s(t)),"number"==typeof t&&t>0){var e=this._;e.time=t;var i=0|.001*t*e.samplerate;i>e.buffermask&&(i=e.buffermask),e.writeIndex=e.readIndex+i&e.buffermask}},get:function(){return this._.time}}}),n.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t,i.inputSignalAR(this);var s,n=this.cells[0],r=e.buffer,a=e.buffermask,o=e.readIndex,h=e.writeIndex,u=n.length;for(s=0;u>s;++s)r[h]=n[s],n[s]=r[o],o+=1,h=h+1&a;e.readIndex=o&a,e.writeIndex=h,i.outputSignalAR(this)}return this},i.register("lag",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e);var i=this._;i.input=0,i.value=0,i.prev=null,i.ar=!1,i.map=s}var i=t.fn;i.extend(e);var s=function(t){return t},n=e.prototype;Object.defineProperties(n,{input:{set:function(t){"number"==typeof t&&(this._.input=t)},get:function(){return this._.input}},map:{set:function(t){"function"==typeof t&&(this._.map=t)},get:function(){return this._.map}}}),n.bang=function(){return this._.prev=null,this._.emit("bang"),this},n.at=function(t){return this._.map?this._.map(t):0},n.process=function(t){var e=this.cells[0],s=this._;if(this.tickID!==t){this.tickID=t;var n,r=this.nodes.length,a=e.length;if(s.ar&&r){i.inputSignalAR(this);var o=s.map;if(o)for(n=0;a>n;++n)e[n]=o(e[n]);s.value=e[a-1],i.outputSignalAR(this)}else{var h=r?i.inputSignalKR(this):s.input;s.map&&s.prev!==h&&(s.prev=h,s.value=s.map(h));var u=s.value*s.mul+s.add;for(n=0;a>n;++n)e[n]=u}}return this},i.register("map",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e)}var i=t.fn;i.extend(e);var s=e.prototype;s.process=function(t){var e=this.cells[0],s=this._;if(this.tickID!==t){this.tickID=t;var n,r,a,o,h=this.nodes,u=h.length,l=e.length;if(s.ar){if(h.length>0)for(a=h[0].process(t).cells[0],e.set(a),n=1;u>n;++n)for(a=h[n].process(t).cells[0],r=0;l>r;++r)o=a[r],o>e[r]&&(e[r]=o);else for(r=0;l>r;++r)e[r]=0;i.outputSignalAR(this)}else{if(h.length>0)for(a=h[0].process(t).cells[0][0],n=1;u>n;++n)o=h[n].process(t).cells[0][0],o>a&&(a=o);else a=0;e[0]=a,i.outputSignalKR(this)}}return this},i.register("max",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var n=this._;n.src=n.func=null,n.bufferL=new i.SignalArray(s),n.bufferR=new i.SignalArray(s),n.readIndex=0,n.writeIndex=0,n.totalRead=0,n.totalWrite=0}if("browser"===t.envtype){var i=t.fn,s=4096,n=s-1;i.extend(e);var r=e.prototype;r.listen=function(e){var i=a[t.env];i&&(i.set.call(this,e),i.listen.call(this))},r.unlisten=function(){var e=a[t.env];e&&e.unlisten.call(this),this.cells[0].set(i.emptycell),this.cells[1].set(i.emptycell),this.cells[2].set(i.emptycell);for(var s=this._,n=s.bufferL,r=s.bufferR,o=0,h=n.length;h>o;++o)n[o]=r[o]=0},r.process=function(t){var e=this._;if(null===e.src)return this;if(this.tickID!==t){this.tickID=t;var s=e.cellsize;if(e.totalWrite>e.totalRead+s){var r=e.readIndex,a=r+s;this.cells[1].set(e.bufferL.subarray(r,a)),this.cells[2].set(e.bufferR.subarray(r,a)),e.readIndex=a&n,e.totalRead+=s}i.outputSignalAR(this)}return this};var a={};a.webkit={set:function(t){var e=this._;if(t instanceof HTMLMediaElement){var s=i._audioContext;e.src=s.createMediaElementSource(t)}},listen:function(){var t=this._,e=i._audioContext;t.gain=e.createGainNode(),t.gain.gain.value=0,t.node=e.createJavaScriptNode(1024,2,2),t.node.onaudioprocess=o(this),t.src.connect(t.node),t.node.connect(t.gain),t.gain.connect(e.destination)},unlisten:function(){var t=this._;t.src&&t.src.disconnect(),t.gain&&t.gain.disconnect(),t.node&&t.node.disconnect()}};var o=function(t){return function(e){var i=t._,s=e.inputBuffer,r=s.length,a=i.writeIndex;i.bufferL.set(s.getChannelData(0),a),i.bufferR.set(s.getChannelData(1),a),i.writeIndex=a+r&n,i.totalWrite+=r}};a.moz={set:function(t){var e=this._;t instanceof HTMLAudioElement&&(e.src=t,e.istep=e.samplerate/t.mozSampleRate)},listen:function(){var t=this._,e=t.bufferL,i=t.bufferR,s=0,r=0;2===t.src.mozChannels?(t.x=0,t.func=function(a){var o,h,u=t.writeIndex,l=t.totalWrite,c=a.frameBuffer,f=t.istep,p=c.length;for(o=t.x,h=0;p>h;h+=2){for(o+=f;o>0;)e[u]=.5*(c[h]+s),i[u]=.5*(c[h+1]+r),u=u+1&n,++l,o-=1;s=c[h],r=c[h+1]}t.x=o,t.writeIndex=u,t.totalWrite=l}):(t.x=0,t.func=function(r){var a,o,h=t.writeIndex,u=t.totalWrite,l=r.frameBuffer,c=t.istep,f=l.length;for(a=t.x,o=0;f>o;++o){for(a+=c;a>=0;)e[h]=i[h]=.5*(l[o]+s),h=h+1&n,++u,a-=1;s=l[o]}t.x=a,t.writeIndex=h,t.totalWrite=u}),t.src.addEventListener("MozAudioAvailable",t.func)},unlisten:function(){var t=this._;t.func&&(t.src.removeEventListener("MozAudioAvailable",t.func),t.func=null)}},i.register("mediastream",e)}}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e);var i=this._;i.midi=0,i.value=0,i.prev=null,i.a4=440,i.ar=!1}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{midi:{set:function(t){"number"==typeof t&&(this._.midi=t)},get:function(){return this._.midi}},a4:{set:function(t){"number"==typeof t&&(this._.a4=t,this._.prev=null)},get:function(){return this._.a4}}}),s.bang=function(){return this._.prev=null,this._.emit("bang"),this},s.at=function(t){var e=this._;return e.a4*Math.pow(2,(t-69)/12)},s.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s,n=this.cells[0],r=this.nodes.length,a=n.length;if(e.ar&&r){i.inputSignalAR(this);var o=e.a4;for(s=0;a>s;++s)n[s]=o*Math.pow(2,(n[s]-69)/12);e.value=n[a-1],i.outputSignalAR(this)}else{var h=r?i.inputSignalKR(this):e.midi;e.prev!==h&&(e.prev=h,e.value=e.a4*Math.pow(2,(h-69)/12)),n[0]=e.value,i.outputSignalKR(this)}}return this},i.register("midicps",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e);var i=this._;i.midi=0,i.value=0,i.prev=null,i.range=12,i.ar=!1}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{midi:{set:function(t){"number"==typeof t&&(this._.midi=t)},get:function(){return this._.midi}},range:{set:function(t){"number"==typeof t&&t>0&&(this._.range=t)},get:function(){return this._.range}}}),s.bang=function(){return this._.prev=null,this._.emit("bang"),this},s.at=function(t){var e=this._;return Math.pow(2,t/e.range)},s.process=function(t){var e=this.cells[0],s=this._;if(this.tickID!==t){this.tickID=t;var n,r=this.nodes.length,a=e.length;if(s.ar&&r){i.inputSignalAR(this);var o=s.range;for(n=0;a>n;++n)e[n]=Math.pow(2,e[n]/o);s.value=e[a-1],i.outputSignalAR(this)}else{var h=this.nodes.length?i.inputSignalKR(this):s.midi;s.prev!==h&&(s.prev=h,s.value=Math.pow(2,h/s.range));var u=s.value*s.mul+s.add;for(n=0;a>n;++n)e[n]=u}}return this},i.register("midiratio",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e)}var i=t.fn;i.extend(e);var s=e.prototype;s.process=function(t){var e=this.cells[0],s=this._;if(this.tickID!==t){this.tickID=t;var n,r,a,o,h=this.nodes,u=h.length,l=e.length;if(s.ar){if(h.length>0)for(a=h[0].process(t).cells[0],e.set(a),n=1;u>n;++n)for(a=h[n].process(t).cells[0],r=0;l>r;++r)o=a[r],e[r]>o&&(e[r]=o);else for(r=0;l>r;++r)e[r]=0;i.outputSignalAR(this)}else{if(h.length>0)for(a=h[0].process(t).cells[0][0],n=1;u>n;++n)o=h[n].process(t).cells[0][0],a>o&&(a=o);else a=0;e[0]=a,i.outputSignalKR(this)}}return this},i.register("min",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,0,e),i.timer(this),i.fixKR(this);var n=this._;n.tracks=[],n.onended=i.make_onended(this),n.currentTime=0,this.on("start",s)}var i=t.fn;i.extend(e);var s=function(){var t=this,e=this._,s=e.mml;"string"==typeof s&&(s=[s]),e.tracks=s.map(function(e,i){return new r(t,i,e)}),e.currentTime=0,this.playbackState=i.PLAYING_STATE};Object.defineProperty(s,"unremoved",{value:!0,writable:!1});var n=e.prototype;Object.defineProperties(n,{mml:{set:function(t){var e=this._;("string"==typeof t||Array.isArray(t))&&(e.mml=t)},get:function(){return this._.mml}},currentTime:{get:function(){return this._.currentTime}}}),n.on=n.addListener=function(t,e){return"mml"===t&&(t="data",console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener.")),this._.events.on(t,e),this},n.once=function(t,e){return"mml"===t&&(t="data",console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener.")),this._.events.once(t,e),this},n.off=n.removeListener=function(t,e){return"mml"===t&&(t="data",console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener.")),this._.events.off(t,e),this},n.removeAllListeners=function(t){return"mml"===t&&(console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener."),t="data"),this._.events.removeAllListeners(t),this},n.listeners=function(t){return"mml"===t&&(console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener."),t="data"),this._.events.listeners(t)},n.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s,n,r=e.tracks;for(s=0,n=r.length;n>s;++s)r[s].process();for(;s--;)r[s].ended&&r.splice(s,1);0===r.length&&i.nextTick(e.onended),e.currentTime+=i.currentTimeIncr}return this},i.register("mml",e);var r=function(){function t(t,e,i){var s=this._={};s.sequencer=t,s.trackNum=e,s.commands=l(i),s.status={t:120,l:4,o:4,v:12,q:6,dot:0,tie:!1},s.index=0,s.queue=[],s.currentTime=0,s.queueTime=0,s.segnoIndex=-1,s.loopStack=[],s.prevNote=0,s.remain=1/0,this.ended=!1,u(this)}var e=0,s=1,n=2,r=3;t.prototype.process=function(){var t=this._,l=t.sequencer,c=t.trackNum,f=t.queue,p=!1;if(f.length)for(;f[0][0]<=t.currentTime;){var d=t.queue.shift();switch(d[1]){case s:a(l,c,d[2],d[3]),t.remain=d[4],u(this);break;case n:o(l,c,d[2],d[3]);break;case r:h(l,d[2]);break;case e:p=!0}if(0===f.length)break}t.remain-=i.currentTimeIncr,p&&(this.ended=!0),t.currentTime+=i.currentTimeIncr};var a=function(t,e,i,s){var n,r,a,o=t.nodes;for(r=0,a=o.length;a>r;++r)n=o[r],n.noteOn?n.noteOn(i,s):n.bang();t._.emit("data","noteOn",{trackNum:e,noteNum:i,velocity:s})},o=function(t,e,i,s){var n,r,a,o=t.nodes;for(r=0,a=o.length;a>r;++r)n=o[r],n.noteOff?n.noteOff(i,s):n.release&&n.release();t._.emit("data","noteOff",{trackNum:e,noteNum:i,velocity:s})},h=function(t,e){t._.emit("data","command",{command:e})},u=function(t){var i=t._;i.sequencer;var a,o,h,u,l,c,f,p,d,m,v,g,b,_=i.commands,y=i.queue,w=i.index,x=i.status,k=i.queueTime,A=i.loopStack;d=[];t:for(;;){if(w>=_.length){if(!(i.segnoIndex>=0))break;w=i.segnoIndex}switch(a=_[w++],a.name){case"@":y.push([k,r,a.val]);break;case"n":if(o=x.t||120,null!==a.len?(u=a.len,l=a.dot||0):(u=x.l,l=a.dot||x.dot),f=1e3*60/o*(4/u),f*=[1,1.5,1.75,1.875][l]||1,c=x.v<<3,x.tie){for(g=y.length;g--;)if(y[g][2]){y.splice(g,1);break}h=i.prevNote}else h=i.prevNote=a.val+12*(x.o+1),y.push([k,s,h,c,f]);if(u>0){if(p=x.q/8,1>p)for(m=k+f*p,y.push([m,n,h,c]),g=0,b=d.length;b>g;++g)y.push([m,n,d[g],c]);if(d=[],k+=f,!x.tie)break t}else d.push(h);x.tie=!1;break;case"r":o=x.t||120,null!==a.len?(u=a.len,l=a.dot||0):(u=x.l,l=a.dot||x.dot),u>0&&(f=1e3*60/o*(4/u),f*=[1,1.5,1.75,1.875][l]||1,k+=f);break;case"l":x.l=a.val,x.dot=a.dot;break;case"o":x.o=a.val;break;case"<":9>x.o&&(x.o+=1);break;case">":x.o>0&&(x.o-=1);break;case"v":x.v=a.val;break;case"(":15>x.v&&(x.v+=1);break;case")":x.v>0&&(x.v-=1);break;case"q":x.q=a.val;break;case"&":x.tie=!0;break;case"$":i.segnoIndex=w;break;case"[":A.push([w,null,null]);break;case"|":v=A[A.length-1],v&&1===v[1]&&(A.pop(),w=v[2]);break;case"]":v=A[A.length-1],v&&(null===v[1]&&(v[1]=a.count,v[2]=w),v[1]-=1,0===v[1]?A.pop():w=v[0]);break;case"t":x.t=null===a.val?120:a.val;break;case"EOF":y.push([k,e])}}i.index=w,i.queueTime=k},l=function(t){var e,i,s,n,r,a,o,h,u=Array(t.length),l=[];for(r=0,a=c.length;a>r;++r)for(e=c[r],i=e.re;s=i.exec(t);){if(!u[s.index]){for(o=0,h=s[0].length;h>o;++o)u[s.index+o]=!0;n=e.func?e.func(s):{name:s[0]},n&&(n.index=s.index,n.origin=s[0],l.push(n))}for(;i.lastIndex<t.length&&u[i.lastIndex];)++i.lastIndex}return l.sort(function(t,e){return t.index-e.index}),l.push({name:"EOF"}),l},c=[{re:/@(\d*)/g,func:function(t){return{name:"@",val:t[1]||null}}},{re:/([cdefgab])([\-+]?)(\d*)(\.*)/g,func:function(t){return{name:"n",val:{c:0,d:2,e:4,f:5,g:7,a:9,b:11}[t[1]]+({"-":-1,"+":1}[t[2]]||0),len:""===t[3]?null:Math.min(0|t[3],64),dot:t[4].length}}},{re:/r(\d*)(\.*)/g,func:function(t){return{name:"r",len:""===t[1]?null:Math.max(1,Math.min(0|t[1],64)),dot:t[2].length}}},{re:/&/g},{re:/l(\d*)(\.*)/g,func:function(t){return{name:"l",val:""===t[1]?4:Math.min(0|t[1],64),dot:t[2].length}}},{re:/o([0-9])/g,func:function(t){return{name:"o",val:""===t[1]?4:0|t[1]}}},{re:/[<>]/g},{re:/v(\d*)/g,func:function(t){return{name:"v",val:""===t[1]?12:Math.min(0|t[1],15)}}},{re:/[()]/g},{re:/q([0-8])/g,func:function(t){return{name:"q",val:""===t[1]?6:Math.min(0|t[1],8)}}},{re:/\[/g},{re:/\|/g},{re:/\](\d*)/g,func:function(t){return{name:"]",count:0|t[1]||2}}},{re:/t(\d*)/g,func:function(t){return{name:"t",val:""===t[1]?null:Math.max(5,Math.min(0|t[1],300))}}},{re:/\$/g}];return t}()}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e)}var i=t.fn;i.extend(e),e.prototype.process=function(t){var e=this._;return this.tickID!==t&&(this.tickID=t,e.ar?(i.inputSignalAR(this),i.outputSignalAR(this)):(this.cells[0][0]=i.inputSignalKR(this),i.outputSignalKR(this))),this},i.register("mono",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e)}var i=t.fn;i.extend(e);var s=e.prototype;s.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s,n,r,a,o,h=this.nodes,u=this.cells[0],l=this.cells[1],c=this.cells[2],f=h.length,p=u.length;if(e.ar){if(h.length>0)for(h[0].process(t),a=h[0].cells[1],o=h[0].cells[2],l.set(a),c.set(o),s=1;f>s;++s)for(h[s].process(t),a=h[s].cells[1],o=h[s].cells[2],n=0;p>n;++n)l[n]*=a[n],c[n]*=o[n];else for(n=0;p>n;++n)l[n]=c[n]=0;i.outputSignalAR(this)}else{if(h.length>0)for(r=h[0].process(t).cells[0][0],s=1;f>s;++s)r*=h[s].process(t).cells[0][0];else r=0;u[0]=r,i.outputSignalKR(this)}}return this},i.register("*",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e);var i=this._;i.defaultValue=0,i.index=0,i.dict={},i.ar=!1}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{dict:{set:function(t){if("object"==typeof t)this._.dict=t;else if("function"==typeof t){for(var e={},i=0;128>i;++i)e[i]=t(i);this._.dict=e}},get:function(){return this._.dict}},defaultValue:{set:function(t){"number"==typeof t&&(this._.defaultValue=t)},get:function(){return this._.defaultValue}},index:{set:function(t){"number"==typeof t&&(this._.index=t)},get:function(){return this._.index}}}),s.at=function(t){var e=this._;return(e.dict[0|t]||e.defaultValue)*e.mul+e.add},s.clear=function(){return this._.dict={},this},s.process=function(t){var e=this.cells[0],s=this._;if(this.tickID!==t){this.tickID=t;var n,r,a,o=this.nodes.length,h=s.dict,u=s.defaultValue,l=s.mul,c=s.add,f=e.length;if(s.ar&&o){for(i.inputSignalAR(this),a=0;f>a;++a)n=e[a],n=0>n?0|n-.5:0|n+.5,e[a]=(h[n]||u)*l+c;i.outputSignalAR(this)}else for(n=this.nodes.length?i.inputSignalKR(this):s.index,n=0>n?0|n-.5:0|n+.5,r=(h[n]||u)*l+c,a=0;f>a;++a)e[a]=r}return this},i.register("ndict",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e)}var i=t.fn;i.extend(e);var s=e.prototype;s.process=function(t){var e=this.cells[0],i=this._;if(this.tickID!==t){this.tickID=t;var s,n,r,a=i.mul,o=i.add;if(i.ar)for(s=0,n=e.length;n>s;++s)e[s]=(2*Math.random()-1)*a+o;else for(r=(2*Math.random()+1)*a+o,s=0,n=e.length;n>s;++s)e[s]=r}return this},i.register("noise",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e);var s=this._;s.freq=t(440),s.phase=t(0),s.osc=new n(s.samplerate),s.tmp=new i.SignalArray(s.cellsize),s.osc.step=s.cellsize,this.once("init",r)}var i=t.fn,s=t.timevalue,n=t.modules.Oscillator;i.extend(e);var r=function(){var t=this._;this.wave||(this.wave="sin"),t.plotData=t.osc.wave,t.plotLineWidth=2,t.plotCyclic=!0,t.plotBefore=o},a=e.prototype;Object.defineProperties(a,{wave:{set:function(t){this._.osc.setWave(t)},get:function(){return this._.osc.wave}},freq:{set:function(e){"string"==typeof e&&(e=s(e),e=0>=e?0:1e3/e),this._.freq=t(e)},get:function(){return this._.freq}},phase:{set:function(e){this._.phase=t(e),this._.osc.feedback=!1},get:function(){return this._.phase}},fb:{set:function(e){this._.phase=t(e),this._.osc.feedback=!0},get:function(){return this._.phase}}}),a.clone=function(){var t=i.clone(this);return t._.osc=this._.osc.clone(),t._.freq=this._.freq,t._.phase=this._.phase,t},a.bang=function(){return this._.osc.reset(),this._.emit("bang"),this},a.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s,n=this.cells[1],r=this.cells[2],a=e.cellsize;if(this.nodes.length)i.inputSignalAR(this);else for(s=0;a>s;++s)n[s]=r[s]=1;var o=e.osc,h=e.freq.process(t).cells[0],u=e.phase.process(t).cells[0];if(o.frequency=h[0],o.phase=u[0],e.ar){var l=e.tmp;for(e.freq.isAr?e.phase.isAr?o.processWithFreqAndPhaseArray(l,h,u):o.processWithFreqArray(l,h):e.phase.isAr?o.processWithPhaseArray(l,u):o.process(l),s=0;a>s;++s)n[s]*=l[s],r[s]*=l[s]}else{var c=o.next();for(s=0;a>s;++s)n[s]*=c,r[s]*=c}i.outputSignalAR(this)}return this};var o;"browser"===t.envtype&&(o=function(t,e,i,s,n){var r=(n>>1)+.5;t.strokeStyle="#ccc",t.lineWidth=1,t.beginPath(),t.moveTo(e,r+i),t.lineTo(e+s,r+i),t.stroke()}),i.register("osc",e),i.register("sin",function(t){return new e(t).set("wave","sin")}),i.register("cos",function(t){return new e(t).set("wave","cos")}),i.register("pulse",function(t){return new e(t).set("wave","pulse")}),i.register("tri",function(t){return new e(t).set("wave","tri")}),i.register("saw",function(t){return new e(t).set("wave","saw")}),i.register("fami",function(t){return new e(t).set("wave","fami")}),i.register("konami",function(t){return new e(t).set("wave","konami")}),i.register("+sin",function(t){return new e(t).set("wave","+sin").kr()}),i.register("+pulse",function(t){return new e(t).set("wave","+pulse").kr()}),i.register("+tri",function(t){return new e(t).set("wave","+tri").kr()}),i.register("+saw",function(t){return new e(t).set("wave","+saw").kr()}),i.alias("square","pulse")}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var s=this._;s.pos=t(0),s.panL=.5,s.panR=.5}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{pos:{set:function(e){this._.pos=t(e)},get:function(){return this._.pos}}}),s.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s=e.pos.process(t).cells[0][0];e.prevPos!==s&&(e.panL=1-s,e.panR=e.prevPos=s);var n,r,a,o=this.nodes,h=this.cells[1],u=this.cells[2],l=o.length,c=h.length;if(l){for(a=o[0].process(t).cells[0],r=0;c>r;++r)h[r]=u[r]=a[r];for(n=1;l>n;++n)for(a=o[n].process(t).cells[0],r=0;c>r;++r)h[r]=u[r]+=a[r];var f=e.panL,p=e.panR;for(r=0;c>r;++r)h[r]=h[r]*f,u[r]=u[r]*p}else h.set(i.emptycell),u.set(i.emptycell);i.outputSignalAR(this)}return this},i.register("pan",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e);var i=this._;i.value=0,i.env=new r(i.samplerate),i.env.step=i.cellsize,i.curve="lin",i.counter=0,i.ar=!1,i.onended=a(this),this.on("ar",o)}var i=t.fn,s=t.timevalue,n=t.modules.Envelope,r=t.modules.EnvelopeValue;i.extend(e);var a=function(t,e){return function(){if("number"==typeof e)for(var i=t.cells[0],s=t.cells[1],n=t.cells[2],r=t._.env.value,a=0,o=s.length;o>a;++a)i[0]=s[a]=n[a]=r;t._.emit("ended")}},o=function(t){this._.env.step=t?1:this._.cellsize},h=e.prototype;Object.defineProperties(h,{value:{set:function(t){"number"==typeof t&&(this._.env.value=t)},get:function(){return this._.env.value}}}),h.to=function(t,e,i){var r=this._,a=r.env;if("string"==typeof e?e=s(e):e===void 0&&(e=0),i===void 0)r.counter=a.setNext(t,e,n.CurveTypeLin),r.curve="lin";else{var o=n.CurveTypeDict[i];r.counter=o===void 0?a.setNext(t,e,n.CurveTypeCurve,i):a.setNext(t,e,o),r.curve=i}return r.plotFlush=!0,this},h.setAt=function(t,e){var i=this._;return this.to(i.env.value,e,"set"),i.atValue=t,this},h.linTo=function(t,e){return this.to(t,e,"lin")},h.expTo=function(t,e){return this.to(t,e,"exp")},h.sinTo=function(t,e){return this.to(t,e,"sin")},h.welTo=function(t,e){return this.to(t,e,"wel")},h.sqrTo=function(t,e){return this.to(t,e,"sqr")},h.cubTo=function(t,e){return this.to(t,e,"cub")},h.cancel=function(){var t=this._;return t.counter=t.env.setNext(t.env.value,0,n.CurveTypeSet),this},h.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s,r,a=this.cells[1],o=this.cells[2],h=e.cellsize,u=e.env,l=e.counter;if(this.nodes.length)i.inputSignalAR(this);else for(s=0;h>s;++s)a[s]=o[s]=1;if(0>=l&&("set"===e.curve?u.setNext(e.atValue,0,n.CurveTypeSet):u.setNext(u.value,0,n.CurveTypeSet),i.nextTick(e.onended),e.counter=1/0),e.ar){for(s=0;h>s;++s)r=u.next(),a[s]*=r,o[s]*=r;e.counter-=e.cellsize}else{for(r=u.next(),s=0;h>s;++s)a[s]*=r,o[s]*=r;e.counter-=1}i.outputSignalAR(this),e.value=r}return this};var u=t.Object.prototype.plot;h.plot=function(t){var e=this._;if(e.plotFlush){var i,s,a,o=new r(128),h=new Float32Array(128);if("set"===e.curve)for(s=100,a=h.length;a>s;++s)h[s]=1;else for(i=n.CurveTypeDict[e.curve],i===void 0?o.setNext(1,1e3,n.CurveTypeCurve,e.curve):o.setNext(1,1e3,i),s=0,a=h.length;a>s;++s)h[s]=o.next();e.plotData=h,e.plotRange=[0,1],e.plotFlush=null}return u.call(this,t)},i.register("param",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var s=this._;s.freq=t("sin",{freq:1,add:1e3,mul:250}).kr(),s.Q=t(1),s.allpass=[],this.steps=2}var i=t.fn,s=t.modules.Biquad;i.extend(e);var n=e.prototype;Object.defineProperties(n,{freq:{set:function(t){this._.freq=t},get:function(){return this._.freq}},Q:{set:function(e){this._.Q=t(e)},get:function(){return this._.Q}},steps:{set:function(t){if("number"==typeof t){if(t|=0,2===t||4===t||8===t||12===t){var e=this._.allpass;if(t>e.length)for(var i=e.length;t>i;++i)e[i]=new s(this._.samplerate),e[i].setType("allpass")}this._.steps=t}},get:function(){return this._.steps}}}),n.process=function(t){var e=this._;if(this.tickID!==t){if(this.tickID=t,i.inputSignalAR(this),!e.bypassed){var s,n=this.cells[1],r=this.cells[2],a=e.freq.process(t).cells[0][0],o=e.Q.process(t).cells[0][0],h=e.steps;for(s=0;h>s;s+=2)e.allpass[s].setParams(a,o,0),e.allpass[s].process(n,r),e.allpass[s+1].setParams(a,o,0),e.allpass[s+1].process(n,r)}i.outputSignalAR(this)}return this},i.register("phaser",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),s.fixAR(this);for(var i=new Uint8Array(5),n=0;5>n;++n)i[n]=(0|Math.random()*(1<<30))%25;this._.whites=i,this._.key=0}var i=31,s=t.fn;s.extend(e);var n=e.prototype;n.process=function(t){var e=this.cells[0],s=this._;if(this.tickID!==t){this.tickID=t;var n,r,a,o,h,u,l=s.key,c=s.whites,f=s.mul,p=s.add;for(n=0,r=e.length;r>n;++n){for(o=l++,l>i&&(l=0),u=o^l,a=h=0;5>a;++a)u&1<<a&&(c[a]=(0|Math.random()*(1<<30))%25),h+=c[a];e[n]=(.01666666*h-1)*f+p}s.key=l}return this},s.register("pink",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),this._.freq=440,this._.buffer=null,this._.index=0}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{freq:{set:function(t){"number"==typeof t&&(0>t&&(t=0),this._.freq=t)},get:function(){return this._.freq}}}),s.bang=function(){for(var t=this._,e=t.freq,s=0|t.samplerate/e+.5,n=t.buffer=new i.SignalArray(s),r=0;s>r;++r)n[r]=2*Math.random()-1;return t.index=0,t.emit("bang"),this},s.process=function(t){var e=this.cells[0],i=this._;if(this.tickID!==t){this.tickID=t;var s=i.buffer;if(s){var n,r,a,o=s.length,h=i.index,u=i.mul,l=i.add,c=e.length;for(a=0;c>a;++a)n=h,r=s[h++],h>=o&&(h=0),r=.5*(r+s[h]),s[n]=r,e[a]=r*u+l;i.index=h}}return this},i.register("pluck",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),i.listener(this),i.fixAR(this);var s=this._;s.timeout=5e3,s.status=n,s.writeIndex=0,s.writeIndexIncr=1,s.currentTime=0,s.currentTimeIncr=1e3/s.samplerate,s.onended=a(this)}var i=t.fn,s=t.timevalue,n=0,r=1;i.extend(e);var a=function(t){return function(){var e=t._,s=new i.SignalArray(e.buffer.subarray(0,0|e.writeIndex));e.status=n,e.writeIndex=0,e.currentTime=0,e.emit("ended",{buffer:s,samplerate:e.samplerate})}},o=e.prototype;Object.defineProperties(o,{timeout:{set:function(t){"string"==typeof t&&(t=s(t)),"number"==typeof t&&t>0&&(this._.timeout=t)},get:function(){return this._.timeout}},samplerate:{set:function(t){"number"==typeof t&&t>0&&this._.samplerate>=t&&(this._.samplerate=t)},get:function(){return this._.samplerate}},currentTime:{get:function(){return this._.currentTime}}}),o.start=function(){var e,s=this._;return s.status===n&&(e=0|.01*s.timeout*s.samplerate,(!s.buffer||e>s.buffer.length)&&(s.buffer=new i.SignalArray(e)),s.writeIndex=0,s.writeIndexIncr=s.samplerate/t.samplerate,s.currentTime=0,s.status=r,s.emit("start"),this.listen()),this},o.stop=function(){var t=this._;return t.status===r&&(t.status=n,t.emit("stop"),i.nextTick(t.onended),this.unlisten()),this},o.bang=function(){return this._.status===n?this.srart():this._.status===r&&this.stop(),this._.emit("bang"),this},o.process=function(t){var e=this._,s=this.cells[0];if(this.tickID!==t){if(this.tickID=t,i.inputSignalAR(this),e.status===r){var n,a=s.length,o=e.buffer,h=e.timeout,u=e.writeIndex,l=e.writeIndexIncr,c=e.currentTime,f=e.currentTimeIncr;for(n=0;a>n;++n)o[0|u]=s[n],u+=l,c+=f,c>=h&&i.nextTick(e.onended);e.writeIndex=u,e.currentTime=c}i.outputSignalAR(this)}return this},i.register("record",e),i.alias("rec","record")}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this),this._.reverb=new s(this._.samplerate,this._.cellsize)}var i=t.fn,s=t.modules.Reverb;i.extend(e);var n=e.prototype;Object.defineProperties(n,{room:{set:function(t){"number"==typeof t&&(t=t>1?1:0>t?0:t,this._.reverb.setRoomSize(t))},get:function(){return this._.reverb.roomsize}},damp:{set:function(t){"number"==typeof t&&(t=t>1?1:0>t?0:t,this._.reverb.setDamp(t))},get:function(){return this._.reverb.damp}},mix:{set:function(t){"number"==typeof t&&(t=t>1?1:0>t?0:t,this._.reverb.wet=t)},get:function(){return this._.reverb.wet}}}),n.process=function(t){var e=this._;return this.tickID!==t&&(this.tickID=t,i.inputSignalAR(this),e.bypassed||e.reverb.process(this.cells[1],this.cells[2]),i.outputSignalAR(this)),this},i.register("reverb",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,0,e),i.timer(this),i.fixKR(this);var s=this._;s.queue=[],s.currentTime=0,s.maxRemain=1e3}var i=t.fn,s=t.timevalue;i.extend(e);var n=e.prototype;Object.defineProperties(n,{queue:{get:function(){return this._.queue}},remain:{get:function(){return this._.queue.length}},maxRemain:{set:function(t){"number"==typeof t&&t>0&&(this._.maxRemain=t)},get:function(){return this._.maxRemain}},isEmpty:{get:function(){return 0===this._.queue.length}},currentTime:{get:function(){return this._.currentTime}}}),n.sched=function(t,e,i){return"string"==typeof t&&(t=s(t)),"number"==typeof t&&this.schedAbs(this._.currentTime+t,e,i),this},n.schedAbs=function(e,i,n){if("string"==typeof e&&(e=s(e)),"number"==typeof e){var r=this._,a=r.queue;if(a.length>=r.maxRemain)return this;for(var o=a.length;o--&&!(e>a[o][0]););a.splice(o+1,0,[e,t(i),n])}return this},n.advance=function(t){return"string"==typeof t&&(t=s(t)),"number"==typeof t&&(this._.currentTime+=t),this},n.clear=function(){return this._.queue.splice(0),this},n.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s=null,n=e.queue;if(n.length)for(;n[0][0]<e.currentTime;){var r=e.queue.shift();if(r[1].bang(r[2]),s="sched",0===n.length){s="empty";break}}e.currentTime+=i.currentTimeIncr,s&&e.emit(s)}return this},i.register("schedule",e),i.alias("sched","schedule")}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.listener(this),i.fixAR(this);var s=this._;s.samples=0,s.writeIndex=0,s.plotFlush=!0,this.once("init",n)}var i=t.fn,s=t.timevalue;i.extend(e);var n=function(){this._.buffer||(this.size=1024),this._.interval||(this.interval=1e3)},r=e.prototype;Object.defineProperties(r,{size:{set:function(t){var e=this._;if(!e.buffer&&"number"==typeof t){var s=64>t?64:t>2048?2048:t;e.buffer=new i.SignalArray(s),e.reservedinterval&&(this.interval=e.reservedinterval,e.reservedinterval=null)}},get:function(){return this._.buffer.length}},interval:{set:function(t){var e=this._;"string"==typeof t&&(t=s(t)),"number"==typeof t&&t>0&&(e.buffer?(e.interval=t,e.samplesIncr=.001*t*e.samplerate/e.buffer.length,1>e.samplesIncr&&(e.samplesIncr=1)):e.reservedinterval=t)},get:function(){return this._.interval}},buffer:{get:function(){return this._.buffer}}}),r.bang=function(){for(var t=this._,e=t.buffer,i=0,s=e.length;s>i;++i)e[i]=0;return t.samples=0,t.writeIndex=0,this._.emit("bang"),this},r.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t,i.inputSignalAR(this),i.outputSignalAR(this);var s,n=this.cells[0],r=e.cellsize,a=e.samples,o=e.samplesIncr,h=e.buffer,u=e.writeIndex,l=!1,c=h.length;for(s=0;r>s;++s)0>=a&&(h[u++]=n[s],u>=c&&(u=0),l=e.plotFlush=!0,a+=o),--a;e.samples=a,e.writeIndex=u,l&&this._.emit("data")}return this};var a=t.Object.prototype.plot;r.plot=function(t){var e=this._;if(e.plotFlush){for(var i=e.buffer,s=i.length-1,n=new Float32Array(i.length),r=e.writeIndex,o=0,h=i.length;h>o;o++)n[o]=i[++r&s];
e.plotData=n,e.plotFlush=null}return a.call(this,t)},i.register("scope",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),n.fixAR(this);var i=this._;i.numberOfInputs=0,i.numberOfOutputs=0,i.bufferSize=0,i.bufferMask=0,i.duration=0,i.inputBufferL=null,i.inputBufferR=null,i.outputBufferL=null,i.outputBufferR=null,i.onaudioprocess=null,i.index=0,this.once("init",r)}function i(t,e){this.samplerate=t._.samplerate,this.length=t._.bufferSize,this.duration=t._.duration,this.numberOfChannels=e.length,this.getChannelData=function(t){return e[t]}}function s(e){var s=e._;this.node=e,this.playbackTime=t.currentTime,this.inputBuffer=2===s.numberOfInputs?new i(e,[s.inputBufferL,s.inputBufferR]):new i(e,[s.inputBufferL]),this.outputBuffer=2===s.numberOfOutputs?new i(e,[s.outputBufferL,s.outputBufferR]):new i(e,[s.outputBufferL])}var n=t.fn;n.extend(e);var r=function(){var t=this._;0===t.numberOfInputs&&(this.numberOfInputs=1),0===t.numberOfOutputs&&(this.numberOfOutputs=1),0===t.bufferSize&&(this.bufferSize=1024)},a=e.prototype;Object.defineProperties(a,{numberOfInputs:{set:function(t){var e=this._;0===e.numberOfInputs&&(e.numberOfInputs=2===t?2:1)},get:function(){return this._.numberOfInputs}},numberOfOutputs:{set:function(t){var e=this._;0===e.numberOfOutputs&&(e.numberOfOutputs=2===t?2:1)},get:function(){return this._.numberOfOutputs}},bufferSize:{set:function(t){var e=this._;0===e.bufferSize&&-1!==[256,512,1024,2048,4096,8192,16384].indexOf(t)&&(e.bufferSize=t,e.bufferMask=t-1,e.duration=t/e.samplerate,e.inputBufferL=new n.SignalArray(t),e.inputBufferR=new n.SignalArray(t),e.outputBufferL=new n.SignalArray(t),e.outputBufferR=new n.SignalArray(t))},get:function(){return this._.bufferSize}},onaudioprocess:{set:function(t){"function"==typeof t&&(this._.onaudioprocess=t)},get:function(){return this._.onaudioprocess}}}),a.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var i,r=e.cellsize,a=e.bufferMask,o=e.index,h=o+r,u=this.cells[1],l=this.cells[2];if(n.inputSignalAR(this),2===e.numberOfInputs)e.inputBufferL.set(u,o),e.inputBufferR.set(l,o);else{i=e.inputBufferL;for(var c=0;r>c;c++)i[o+c]=.5*(u[c]+l[c])}u.set(e.outputBufferL.subarray(o,h)),l.set(e.outputBufferR.subarray(o,h)),e.index=h&a,0===e.index&&e.onaudioprocess&&(e.onaudioprocess(new s(this)),1===e.numberOfOutputs&&e.outputBufferR.set(e.outputBufferL)),n.outputSignalAR(this)}return this},n.register("script",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),this._.selected=0,this._.background=!1}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{selected:{set:function(t){"number"==typeof t&&(this._.selected=t,this.cells[1].set(i.emptycell),this.cells[2].set(i.emptycell))},get:function(){return this._.selected}},background:{set:function(t){this._.background=!!t},get:function(){return this._.background}}}),s.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s,n=this.nodes,r=n.length;if(e.background)for(s=0;r>s;++s)n[s].process(t);var a=n[e.selected];a&&(e.background||a.process(t),this.cells[1].set(a.cells[1]),this.cells[2].set(a.cells[2])),i.outputSignalAR(this)}return this},i.register("selector",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.listener(this),i.fixAR(this);var s=this._;s.status=r,s.samples=0,s.samplesIncr=0,s.writeIndex=0,s.plotFlush=!0,s.plotRange=[0,32],s.plotBarStyle=!0,this.once("init",o)}var i=t.fn,s=t.timevalue,n=t.modules.FFT,r=0,a=1;i.extend(e);var o=function(){var t=this._;t.fft||(this.size=512),t.interval||(this.interval=500)},h=e.prototype;Object.defineProperties(h,{size:{set:function(t){var e=this._;if(!e.fft&&"number"==typeof t){var s=256>t?256:t>2048?2048:t;e.fft=new n(s),e.buffer=new i.SignalArray(e.fft.length),e.freqs=new i.SignalArray(e.fft.length>>1),e.reservedwindow&&(e.fft.setWindow(e.reservedwindow),e.reservedwindow=null),e.reservedinterval&&(this.interval=e.reservedinterval,e.reservedinterval=null)}},get:function(){return this._.buffer.length}},window:{set:function(t){this._.fft.setWindow(t)},get:function(){return this._.fft.windowName}},interval:{set:function(t){var e=this._;"string"==typeof t&&(t=s(t)),"number"==typeof t&&t>0&&(e.buffer?(e.interval=t,e.samplesIncr=.001*t*e.samplerate,e.samplesIncr<e.buffer.length&&(e.samplesIncr=e.buffer.length,e.interval=1e3*e.samplesIncr/e.samplerate)):e.reservedinterval=t)},get:function(){return this._.interval}},spectrum:{get:function(){return this._.fft.getFrequencyData(this._.freqs)}},real:{get:function(){return this._.fft.real}},imag:{get:function(){return this._.fft.imag}}}),h.bang=function(){return this._.samples=0,this._.writeIndex=0,this._.emit("bang"),this},h.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t,i.inputSignalAR(this),i.outputSignalAR(this);var s,n,o=this.cells[0],h=o.length,u=e.status,l=e.samples,c=e.samplesIncr,f=e.writeIndex,p=e.buffer,d=p.length;for(s=0;h>s;++s)0>=l&&u===r&&(u=a,f=0,l+=c),u===a&&(p[f++]=o[s],f>=d&&(e.fft.forward(p),n=e.plotFlush=!0,u=r)),--l;e.samples=l,e.status=u,e.writeIndex=f,n&&this._.emit("data")}return this};var u=t.Object.prototype.plot;h.plot=function(t){return this._.plotFlush&&(this._.plotData=this.spectrum,this._.plotFlush=null),u.call(this,t)},i.register("spectrum",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),this._.ar=!1}var i=t.fn;i.extend(e);var s=e.prototype;s.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s,n,r,a,o,h=this.nodes,u=this.cells[0],l=this.cells[1],c=this.cells[2],f=h.length,p=u.length;if(e.ar){if(h.length>0)for(h[0].process(t),a=h[0].cells[1],o=h[0].cells[2],l.set(a),c.set(o),s=1;f>s;++s)for(h[s].process(t),a=h[s].cells[1],o=h[s].cells[2],n=0;p>n;++n)l[n]-=a[n],c[n]-=o[n];else for(n=0;p>n;++n)l[n]=c[s]=0;i.outputSignalAR(this)}else{if(h.length>0)for(r=h[0].process(t).cells[0][0],s=1;f>s;++s)r-=h[s].process(t).cells[0][0];else r=0;u[0]=r,i.outputSignalKR(this)}}return this},i.register("-",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var s=this._;this.playbackState=i.FINISHED_STATE,s.poly=4,s.genList=[],s.genDict={},s.synthdef=null,s.remGen=r(this),s.onended=i.make_onended(this)}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{def:{set:function(t){"function"==typeof t&&(this._.synthdef=t)},get:function(){return this._.synthdef}},poly:{set:function(t){"number"==typeof t&&t>0&&64>=t&&(this._.poly=t)},get:function(){return this._.poly}}});var n=function(t,e){return function(){t._.remGen(e.gen)}},r=function(t){return function(e){var i=t._,s=i.genList.indexOf(e);-1!==s&&i.genList.splice(s,1),e.noteNum!==void 0&&(i.genDict[e.noteNum]=null)}},a=function(e,s,r,a){r|=0,0>=r?this.noteOff(this,e):r>127&&(r=127);var o=this._,h=o.genList,u=o.genDict,l=u[e];l&&o.remGen(l);var c={freq:s,noteNum:e,velocity:r,mul:.0078125*r};if(a)for(var f in a)c[f]=a[f];c.doneAction=n(this,c),l=o.synthdef.call(this,c),l instanceof t.Object&&(l.noteNum=e,h.push(l),u[e]=c.gen=l,this.playbackState=i.PLAYING_STATE,h.length>o.poly&&o.remGen(h[0]))},o=function(){for(var t=new Float32Array(128),e=0;128>e;++e)t[e]=440*Math.pow(2,1*(e-69)/12);return t}(),h=function(t){return t>0?12*Math.log(1*t/440)*Math.LOG2E+69:0};s.noteOn=function(t,e,i){var s=o[t]||440*Math.pow(2,(t-69)/12);return a.call(this,0|t+.5,s,e,i),this},s.noteOff=function(t){var e=this._.genDict[t];return e&&e.release&&e.release(),this},s.noteOnWithFreq=function(t,e,i){var s=h(t);return a.call(this,0|s+.5,t,e,i),this},s.noteOffWithFreq=function(t){var e=h(t);return this.noteOff(0|e+.5)},s.allNoteOff=function(){for(var t=this._.genList,e=0,i=t.length;i>e;++e)t[e].release&&t[e].release()},s.allSoundOff=function(){for(var t=this._,e=t.genList,i=t.genDict;e.length;)delete i[e.shift().noteNum]},s.synth=function(e){var s,r=this._,a=r.genList,o={};if(e)for(var h in e)o[h]=e[h];return o.doneAction=n(this,o),s=r.synthdef.call(this,o),s instanceof t.Object&&(a.push(s),o.gen=s,this.playbackState=i.PLAYING_STATE,a.length>r.poly&&r.remGen(a[0])),this},s.process=function(t){var e=this.cells[0],s=this._;if(this.tickID!==t){if(this.tickID=t,this.playbackState===i.PLAYING_STATE){var n,r,a,o,h,u,l=s.genList,c=this.cells[1],f=this.cells[2],p=e.length;if(l.length)for(n=l[0],n.process(t),c.set(n.cells[1]),f.set(n.cells[2]),r=1,a=l.length;a>r;++r)for(n=l[r],n.process(t),h=n.cells[1],u=n.cells[2],o=0;p>o;++o)c[o]+=h[o],f[o]+=u[o];else i.nextTick(s.onended)}i.outputSignalAR(this)}return this},i.register("SynthDef",e);var u={set:function(e){i.isDictionary(e)?"string"==typeof e.type&&(this._.env=e):e instanceof t.Object&&(this._.env=e)},get:function(){return this._.env}};i.register("OscGen",function(){var i={set:function(e){e instanceof t.Object&&(this._.osc=e)},get:function(){return this._.osc}},s={set:function(t){"string"==typeof t&&(this._.wave=t)},get:function(){return this._.wave}},n=function(e){var i,s,n,r,a=this._;return s=a.osc||null,n=a.env||{},r=n.type||"perc",s instanceof t.Object&&"function"==typeof s.clone&&(s=s.clone()),s||(s=t("osc",{wave:a.wave})),s.freq=e.freq,s.mul=s.mul*e.velocity/128,i=s,n instanceof t.Object?"function"==typeof n.clone&&(i=n.clone().append(i)):i=t(r,n,i),i.on("ended",e.doneAction).bang(),i};return function(t){var r=new e(t);return r._.wave="sin",Object.defineProperties(r,{env:u,osc:i,wave:s}),r.def=n,r}}()),i.register("PluckGen",function(){var i=function(e){var i,s,n,r=this._;return s=r.env||{},n=s.type||"perc",i=t("pluck",{freq:e.freq,mul:e.velocity/128}).bang(),s instanceof t.Object?"function"==typeof s.clone&&(i=s.clone().append(i)):i=t(n,s,i),i.on("ended",e.doneAction).bang(),i};return function(t){var s=new e(t);return Object.defineProperties(s,{env:u}),s.def=i,s}}())}(timbre),function(t){"use strict";function e(e){t.Object.call(this,2,e),i.fixAR(this);var s=this._;s.isLooped=!1,s.onended=i.make_onended(this,0)}var i=t.fn,s=t.modules.Scissor,n=s.Tape,r=s.TapeStream,a=i.isSignalArray;i.extend(e);var o=e.prototype;Object.defineProperties(o,{tape:{set:function(e){e instanceof n?(this.playbackState=i.PLAYING_STATE,this._.tape=e,this._.tapeStream=new r(e,this._.samplerate),this._.tapeStream.isLooped=this._.isLooped):(e instanceof t.Object&&e.buffer&&(e=e.buffer),"object"==typeof e&&Array.isArray(e.buffer)&&a(e.buffer[0])&&(this.playbackState=i.PLAYING_STATE,this._.tape=new s(e),this._.tapeStream=new r(this._.tape,this._.samplerate),this._.tapeStream.isLooped=this._.isLooped))},get:function(){return this._.tape}},isLooped:{get:function(){return this._.isLooped}},buffer:{get:function(){return this._.tape?this._.tape.getBuffer():void 0}}}),o.loop=function(t){return this._.isLooped=!!t,this._.tapeStream&&(this._.tapeStream.isLooped=this._.isLooped),this},o.bang=function(){return this.playbackState=i.PLAYING_STATE,this._.tapeStream&&this._.tapeStream.reset(),this._.emit("bang"),this},o.getBuffer=function(){return this._.tape?this._.tape.getBuffer():void 0},o.process=function(t){var e=this._;if(this.tickID!==t){this.tickID=t;var s=e.tapeStream;if(s){var n=this.cells[1],r=this.cells[2],a=s.fetch(n.length);n.set(a[0]),r.set(a[1]),this.playbackState===i.PLAYING_STATE&&s.isEnded&&i.nextTick(e.onended)}i.outputSignalAR(this)}return this},i.register("tape",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),i.timer(this);var s=this._;this.playbackState=i.FINISHED_STATE,s.task=[],s.i=0,s.j=0,s.imax=0,s.jmax=0,s.wait=0,s.count=0,s.args={},s.doNum=1,s.initFunc=i.nop,s.onended=a(this),this.on("start",r)}var i=t.fn,s=t.timevalue,n=t(function(){}).constructor;i.extend(e);var r=function(){var t,e=this._;this.playbackState=i.PLAYING_STATE,e.task=this.nodes.map(function(t){return t instanceof n?t.func:!1}).filter(function(t){return!!t}),e.i=e.j=0,e.imax=e.doNum,e.jmax=e.task.length,t=e.initFunc(),i.isDictionary(t)||(t={param:t}),e.args=t},a=function(t){return function(){t.playbackState=i.FINISHED_STATE;var e=t._,s=t.cells[0],n=t.cells[1],r=t.cells[2],a=e.args;if("number"==typeof a)for(var o=0,h=n.length;h>o;++o)s[0]=n[o]=r[o]=a;e.emit("ended",e.args)}},o=e.prototype;Object.defineProperties(o,{"do":{set:function(t){"number"==typeof t&&t>0&&(this._.doNum=1/0===t?1/0:0|t)},get:function(){return this._.doNum}},init:{set:function(t){"function"==typeof t&&(this._.initFunc=t)},get:function(){return this._.initFunc}}}),o.bang=function(){var t=this._;return t.count=0,t.emit("bang"),this},o.wait=function(t){return"string"==typeof t&&(t=s(t)),"number"==typeof t&&t>0&&(this._.count+=0|.001*this._.samplerate*t),this},o.process=function(t){var e,s=this.cells[0],n=this._;if(this.tickID!==t&&(this.tickID=t,n.i<n.imax)){for(;0>=n.count;){if(n.j>=n.jmax){if(++n.i,n.i>=n.imax){i.nextTick(n.onended);break}n.j=0}e=n.task[n.j++],e&&e.call(this,n.i,n.args)}n.count-=s.length}return this},i.register("task",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,0,e),i.timer(this),i.fixKR(this);var s=this._;this.playbackState=i.FINISHED_STATE,s.currentTime=0,s.samplesMax=0,s.samples=0,s.onended=i.make_onended(this),this.once("init",n),this.on("start",r)}var i=t.fn,s=t.timevalue;i.extend(e);var n=function(){this._.timeout||(this.timeout=1e3)},r=function(){this.playbackState=i.PLAYING_STATE};Object.defineProperty(r,"unremovable",{value:!0,writable:!1});var a=e.prototype;Object.defineProperties(a,{timeout:{set:function(t){var e=this._;"string"==typeof t&&(t=s(t)),"number"==typeof t&&t>=0&&(this.playbackState=i.PLAYING_STATE,e.timeout=t,e.samplesMax=0|e.samplerate*.001*t,e.samples=e.samplesMax)},get:function(){return this._.timeout}},currentTime:{get:function(){return this._.currentTime}}}),a.bang=function(){var t=this._;return this.playbackState=i.PLAYING_STATE,t.samples=t.samplesMax,t.currentTime=0,t.emit("bang"),this},a.process=function(t){var e=this.cells[0],s=this._;if(this.tickID!==t){if(this.tickID=t,s.samples>0&&(s.samples-=e.length),0>=s.samples){for(var n=this.nodes,r=0,a=n.length;a>r;++r)n[r].bang();i.nextTick(s.onended)}s.currentTime+=i.currentTimeIncr}return this},i.register("timeout",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e),i.fixAR(this),this._.curve=null}var i=t.fn;i.extend(e);var s=e.prototype;Object.defineProperties(s,{curve:{set:function(t){i.isSignalArray(t)&&(this._.curve=t)},get:function(){return this._.curve}}}),s.process=function(t){var e=this._;if(this.tickID!==t){if(this.tickID=t,i.inputSignalAR(this),e.curve){var s,n,r=this.cells[0],a=e.curve,o=a.length,h=e.cellsize;for(n=0;h>n;++n)s=0|.5*(r[n]+1)*o+.5,0>s?s=0:s>=o-1&&(s=o-1),r[n]=a[s]}i.outputSignalAR(this)}return this},i.register("waveshaper",e)}(timbre),function(t){"use strict";function e(e){t.Object.call(this,1,e);var i=this._;i.inMin=0,i.inMax=1,i.outMin=0,i.outMax=1,i.ar=!1,this.once("init",s)}var i=t.fn;i.extend(e);var s=function(){this._.warp||(this.warp="linlin")},n=e.prototype;Object.defineProperties(n,{inMin:{set:function(t){"number"==typeof t&&(this._.inMin=t)},get:function(){return this._.inMin}},inMax:{set:function(t){"number"==typeof t&&(this._.inMax=t)},get:function(){return this._.inMax}},outMin:{set:function(t){"number"==typeof t&&(this._.outMin=t)},get:function(){return this._.outMin}},outMax:{set:function(t){"number"==typeof t&&(this._.outMax=t)},get:function(){return this._.outMax}},warp:{set:function(t){if("string"==typeof t){var e=r[t];e&&(this._.warp=e,this._.warpName=t)}},get:function(){return this._.warpName}}}),n.process=function(t){var e=this._,s=this.cells[0];if(this.tickID!==t){this.tickID=t;var n,r=e.inMin,a=e.inMax,o=e.outMin,h=e.outMax,u=e.warp,l=this.nodes.length,c=e.mul,f=e.add,p=s.length;if(e.ar&&l){for(i.inputSignalAR(this),n=0;p>n;++n)s[n]=u(s[n],r,a,o,h)*c+f;i.outputSignalAR(this)}else{var d=this.nodes.length?i.inputSignalKR(this):0,m=u(d,r,a,o,h)*c+f;for(n=0;p>n;++n)s[n]=m}}return this};var r={linlin:function(t,e,i,s,n){return e>t?s:t>i?n:i===e?s:(t-e)/(i-e)*(n-s)+s},linexp:function(t,e,i,s,n){return e>t?s:t>i?n:0===s?0:i===e?n:Math.pow(n/s,(t-e)/(i-e))*s},explin:function(t,e,i,s,n){return e>t?s:t>i?n:0===e?n:Math.log(t/e)/Math.log(i/e)*(n-s)+s},expexp:function(t,e,i,s,n){return e>t?s:t>i?n:0===e||0===s?0:Math.pow(n/s,Math.log(t/e)/Math.log(i/e))*s}};i.register("zmap",e)}(timbre);
//@ sourceMappingURL=timbre.js.map
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
/*!
 * jQuery JavaScript Library v1.11.1
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-05-01T17:42Z
 */

(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// For CommonJS and CommonJS-like environments where a proper window is present,
		// execute the factory and get jQuery
		// For environments that do not inherently posses a window with a document
		// (such as Node.js), expose a jQuery-making factory as module.exports
		// This accentuates the need for the creation of a real window
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//

var deletedIds = [];

var slice = deletedIds.slice;

var concat = deletedIds.concat;

var push = deletedIds.push;

var indexOf = deletedIds.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var support = {};



var
	version = "1.11.1",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android<4.1, IE<9
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num != null ?

			// Return just the one element from the set
			( num < 0 ? this[ num + this.length ] : this[ num ] ) :

			// Return all the elements in a clean array
			slice.call( this );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: deletedIds.sort,
	splice: deletedIds.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var src, copyIsArray, copy, name, options, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return jQuery.type(obj) === "array";
	},

	isWindow: function( obj ) {
		/* jshint eqeqeq: false */
		return obj != null && obj == obj.window;
	},

	isNumeric: function( obj ) {
		// parseFloat NaNs numeric-cast false positives (null|true|false|"")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		return !jQuery.isArray( obj ) && obj - parseFloat( obj ) >= 0;
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	isPlainObject: function( obj ) {
		var key;

		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {
			// Not own constructor property must be Object
			if ( obj.constructor &&
				!hasOwn.call(obj, "constructor") &&
				!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Support: IE<9
		// Handle iteration over inherited properties before own properties.
		if ( support.ownLast ) {
			for ( key in obj ) {
				return hasOwn.call( obj, key );
			}
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		for ( key in obj ) {}

		return key === undefined || hasOwn.call( obj, key );
	},

	type: function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call(obj) ] || "object" :
			typeof obj;
	},

	// Evaluates a script in a global context
	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	globalEval: function( data ) {
		if ( data && jQuery.trim( data ) ) {
			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data );
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Support: Android<4.1, IE<9
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		var len;

		if ( arr ) {
			if ( indexOf ) {
				return indexOf.call( arr, elem, i );
			}

			len = arr.length;
			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

			for ( ; i < len; i++ ) {
				// Skip accessing in sparse arrays
				if ( i in arr && arr[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		while ( j < len ) {
			first[ i++ ] = second[ j++ ];
		}

		// Support: IE<9
		// Workaround casting of .length to NaN on otherwise arraylike objects (e.g., NodeLists)
		if ( len !== len ) {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var args, proxy, tmp;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: function() {
		return +( new Date() );
	},

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
});

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v1.10.19
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-04-18
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + characterEncoding + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( documentIsHTML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== strundefined && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare,
		doc = node ? node.ownerDocument || node : preferredDoc,
		parent = doc.defaultView;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", function() {
				setDocument();
			}, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", function() {
				setDocument();
			});
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if getElementsByClassName can be trusted
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName ) && assert(function( div ) {
		div.innerHTML = "<div class='a'></div><div class='a i'></div>";

		// Support: Safari<4
		// Catch class over-caching
		div.firstChild.className = "i";
		// Support: Opera<10
		// Catch gEBCN failure to find non-leading classes
		return div.getElementsByClassName("i").length === 2;
	});

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [ m ] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select msallowclip=''><option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( div.querySelectorAll("[msallowclip^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (oldCache = outerCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is no seed and only one group
	if ( match.length === 1 ) {

		// Take a shortcut and set the context if the root selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				support.getById && context.nodeType === 9 && documentIsHTML &&
				Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;



var rneedsContext = jQuery.expr.match.needsContext;

var rsingleTag = (/^<(\w+)\s*\/?>(?:<\/\1>|)$/);



var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});

	}

	if ( typeof qualifier === "string" ) {
		if ( risSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( jQuery.inArray( elem, qualifier ) >= 0 ) !== not;
	});
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	return elems.length === 1 && elem.nodeType === 1 ?
		jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
		jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		}));
};

jQuery.fn.extend({
	find: function( selector ) {
		var i,
			ret = [],
			self = this,
			len = self.length;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},
	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
});


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	init = jQuery.fn.init = function( selector, context ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return typeof rootjQuery.ready !== "undefined" ?
				rootjQuery.ready( selector ) :
				// Execute immediately if ready is not present
				selector( jQuery );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.extend({
	dir: function( elem, dir, until ) {
		var matched = [],
			cur = elem[ dir ];

		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});

jQuery.fn.extend({
	has: function( target ) {
		var i,
			targets = jQuery( target, this ),
			len = targets.length;

		return this.filter(function() {
			for ( i = 0; i < len; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					matched.push( cur );
					break;
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[0] && this[0].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return jQuery.inArray( this[0], jQuery( elem ) );
		}

		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.unique(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling( cur, dir ) {
	do {
		cur = cur[ dir ];
	} while ( cur && cur.nodeType !== 1 );

	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		if ( this.length > 1 ) {
			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				ret = jQuery.unique( ret );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				ret = ret.reverse();
			}
		}

		return this.pushStack( ret );
	};
});
var rnotwhite = (/\S+/g);



// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,
		// Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ tuple[ 0 ] + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( values === progressValues ) {
						deferred.notifyWith( contexts, values );

					} else if ( !(--remaining) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});


// The deferred used on DOM ready
var readyList;

jQuery.fn.ready = function( fn ) {
	// Add the callback
	jQuery.ready.promise().done( fn );

	return this;
};

jQuery.extend({
	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( !document.body ) {
			return setTimeout( jQuery.ready );
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.triggerHandler ) {
			jQuery( document ).triggerHandler( "ready" );
			jQuery( document ).off( "ready" );
		}
	}
});

/**
 * Clean-up method for dom ready events
 */
function detach() {
	if ( document.addEventListener ) {
		document.removeEventListener( "DOMContentLoaded", completed, false );
		window.removeEventListener( "load", completed, false );

	} else {
		document.detachEvent( "onreadystatechange", completed );
		window.detachEvent( "onload", completed );
	}
}

/**
 * The ready event handler and self cleanup method
 */
function completed() {
	// readyState === "complete" is good enough for us to call the dom ready in oldIE
	if ( document.addEventListener || event.type === "load" || document.readyState === "complete" ) {
		detach();
		jQuery.ready();
	}
}

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		// Standards-based browsers support DOMContentLoaded
		} else if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );

		// If IE event model is used
		} else {
			// Ensure firing before onload, maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", completed );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", completed );

			// If IE and not a frame
			// continually check to see if the document is ready
			var top = false;

			try {
				top = window.frameElement == null && document.documentElement;
			} catch(e) {}

			if ( top && top.doScroll ) {
				(function doScrollCheck() {
					if ( !jQuery.isReady ) {

						try {
							// Use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							top.doScroll("left");
						} catch(e) {
							return setTimeout( doScrollCheck, 50 );
						}

						// detach all dom ready events
						detach();

						// and execute any waiting functions
						jQuery.ready();
					}
				})();
			}
		}
	}
	return readyList.promise( obj );
};


var strundefined = typeof undefined;



// Support: IE<9
// Iteration over object's inherited properties before its own
var i;
for ( i in jQuery( support ) ) {
	break;
}
support.ownLast = i !== "0";

// Note: most support tests are defined in their respective modules.
// false until the test is run
support.inlineBlockNeedsLayout = false;

// Execute ASAP in case we need to set body.style.zoom
jQuery(function() {
	// Minified: var a,b,c,d
	var val, div, body, container;

	body = document.getElementsByTagName( "body" )[ 0 ];
	if ( !body || !body.style ) {
		// Return for frameset docs that don't have a body
		return;
	}

	// Setup
	div = document.createElement( "div" );
	container = document.createElement( "div" );
	container.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
	body.appendChild( container ).appendChild( div );

	if ( typeof div.style.zoom !== strundefined ) {
		// Support: IE<8
		// Check if natively block-level elements act like inline-block
		// elements when setting their display to 'inline' and giving
		// them layout
		div.style.cssText = "display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1";

		support.inlineBlockNeedsLayout = val = div.offsetWidth === 3;
		if ( val ) {
			// Prevent IE 6 from affecting layout for positioned elements #11048
			// Prevent IE from shrinking the body in IE 7 mode #12869
			// Support: IE<8
			body.style.zoom = 1;
		}
	}

	body.removeChild( container );
});




(function() {
	var div = document.createElement( "div" );

	// Execute the test only if not already executed in another module.
	if (support.deleteExpando == null) {
		// Support: IE<9
		support.deleteExpando = true;
		try {
			delete div.test;
		} catch( e ) {
			support.deleteExpando = false;
		}
	}

	// Null elements to avoid leaks in IE.
	div = null;
})();


/**
 * Determines whether an object can have data
 */
jQuery.acceptData = function( elem ) {
	var noData = jQuery.noData[ (elem.nodeName + " ").toLowerCase() ],
		nodeType = +elem.nodeType || 1;

	// Do not set data on non-element DOM nodes because it will not be cleared (#8335).
	return nodeType !== 1 && nodeType !== 9 ?
		false :

		// Nodes accept data unless otherwise specified; rejection can be conditional
		!noData || noData !== true && elem.getAttribute("classid") === noData;
};


var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /([A-Z])/g;

function dataAttr( elem, key, data ) {
	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}

function internalData( elem, name, data, pvt /* Internal Use Only */ ) {
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var ret, thisCache,
		internalKey = jQuery.expando,

		// We have to handle DOM nodes and JS objects differently because IE6-7
		// can't GC object references properly across the DOM-JS boundary
		isNode = elem.nodeType,

		// Only DOM nodes need the global jQuery cache; JS object data is
		// attached directly to the object so GC can occur automatically
		cache = isNode ? jQuery.cache : elem,

		// Only defining an ID for JS objects if its cache already exists allows
		// the code to shortcut on the same path as a DOM node with no cache
		id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

	// Avoid doing any more work than we need to when trying to get data on an
	// object that has no data at all
	if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && data === undefined && typeof name === "string" ) {
		return;
	}

	if ( !id ) {
		// Only DOM nodes need a new unique ID for each element since their data
		// ends up in the global cache
		if ( isNode ) {
			id = elem[ internalKey ] = deletedIds.pop() || jQuery.guid++;
		} else {
			id = internalKey;
		}
	}

	if ( !cache[ id ] ) {
		// Avoid exposing jQuery metadata on plain JS objects when the object
		// is serialized using JSON.stringify
		cache[ id ] = isNode ? {} : { toJSON: jQuery.noop };
	}

	// An object can be passed to jQuery.data instead of a key/value pair; this gets
	// shallow copied over onto the existing cache
	if ( typeof name === "object" || typeof name === "function" ) {
		if ( pvt ) {
			cache[ id ] = jQuery.extend( cache[ id ], name );
		} else {
			cache[ id ].data = jQuery.extend( cache[ id ].data, name );
		}
	}

	thisCache = cache[ id ];

	// jQuery data() is stored in a separate object inside the object's internal data
	// cache in order to avoid key collisions between internal data and user-defined
	// data.
	if ( !pvt ) {
		if ( !thisCache.data ) {
			thisCache.data = {};
		}

		thisCache = thisCache.data;
	}

	if ( data !== undefined ) {
		thisCache[ jQuery.camelCase( name ) ] = data;
	}

	// Check for both converted-to-camel and non-converted data property names
	// If a data property was specified
	if ( typeof name === "string" ) {

		// First Try to find as-is property data
		ret = thisCache[ name ];

		// Test for null|undefined property data
		if ( ret == null ) {

			// Try to find the camelCased property
			ret = thisCache[ jQuery.camelCase( name ) ];
		}
	} else {
		ret = thisCache;
	}

	return ret;
}

function internalRemoveData( elem, name, pvt ) {
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var thisCache, i,
		isNode = elem.nodeType,

		// See jQuery.data for more information
		cache = isNode ? jQuery.cache : elem,
		id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

	// If there is already no cache entry for this object, there is no
	// purpose in continuing
	if ( !cache[ id ] ) {
		return;
	}

	if ( name ) {

		thisCache = pvt ? cache[ id ] : cache[ id ].data;

		if ( thisCache ) {

			// Support array or space separated string names for data keys
			if ( !jQuery.isArray( name ) ) {

				// try the string as a key before any manipulation
				if ( name in thisCache ) {
					name = [ name ];
				} else {

					// split the camel cased version by spaces unless a key with the spaces exists
					name = jQuery.camelCase( name );
					if ( name in thisCache ) {
						name = [ name ];
					} else {
						name = name.split(" ");
					}
				}
			} else {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = name.concat( jQuery.map( name, jQuery.camelCase ) );
			}

			i = name.length;
			while ( i-- ) {
				delete thisCache[ name[i] ];
			}

			// If there is no data left in the cache, we want to continue
			// and let the cache object itself get destroyed
			if ( pvt ? !isEmptyDataObject(thisCache) : !jQuery.isEmptyObject(thisCache) ) {
				return;
			}
		}
	}

	// See jQuery.data for more information
	if ( !pvt ) {
		delete cache[ id ].data;

		// Don't destroy the parent cache unless the internal data object
		// had been the only thing left in it
		if ( !isEmptyDataObject( cache[ id ] ) ) {
			return;
		}
	}

	// Destroy the cache
	if ( isNode ) {
		jQuery.cleanData( [ elem ], true );

	// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
	/* jshint eqeqeq: false */
	} else if ( support.deleteExpando || cache != cache.window ) {
		/* jshint eqeqeq: true */
		delete cache[ id ];

	// When all else fails, null
	} else {
		cache[ id ] = null;
	}
}

jQuery.extend({
	cache: {},

	// The following elements (space-suffixed to avoid Object.prototype collisions)
	// throw uncatchable exceptions if you attempt to set expando properties
	noData: {
		"applet ": true,
		"embed ": true,
		// ...but Flash objects (which have this classid) *can* handle expandos
		"object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	data: function( elem, name, data ) {
		return internalData( elem, name, data );
	},

	removeData: function( elem, name ) {
		return internalRemoveData( elem, name );
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return internalData( elem, name, data, true );
	},

	_removeData: function( elem, name ) {
		return internalRemoveData( elem, name, true );
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var i, name, data,
			elem = this[0],
			attrs = elem && elem.attributes;

		// Special expections of .data basically thwart jQuery.access,
		// so implement the relevant behavior ourselves

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE11+
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = jQuery.camelCase( name.slice(5) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		return arguments.length > 1 ?

			// Sets one value
			this.each(function() {
				jQuery.data( this, key, value );
			}) :

			// Gets one value
			// Try to fetch any internally stored data first
			elem ? dataAttr( elem, key, jQuery.data( elem, key ) ) : undefined;
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});


jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = jQuery._data( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray(data) ) {
					queue = jQuery._data( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return jQuery._data( elem, key ) || jQuery._data( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				jQuery._removeData( elem, type + "queue" );
				jQuery._removeData( elem, key );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = jQuery._data( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;

var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHidden = function( elem, el ) {
		// isHidden might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;
		return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
	};



// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = jQuery.access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		length = elems.length,
		bulk = key == null;

	// Sets many values
	if ( jQuery.type( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !jQuery.isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {
			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < length; i++ ) {
				fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
			}
		}
	}

	return chainable ?
		elems :

		// Gets
		bulk ?
			fn.call( elems ) :
			length ? fn( elems[0], key ) : emptyGet;
};
var rcheckableType = (/^(?:checkbox|radio)$/i);



(function() {
	// Minified: var a,b,c
	var input = document.createElement( "input" ),
		div = document.createElement( "div" ),
		fragment = document.createDocumentFragment();

	// Setup
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

	// IE strips leading whitespace when .innerHTML is used
	support.leadingWhitespace = div.firstChild.nodeType === 3;

	// Make sure that tbody elements aren't automatically inserted
	// IE will insert them into empty tables
	support.tbody = !div.getElementsByTagName( "tbody" ).length;

	// Make sure that link elements get serialized correctly by innerHTML
	// This requires a wrapper element in IE
	support.htmlSerialize = !!div.getElementsByTagName( "link" ).length;

	// Makes sure cloning an html5 element does not cause problems
	// Where outerHTML is undefined, this still works
	support.html5Clone =
		document.createElement( "nav" ).cloneNode( true ).outerHTML !== "<:nav></:nav>";

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	input.type = "checkbox";
	input.checked = true;
	fragment.appendChild( input );
	support.appendChecked = input.checked;

	// Make sure textarea (and checkbox) defaultValue is properly cloned
	// Support: IE6-IE11+
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;

	// #11217 - WebKit loses check when the name is after the checked attribute
	fragment.appendChild( div );
	div.innerHTML = "<input type='radio' checked='checked' name='t'/>";

	// Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
	// old WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<9
	// Opera does not clone events (and typeof div.attachEvent === undefined).
	// IE9-10 clones events bound via attachEvent, but they don't trigger with .click()
	support.noCloneEvent = true;
	if ( div.attachEvent ) {
		div.attachEvent( "onclick", function() {
			support.noCloneEvent = false;
		});

		div.cloneNode( true ).click();
	}

	// Execute the test only if not already executed in another module.
	if (support.deleteExpando == null) {
		// Support: IE<9
		support.deleteExpando = true;
		try {
			delete div.test;
		} catch( e ) {
			support.deleteExpando = false;
		}
	}
})();


(function() {
	var i, eventName,
		div = document.createElement( "div" );

	// Support: IE<9 (lack submit/change bubble), Firefox 23+ (lack focusin event)
	for ( i in { submit: true, change: true, focusin: true }) {
		eventName = "on" + i;

		if ( !(support[ i + "Bubbles" ] = eventName in window) ) {
			// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
			div.setAttribute( eventName, "t" );
			support[ i + "Bubbles" ] = div.attributes[ eventName ].expando === false;
		}
	}

	// Null elements to avoid leaks in IE.
	div = null;
})();


var rformElems = /^(?:input|select|textarea)$/i,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {
		var tmp, events, t, handleObjIn,
			special, eventHandle, handleObj,
			handlers, type, namespaces, origType,
			elemData = jQuery._data( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener/attachEvent if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {
		var j, handleObj, tmp,
			origCount, t, events,
			special, handlers, type,
			namespaces, origType,
			elemData = jQuery.hasData( elem ) && jQuery._data( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery._removeData( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {
		var handle, ontype, cur,
			bubbleType, special, tmp, i,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && jQuery.acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && elem[ type ] && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					try {
						elem[ type ]();
					} catch ( e ) {
						// IE<9 dies on focus/blur to hidden element (#1486,#12518)
						// only reproducible on winXP IE8 native, not IE9 in IE8 mode
					}
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, ret, handleObj, matched, j,
			handlerQueue = [],
			args = slice.call( arguments ),
			handlers = ( jQuery._data( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var sel, handleObj, matches, i,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			/* jshint eqeqeq: false */
			for ( ; cur != this; cur = cur.parentNode || this ) {
				/* jshint eqeqeq: true */

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && (cur.disabled !== true || event.type !== "click") ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: IE<9
		// Fix target property (#1925)
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Support: Chrome 23+, Safari?
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Support: IE<9
		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
		event.metaKey = !!event.metaKey;

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var body, eventDoc, doc,
				button = original.button,
				fromElement = original.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					try {
						this.focus();
						return false;
					} catch ( e ) {
						// Support: IE<9
						// If we error on focus to hidden element (#1486, #12518),
						// let .trigger() run the handlers
					}
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( jQuery.nodeName( this, "input" ) && this.type === "checkbox" && this.click ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle, false );
		}
	} :
	function( elem, type, handle ) {
		var name = "on" + type;

		if ( elem.detachEvent ) {

			// #8545, #7054, preventing memory leaks for custom events in IE6-8
			// detachEvent needed property on element, by name of that event, to properly expose it to GC
			if ( typeof elem[ name ] === strundefined ) {
				elem[ name ] = null;
			}

			elem.detachEvent( name, handle );
		}
	};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&
				// Support: IE < 9, Android < 4.0
				src.returnValue === false ?
			returnTrue :
			returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;
		if ( !e ) {
			return;
		}

		// If preventDefault exists, run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();

		// Support: IE
		// Otherwise set the returnValue property of the original event to false
		} else {
			e.returnValue = false;
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;
		if ( !e ) {
			return;
		}
		// If stopPropagation exists, run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}

		// Support: IE
		// Set the cancelBubble property of the original event to true
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && e.stopImmediatePropagation ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// IE submit delegation
if ( !support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
				if ( form && !jQuery._data( form, "submitBubbles" ) ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						event._submit_bubble = true;
					});
					jQuery._data( form, "submitBubbles", true );
				}
			});
			// return undefined since we don't need an event listener
		},

		postDispatch: function( event ) {
			// If form was submitted by the user, bubble the event up the tree
			if ( event._submit_bubble ) {
				delete event._submit_bubble;
				if ( this.parentNode && !event.isTrigger ) {
					jQuery.event.simulate( "submit", this.parentNode, event, true );
				}
			}
		},

		teardown: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
if ( !support.changeBubbles ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {
				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._just_changed = true;
						}
					});
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._just_changed && !event.isTrigger ) {
							this._just_changed = false;
						}
						// Allow triggered, simulated change events (#11500)
						jQuery.event.simulate( "change", this, event, true );
					});
				}
				return false;
			}
			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "changeBubbles" ) ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event, true );
						}
					});
					jQuery._data( elem, "changeBubbles", true );
				}
			});
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return !rformElems.test( this.nodeName );
		}
	};
}

// Create "bubbling" focus and blur events
if ( !support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = jQuery._data( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				jQuery._data( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = jQuery._data( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					jQuery._removeData( doc, fix );
				} else {
					jQuery._data( doc, fix, attaches );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var type, origFn;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});


function createSafeFragment( document ) {
	var list = nodeNames.split( "|" ),
		safeFrag = document.createDocumentFragment();

	if ( safeFrag.createElement ) {
		while ( list.length ) {
			safeFrag.createElement(
				list.pop()
			);
		}
	}
	return safeFrag;
}

var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
	rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
	rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		area: [ 1, "<map>", "</map>" ],
		param: [ 1, "<object>", "</object>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		// IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
		// unless wrapped in a div with non-breaking characters in front of it.
		_default: support.htmlSerialize ? [ 0, "", "" ] : [ 1, "X<div>", "</div>"  ]
	},
	safeFragment = createSafeFragment( document ),
	fragmentDiv = safeFragment.appendChild( document.createElement("div") );

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

function getAll( context, tag ) {
	var elems, elem,
		i = 0,
		found = typeof context.getElementsByTagName !== strundefined ? context.getElementsByTagName( tag || "*" ) :
			typeof context.querySelectorAll !== strundefined ? context.querySelectorAll( tag || "*" ) :
			undefined;

	if ( !found ) {
		for ( found = [], elems = context.childNodes || context; (elem = elems[i]) != null; i++ ) {
			if ( !tag || jQuery.nodeName( elem, tag ) ) {
				found.push( elem );
			} else {
				jQuery.merge( found, getAll( elem, tag ) );
			}
		}
	}

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], found ) :
		found;
}

// Used in buildFragment, fixes the defaultChecked property
function fixDefaultChecked( elem ) {
	if ( rcheckableType.test( elem.type ) ) {
		elem.defaultChecked = elem.checked;
	}
}

// Support: IE<8
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = (jQuery.find.attr( elem, "type" ) !== null) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );
	if ( match ) {
		elem.type = match[1];
	} else {
		elem.removeAttribute("type");
	}
	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var elem,
		i = 0;
	for ( ; (elem = elems[i]) != null; i++ ) {
		jQuery._data( elem, "globalEval", !refElements || jQuery._data( refElements[i], "globalEval" ) );
	}
}

function cloneCopyEvent( src, dest ) {

	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
		return;
	}

	var type, i, l,
		oldData = jQuery._data( src ),
		curData = jQuery._data( dest, oldData ),
		events = oldData.events;

	if ( events ) {
		delete curData.handle;
		curData.events = {};

		for ( type in events ) {
			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
				jQuery.event.add( dest, type, events[ type ][ i ] );
			}
		}
	}

	// make the cloned public data object a copy from the original
	if ( curData.data ) {
		curData.data = jQuery.extend( {}, curData.data );
	}
}

function fixCloneNodeIssues( src, dest ) {
	var nodeName, e, data;

	// We do not need to do anything for non-Elements
	if ( dest.nodeType !== 1 ) {
		return;
	}

	nodeName = dest.nodeName.toLowerCase();

	// IE6-8 copies events bound via attachEvent when using cloneNode.
	if ( !support.noCloneEvent && dest[ jQuery.expando ] ) {
		data = jQuery._data( dest );

		for ( e in data.events ) {
			jQuery.removeEvent( dest, e, data.handle );
		}

		// Event data gets referenced instead of copied if the expando gets copied too
		dest.removeAttribute( jQuery.expando );
	}

	// IE blanks contents when cloning scripts, and tries to evaluate newly-set text
	if ( nodeName === "script" && dest.text !== src.text ) {
		disableScript( dest ).text = src.text;
		restoreScript( dest );

	// IE6-10 improperly clones children of object elements using classid.
	// IE10 throws NoModificationAllowedError if parent is null, #12132.
	} else if ( nodeName === "object" ) {
		if ( dest.parentNode ) {
			dest.outerHTML = src.outerHTML;
		}

		// This path appears unavoidable for IE9. When cloning an object
		// element in IE9, the outerHTML strategy above is not sufficient.
		// If the src has innerHTML and the destination does not,
		// copy the src.innerHTML into the dest.innerHTML. #10324
		if ( support.html5Clone && ( src.innerHTML && !jQuery.trim(dest.innerHTML) ) ) {
			dest.innerHTML = src.innerHTML;
		}

	} else if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		// IE6-8 fails to persist the checked state of a cloned checkbox
		// or radio button. Worse, IE6-7 fail to give the cloned element
		// a checked appearance if the defaultChecked value isn't also set

		dest.defaultChecked = dest.checked = src.checked;

		// IE6-7 get confused and end up setting the value of a cloned
		// checkbox/radio button to an empty string instead of "on"
		if ( dest.value !== src.value ) {
			dest.value = src.value;
		}

	// IE6-8 fails to return the selected option to the default selected
	// state when cloning options
	} else if ( nodeName === "option" ) {
		dest.defaultSelected = dest.selected = src.defaultSelected;

	// IE6-8 fails to set the defaultValue to the correct value when
	// cloning other types of input fields
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var destElements, node, clone, i, srcElements,
			inPage = jQuery.contains( elem.ownerDocument, elem );

		if ( support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {
			clone = elem.cloneNode( true );

		// IE<=8 does not properly clone detached, unknown element nodes
		} else {
			fragmentDiv.innerHTML = elem.outerHTML;
			fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
		}

		if ( (!support.noCloneEvent || !support.noCloneChecked) &&
				(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			// Fix all IE cloning issues
			for ( i = 0; (node = srcElements[i]) != null; ++i ) {
				// Ensure that the destination node is not null; Fixes #9587
				if ( destElements[i] ) {
					fixCloneNodeIssues( node, destElements[i] );
				}
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0; (node = srcElements[i]) != null; i++ ) {
					cloneCopyEvent( node, destElements[i] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		destElements = srcElements = node = null;

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var j, elem, contains,
			tmp, tag, tbody, wrap,
			l = elems.length,

			// Ensure a safe fragment
			safe = createSafeFragment( context ),

			nodes = [],
			i = 0;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || safe.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = (rtagName.exec( elem ) || [ "", "" ])[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;

					tmp.innerHTML = wrap[1] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[2];

					// Descend through wrappers to the right content
					j = wrap[0];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Manually add leading whitespace removed by IE
					if ( !support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
						nodes.push( context.createTextNode( rleadingWhitespace.exec( elem )[0] ) );
					}

					// Remove IE's autoinserted <tbody> from table fragments
					if ( !support.tbody ) {

						// String was a <table>, *may* have spurious <tbody>
						elem = tag === "table" && !rtbody.test( elem ) ?
							tmp.firstChild :

							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && !rtbody.test( elem ) ?
								tmp :
								0;

						j = elem && elem.childNodes.length;
						while ( j-- ) {
							if ( jQuery.nodeName( (tbody = elem.childNodes[j]), "tbody" ) && !tbody.childNodes.length ) {
								elem.removeChild( tbody );
							}
						}
					}

					jQuery.merge( nodes, tmp.childNodes );

					// Fix #12392 for WebKit and IE > 9
					tmp.textContent = "";

					// Fix #12392 for oldIE
					while ( tmp.firstChild ) {
						tmp.removeChild( tmp.firstChild );
					}

					// Remember the top-level container for proper cleanup
					tmp = safe.lastChild;
				}
			}
		}

		// Fix #11356: Clear elements from fragment
		if ( tmp ) {
			safe.removeChild( tmp );
		}

		// Reset defaultChecked for any radios and checkboxes
		// about to be appended to the DOM in IE 6/7 (#8060)
		if ( !support.appendChecked ) {
			jQuery.grep( getAll( nodes, "input" ), fixDefaultChecked );
		}

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( safe.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		tmp = null;

		return safe;
	},

	cleanData: function( elems, /* internal */ acceptData ) {
		var elem, type, id, data,
			i = 0,
			internalKey = jQuery.expando,
			cache = jQuery.cache,
			deleteExpando = support.deleteExpando,
			special = jQuery.event.special;

		for ( ; (elem = elems[i]) != null; i++ ) {
			if ( acceptData || jQuery.acceptData( elem ) ) {

				id = elem[ internalKey ];
				data = id && cache[ id ];

				if ( data ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Remove cache only if it was not already removed by jQuery.event.remove
					if ( cache[ id ] ) {

						delete cache[ id ];

						// IE does not allow us to delete expando properties from nodes,
						// nor does it have a removeAttribute function on Document nodes;
						// we must handle all of these cases
						if ( deleteExpando ) {
							delete elem[ internalKey ];

						} else if ( typeof elem.removeAttribute !== strundefined ) {
							elem.removeAttribute( internalKey );

						} else {
							elem[ internalKey ] = null;
						}

						deletedIds.push( id );
					}
				}
			}
		}
	}
});

jQuery.fn.extend({
	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	append: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	remove: function( selector, keepData /* Internal Use Only */ ) {
		var elem,
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {

			if ( !keepData && elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					setGlobalEval( getAll( elem, "script" ) );
				}
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem, false ) );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}

			// If this is a select, ensure that it displays empty (#12336)
			// Support: IE<9
			if ( elem.options && jQuery.nodeName( elem, "select" ) ) {
				elem.options.length = 0;
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map(function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined ) {
				return elem.nodeType === 1 ?
					elem.innerHTML.replace( rinlinejQuery, "" ) :
					undefined;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				( support.htmlSerialize || !rnoshimcache.test( value )  ) &&
				( support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
				!wrapMap[ (rtagName.exec( value ) || [ "", "" ])[ 1 ].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for (; i < l; i++ ) {
						// Remove element nodes and prevent memory leaks
						elem = this[i] || {};
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch(e) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var arg = arguments[ 0 ];

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			arg = this.parentNode;

			jQuery.cleanData( getAll( this ) );

			if ( arg ) {
				arg.replaceChild( elem, this );
			}
		});

		// Force removal if there was no new content (e.g., from empty arguments)
		return arg && (arg.length || arg.nodeType) ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, callback ) {

		// Flatten any nested arrays
		args = concat.apply( [], args );

		var first, node, hasScripts,
			scripts, doc, fragment,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[0],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[0] = value.call( this, index, self.html() );
				}
				self.domManip( args, callback );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( this[i], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!jQuery._data( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl ) {
									jQuery._evalUrl( node.src );
								}
							} else {
								jQuery.globalEval( ( node.text || node.textContent || node.innerHTML || "" ).replace( rcleanScript, "" ) );
							}
						}
					}
				}

				// Fix #11809: Avoid leaking memory
				fragment = first = null;
			}
		}

		return this;
	}
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			i = 0,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone(true);
			jQuery( insert[i] )[ original ]( elems );

			// Modern browsers can apply jQuery collections as arrays, but oldIE needs a .get()
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});


var iframe,
	elemdisplay = {};

/**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */
// Called only from within defaultDisplay
function actualDisplay( name, doc ) {
	var style,
		elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),

		// getDefaultComputedStyle might be reliably used only on attached element
		display = window.getDefaultComputedStyle && ( style = window.getDefaultComputedStyle( elem[ 0 ] ) ) ?

			// Use of this method is a temporary fix (more like optmization) until something better comes along,
			// since it was removed from specification and supported only in FF
			style.display : jQuery.css( elem[ 0 ], "display" );

	// We don't have any data stored on the element,
	// so use "detach" method as fast way to get rid of the element
	elem.detach();

	return display;
}

/**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */
function defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {

			// Use the already-created iframe if possible
			iframe = (iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" )).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[ 0 ].contentWindow || iframe[ 0 ].contentDocument ).document;

			// Support: IE
			doc.write();
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}


(function() {
	var shrinkWrapBlocksVal;

	support.shrinkWrapBlocks = function() {
		if ( shrinkWrapBlocksVal != null ) {
			return shrinkWrapBlocksVal;
		}

		// Will be changed later if needed.
		shrinkWrapBlocksVal = false;

		// Minified: var b,c,d
		var div, body, container;

		body = document.getElementsByTagName( "body" )[ 0 ];
		if ( !body || !body.style ) {
			// Test fired too early or in an unsupported environment, exit.
			return;
		}

		// Setup
		div = document.createElement( "div" );
		container = document.createElement( "div" );
		container.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
		body.appendChild( container ).appendChild( div );

		// Support: IE6
		// Check if elements with layout shrink-wrap their children
		if ( typeof div.style.zoom !== strundefined ) {
			// Reset CSS: box-sizing; display; margin; border
			div.style.cssText =
				// Support: Firefox<29, Android 2.3
				// Vendor-prefix box-sizing
				"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" +
				"box-sizing:content-box;display:block;margin:0;border:0;" +
				"padding:1px;width:1px;zoom:1";
			div.appendChild( document.createElement( "div" ) ).style.width = "5px";
			shrinkWrapBlocksVal = div.offsetWidth !== 3;
		}

		body.removeChild( container );

		return shrinkWrapBlocksVal;
	};

})();
var rmargin = (/^margin/);

var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );



var getStyles, curCSS,
	rposition = /^(top|right|bottom|left)$/;

if ( window.getComputedStyle ) {
	getStyles = function( elem ) {
		return elem.ownerDocument.defaultView.getComputedStyle( elem, null );
	};

	curCSS = function( elem, name, computed ) {
		var width, minWidth, maxWidth, ret,
			style = elem.style;

		computed = computed || getStyles( elem );

		// getPropertyValue is only needed for .css('filter') in IE9, see #12537
		ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined;

		if ( computed ) {

			if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
			// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
			// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
			if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		// Support: IE
		// IE returns zIndex value as an integer.
		return ret === undefined ?
			ret :
			ret + "";
	};
} else if ( document.documentElement.currentStyle ) {
	getStyles = function( elem ) {
		return elem.currentStyle;
	};

	curCSS = function( elem, name, computed ) {
		var left, rs, rsLeft, ret,
			style = elem.style;

		computed = computed || getStyles( elem );
		ret = computed ? computed[ name ] : undefined;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && style[ name ] ) {
			ret = style[ name ];
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		// but not position css attributes, as those are proportional to the parent element instead
		// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

			// Remember the original values
			left = style.left;
			rs = elem.runtimeStyle;
			rsLeft = rs && rs.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				rs.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				rs.left = rsLeft;
			}
		}

		// Support: IE
		// IE returns zIndex value as an integer.
		return ret === undefined ?
			ret :
			ret + "" || "auto";
	};
}




function addGetHookIf( conditionFn, hookFn ) {
	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			var condition = conditionFn();

			if ( condition == null ) {
				// The test was not ready at this point; screw the hook this time
				// but check again when needed next time.
				return;
			}

			if ( condition ) {
				// Hook not needed (or it's not possible to use it due to missing dependency),
				// remove it.
				// Since there are no other hooks for marginRight, remove the whole object.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.

			return (this.get = hookFn).apply( this, arguments );
		}
	};
}


(function() {
	// Minified: var b,c,d,e,f,g, h,i
	var div, style, a, pixelPositionVal, boxSizingReliableVal,
		reliableHiddenOffsetsVal, reliableMarginRightVal;

	// Setup
	div = document.createElement( "div" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
	a = div.getElementsByTagName( "a" )[ 0 ];
	style = a && a.style;

	// Finish early in limited (non-browser) environments
	if ( !style ) {
		return;
	}

	style.cssText = "float:left;opacity:.5";

	// Support: IE<9
	// Make sure that element opacity exists (as opposed to filter)
	support.opacity = style.opacity === "0.5";

	// Verify style float existence
	// (IE uses styleFloat instead of cssFloat)
	support.cssFloat = !!style.cssFloat;

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Support: Firefox<29, Android 2.3
	// Vendor-prefix box-sizing
	support.boxSizing = style.boxSizing === "" || style.MozBoxSizing === "" ||
		style.WebkitBoxSizing === "";

	jQuery.extend(support, {
		reliableHiddenOffsets: function() {
			if ( reliableHiddenOffsetsVal == null ) {
				computeStyleTests();
			}
			return reliableHiddenOffsetsVal;
		},

		boxSizingReliable: function() {
			if ( boxSizingReliableVal == null ) {
				computeStyleTests();
			}
			return boxSizingReliableVal;
		},

		pixelPosition: function() {
			if ( pixelPositionVal == null ) {
				computeStyleTests();
			}
			return pixelPositionVal;
		},

		// Support: Android 2.3
		reliableMarginRight: function() {
			if ( reliableMarginRightVal == null ) {
				computeStyleTests();
			}
			return reliableMarginRightVal;
		}
	});

	function computeStyleTests() {
		// Minified: var b,c,d,j
		var div, body, container, contents;

		body = document.getElementsByTagName( "body" )[ 0 ];
		if ( !body || !body.style ) {
			// Test fired too early or in an unsupported environment, exit.
			return;
		}

		// Setup
		div = document.createElement( "div" );
		container = document.createElement( "div" );
		container.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
		body.appendChild( container ).appendChild( div );

		div.style.cssText =
			// Support: Firefox<29, Android 2.3
			// Vendor-prefix box-sizing
			"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" +
			"box-sizing:border-box;display:block;margin-top:1%;top:1%;" +
			"border:1px;padding:1px;width:4px;position:absolute";

		// Support: IE<9
		// Assume reasonable values in the absence of getComputedStyle
		pixelPositionVal = boxSizingReliableVal = false;
		reliableMarginRightVal = true;

		// Check for getComputedStyle so that this code is not run in IE<9.
		if ( window.getComputedStyle ) {
			pixelPositionVal = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			boxSizingReliableVal =
				( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			// Support: Android 2.3
			// Div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container (#3333)
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			contents = div.appendChild( document.createElement( "div" ) );

			// Reset CSS: box-sizing; display; margin; border; padding
			contents.style.cssText = div.style.cssText =
				// Support: Firefox<29, Android 2.3
				// Vendor-prefix box-sizing
				"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" +
				"box-sizing:content-box;display:block;margin:0;border:0;padding:0";
			contents.style.marginRight = contents.style.width = "0";
			div.style.width = "1px";

			reliableMarginRightVal =
				!parseFloat( ( window.getComputedStyle( contents, null ) || {} ).marginRight );
		}

		// Support: IE8
		// Check if table cells still have offsetWidth/Height when they are set
		// to display:none and there are still other visible table cells in a
		// table row; if so, offsetWidth/Height are not reliable for use when
		// determining if an element has been hidden directly using
		// display:none (it is still safe to use offsets if a parent element is
		// hidden; don safety goggles and see bug #4512 for more information).
		div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
		contents = div.getElementsByTagName( "td" );
		contents[ 0 ].style.cssText = "margin:0;border:0;padding:0;display:none";
		reliableHiddenOffsetsVal = contents[ 0 ].offsetHeight === 0;
		if ( reliableHiddenOffsetsVal ) {
			contents[ 0 ].style.display = "";
			contents[ 1 ].style.display = "none";
			reliableHiddenOffsetsVal = contents[ 0 ].offsetHeight === 0;
		}

		body.removeChild( container );
	}

})();


// A method for quickly swapping in/out CSS properties to get correct calculations.
jQuery.swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


var
		ralpha = /alpha\([^)]*\)/i,
	ropacity = /opacity\s*=\s*([^)]*)/,

	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rnumsplit = new RegExp( "^(" + pnum + ")(.*)$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + pnum + ")", "i" ),

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];


// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = jQuery._data( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = jQuery._data( elem, "olddisplay", defaultDisplay(elem.nodeName) );
			}
		} else {
			hidden = isHidden( elem );

			if ( display && display !== "none" || !hidden ) {
				jQuery._data( elem, "olddisplay", hidden ? display : jQuery.css( elem, "display" ) );
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox && ( support.boxSizingReliable() || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": support.cssFloat ? "cssFloat" : "styleFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set. See: #7116
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifing setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {

				// Support: IE
				// Swallow errors from 'invalid' CSS values (#5509)
				try {
					style[ name ] = value;
				} catch(e) {}
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var num, val, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) && elem.offsetWidth === 0 ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

if ( !support.opacity ) {
	jQuery.cssHooks.opacity = {
		get: function( elem, computed ) {
			// IE uses filters for opacity
			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
				( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
				computed ? "1" : "";
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;

			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
			// if value === "", then remove inline opacity #12685
			if ( ( value >= 1 || value === "" ) &&
					jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
					style.removeAttribute ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there is no filter style applied in a css rule or unset inline opacity, we are done
				if ( value === "" || currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}

jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
	function( elem, computed ) {
		if ( computed ) {
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			// Work around by temporarily setting element display to inline-block
			return jQuery.swap( elem, { "display": "inline-block" },
				curCSS, [ elem, "marginRight" ] );
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});

jQuery.fn.extend({
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	}
};

jQuery.fx = Tween.prototype.init;

// Back Compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*
					// Use a string for doubling factor so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur()
				// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		} ]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// we're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = jQuery._data( elem, "fxshow" );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE does not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		display = jQuery.css( elem, "display" );

		// Test default display if display is currently "none"
		checkDisplay = display === "none" ?
			jQuery._data( elem, "olddisplay" ) || defaultDisplay( elem.nodeName ) : display;

		if ( checkDisplay === "inline" && jQuery.css( elem, "float" ) === "none" ) {

			// inline-level elements accept inline-block;
			// block-level elements need to be inline with layout
			if ( !support.inlineBlockNeedsLayout || defaultDisplay( elem.nodeName ) === "inline" ) {
				style.display = "inline-block";
			} else {
				style.zoom = 1;
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		if ( !support.shrinkWrapBlocks() ) {
			anim.always(function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			});
		}
	}

	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );

		// Any non-fx value stops us from restoring the original display value
		} else {
			display = undefined;
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = jQuery._data( elem, "fxshow", {} );
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;
			jQuery._removeData( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}

	// If this is a noop like .hide().hide(), restore an overwritten display value
	} else if ( (display === "none" ? defaultDisplay( elem.nodeName ) : display) === "inline" ) {
		style.display = display;
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

jQuery.Animation = jQuery.extend( Animation, {
	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || jQuery._data( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = jQuery._data( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = jQuery._data( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	if ( timer() ) {
		jQuery.fx.start();
	} else {
		jQuery.timers.pop();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = setTimeout( next, time );
		hooks.stop = function() {
			clearTimeout( timeout );
		};
	});
};


(function() {
	// Minified: var a,b,c,d,e
	var input, div, select, a, opt;

	// Setup
	div = document.createElement( "div" );
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
	a = div.getElementsByTagName("a")[ 0 ];

	// First batch of tests.
	select = document.createElement("select");
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName("input")[ 0 ];

	a.style.cssText = "top:1px";

	// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
	support.getSetAttribute = div.className !== "t";

	// Get the style information from getAttribute
	// (IE uses .cssText instead)
	support.style = /top/.test( a.getAttribute("style") );

	// Make sure that URLs aren't manipulated
	// (IE normalizes it by default)
	support.hrefNormalized = a.getAttribute("href") === "/a";

	// Check the default checkbox/radio value ("" on WebKit; "on" elsewhere)
	support.checkOn = !!input.value;

	// Make sure that a selected-by-default option has a working selected property.
	// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
	support.optSelected = opt.selected;

	// Tests for enctype support on a form (#6743)
	support.enctype = !!document.createElement("form").enctype;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Support: IE8 only
	// Check if we can trust getAttribute("value")
	input = document.createElement( "input" );
	input.setAttribute( "value", "" );
	support.input = input.getAttribute( "value" ) === "";

	// Check if an input maintains its value after becoming a radio
	input.value = "t";
	input.setAttribute( "type", "radio" );
	support.radioValue = input.value === "t";
})();


var rreturn = /\r/g;

jQuery.fn.extend({
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :
					// Support: IE10-11+
					// option.text throws exceptions (#14686, #14858)
					jQuery.trim( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// oldIE doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					if ( jQuery.inArray( jQuery.valHooks.option.get( option ), values ) >= 0 ) {

						// Support: IE6
						// When new option element is added to select box we need to
						// force reflow of newly added node in order to workaround delay
						// of initialization properties
						try {
							option.selected = optionSet = true;

						} catch ( _ ) {

							// Will be executed only in IE6
							option.scrollHeight;
						}

					} else {
						option.selected = false;
					}
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}

				return options;
			}
		}
	}
});

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			// Support: Webkit
			// "" is returned instead of "on" if a value isn't specified
			return elem.getAttribute("value") === null ? "on" : elem.value;
		};
	}
});




var nodeHook, boolHook,
	attrHandle = jQuery.expr.attrHandle,
	ruseDefault = /^(?:checked|selected)$/i,
	getSetAttribute = support.getSetAttribute,
	getSetInput = support.input;

jQuery.fn.extend({
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	}
});

jQuery.extend({
	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
						elem[ propName ] = false;
					// Support: IE<9
					// Also clear defaultChecked/defaultSelected (if appropriate)
					} else {
						elem[ jQuery.camelCase( "default-" + name ) ] =
							elem[ propName ] = false;
					}

				// See #9699 for explanation of this approach (setting first, then removal)
				} else {
					jQuery.attr( elem, name, "" );
				}

				elem.removeAttribute( getSetAttribute ? name : propName );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	}
});

// Hook for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
			// IE<8 needs the *property* name
			elem.setAttribute( !getSetAttribute && jQuery.propFix[ name ] || name, name );

		// Use defaultChecked and defaultSelected for oldIE
		} else {
			elem[ jQuery.camelCase( "default-" + name ) ] = elem[ name ] = true;
		}

		return name;
	}
};

// Retrieve booleans specially
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {

	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = getSetInput && getSetAttribute || !ruseDefault.test( name ) ?
		function( elem, name, isXML ) {
			var ret, handle;
			if ( !isXML ) {
				// Avoid an infinite loop by temporarily removing this function from the getter
				handle = attrHandle[ name ];
				attrHandle[ name ] = ret;
				ret = getter( elem, name, isXML ) != null ?
					name.toLowerCase() :
					null;
				attrHandle[ name ] = handle;
			}
			return ret;
		} :
		function( elem, name, isXML ) {
			if ( !isXML ) {
				return elem[ jQuery.camelCase( "default-" + name ) ] ?
					name.toLowerCase() :
					null;
			}
		};
});

// fix oldIE attroperties
if ( !getSetInput || !getSetAttribute ) {
	jQuery.attrHooks.value = {
		set: function( elem, value, name ) {
			if ( jQuery.nodeName( elem, "input" ) ) {
				// Does not return so that setAttribute is also used
				elem.defaultValue = value;
			} else {
				// Use nodeHook if defined (#1954); otherwise setAttribute is fine
				return nodeHook && nodeHook.set( elem, value, name );
			}
		}
	};
}

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

	// Use this for any attribute in IE6/7
	// This fixes almost every IE6/7 issue
	nodeHook = {
		set: function( elem, value, name ) {
			// Set the existing or create a new attribute node
			var ret = elem.getAttributeNode( name );
			if ( !ret ) {
				elem.setAttributeNode(
					(ret = elem.ownerDocument.createAttribute( name ))
				);
			}

			ret.value = value += "";

			// Break association with cloned elements by also using setAttribute (#9646)
			if ( name === "value" || value === elem.getAttribute( name ) ) {
				return value;
			}
		}
	};

	// Some attributes are constructed with empty-string values when not defined
	attrHandle.id = attrHandle.name = attrHandle.coords =
		function( elem, name, isXML ) {
			var ret;
			if ( !isXML ) {
				return (ret = elem.getAttributeNode( name )) && ret.value !== "" ?
					ret.value :
					null;
			}
		};

	// Fixing value retrieval on a button requires this module
	jQuery.valHooks.button = {
		get: function( elem, name ) {
			var ret = elem.getAttributeNode( name );
			if ( ret && ret.specified ) {
				return ret.value;
			}
		},
		set: nodeHook.set
	};

	// Set contenteditable to false on removals(#10429)
	// Setting to empty string throws an error as an invalid value
	jQuery.attrHooks.contenteditable = {
		set: function( elem, value, name ) {
			nodeHook.set( elem, value === "" ? false : value, name );
		}
	};

	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
	// This is for removals
	jQuery.each([ "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = {
			set: function( elem, value ) {
				if ( value === "" ) {
					elem.setAttribute( name, "auto" );
					return value;
				}
			}
		};
	});
}

if ( !support.style ) {
	jQuery.attrHooks.style = {
		get: function( elem ) {
			// Return undefined in the case of empty string
			// Note: IE uppercases css property names, but if we were to .toLowerCase()
			// .cssText, that would destroy case senstitivity in URL's, like in "background"
			return elem.style.cssText || undefined;
		},
		set: function( elem, value ) {
			return ( elem.style.cssText = value + "" );
		}
	};
}




var rfocusable = /^(?:input|select|textarea|button|object)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend({
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		name = jQuery.propFix[ name ] || name;
		return this.each(function() {
			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch( e ) {}
		});
	}
});

jQuery.extend({
	propFix: {
		"for": "htmlFor",
		"class": "className"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );

		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				return tabindex ?
					parseInt( tabindex, 10 ) :
					rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
						0 :
						-1;
			}
		}
	}
});

// Some attributes require a special call on IE
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !support.hrefNormalized ) {
	// href/src property should get the full normalized URL (#10299/#12915)
	jQuery.each([ "href", "src" ], function( i, name ) {
		jQuery.propHooks[ name ] = {
			get: function( elem ) {
				return elem.getAttribute( name, 4 );
			}
		};
	});
}

// Support: Safari, IE9+
// mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;

			if ( parent ) {
				parent.selectedIndex;

				// Make sure that it also works with optgroups, see #5701
				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
			return null;
		}
	};
}

jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});

// IE6/7 call enctype encoding
if ( !support.enctype ) {
	jQuery.propFix.enctype = "encoding";
}




var rclass = /[\t\r\n\f]/g;

jQuery.fn.extend({
	addClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			i = 0,
			len = this.length,
			proceed = typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			i = 0,
			len = this.length,
			proceed = arguments.length === 0 || typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = value ? jQuery.trim( cur ) : "";
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					classNames = value.match( rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( type === strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery._data( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	}
});




// Return jQuery for attributes-only inclusion


jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});


var nonce = jQuery.now();

var rquery = (/\?/);



var rvalidtokens = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;

jQuery.parseJSON = function( data ) {
	// Attempt to parse using the native JSON parser first
	if ( window.JSON && window.JSON.parse ) {
		// Support: Android 2.3
		// Workaround failure to string-cast null input
		return window.JSON.parse( data + "" );
	}

	var requireNonComma,
		depth = null,
		str = jQuery.trim( data + "" );

	// Guard against invalid (and possibly dangerous) input by ensuring that nothing remains
	// after removing valid tokens
	return str && !jQuery.trim( str.replace( rvalidtokens, function( token, comma, open, close ) {

		// Force termination if we see a misplaced comma
		if ( requireNonComma && comma ) {
			depth = 0;
		}

		// Perform no more replacements after returning to outermost depth
		if ( depth === 0 ) {
			return token;
		}

		// Commas must not follow "[", "{", or ","
		requireNonComma = open || comma;

		// Determine new depth
		// array/object open ("[" or "{"): depth += true - false (increment)
		// array/object close ("]" or "}"): depth += false - true (decrement)
		// other cases ("," or primitive): depth += true - true (numeric cast)
		depth += !close - !open;

		// Remove this token
		return "";
	}) ) ?
		( Function( "return " + str ) )() :
		jQuery.error( "Invalid JSON: " + data );
};


// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml, tmp;
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	try {
		if ( window.DOMParser ) { // Standard
			tmp = new DOMParser();
			xml = tmp.parseFromString( data, "text/xml" );
		} else { // IE
			xml = new ActiveXObject( "Microsoft.XMLDOM" );
			xml.async = "false";
			xml.loadXML( data );
		}
	} catch( e ) {
		xml = undefined;
	}
	if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	// Document location
	ajaxLocParts,
	ajaxLocation,

	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType.charAt( 0 ) === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var deep, key,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {
	var firstDataType, ct, finalDataType, type,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var // Cross-domain detection vars
			parts,
			// Loop variable
			i,
			// URL without anti-cache param
			cacheURL,
			// Response headers as string
			responseHeadersString,
			// timeout handle
			timeoutTimer,

			// To know if global events are to be dispatched
			fireGlobals,

			transport,
			// Response headers
			responseHeaders,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
});


jQuery._evalUrl = function( url ) {
	return jQuery.ajax({
		url: url,
		type: "GET",
		dataType: "script",
		async: false,
		global: false,
		"throws": true
	});
};


jQuery.fn.extend({
	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function(i) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});


jQuery.expr.filters.hidden = function( elem ) {
	// Support: Opera <= 12.12
	// Opera reports offsetWidths and offsetHeights less than zero on some elements
	return elem.offsetWidth <= 0 && elem.offsetHeight <= 0 ||
		(!support.reliableHiddenOffsets() &&
			((elem.style && elem.style.display) || jQuery.css( elem, "display" )) === "none");
};

jQuery.expr.filters.visible = function( elem ) {
	return !jQuery.expr.filters.hidden( elem );
};




var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function() {
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function() {
			var type = this.type;
			// Use .is(":disabled") so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		})
		.map(function( i, elem ) {
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});


// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject !== undefined ?
	// Support: IE6+
	function() {

		// XHR cannot access local files, always use ActiveX for that case
		return !this.isLocal &&

			// Support: IE7-8
			// oldIE XHR does not support non-RFC2616 methods (#13240)
			// See http://msdn.microsoft.com/en-us/library/ie/ms536648(v=vs.85).aspx
			// and http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9
			// Although this check for six methods instead of eight
			// since IE also does not support "trace" and "connect"
			/^(get|post|head|put|delete|options)$/i.test( this.type ) &&

			createStandardXHR() || createActiveXHR();
	} :
	// For all other browsers, use the standard XMLHttpRequest object
	createStandardXHR;

var xhrId = 0,
	xhrCallbacks = {},
	xhrSupported = jQuery.ajaxSettings.xhr();

// Support: IE<10
// Open requests must be manually aborted on unload (#5280)
if ( window.ActiveXObject ) {
	jQuery( window ).on( "unload", function() {
		for ( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]( undefined, true );
		}
	});
}

// Determine support properties
support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
xhrSupported = support.ajax = !!xhrSupported;

// Create transport if the browser can provide an xhr
if ( xhrSupported ) {

	jQuery.ajaxTransport(function( options ) {
		// Cross domain only allowed if supported through XMLHttpRequest
		if ( !options.crossDomain || support.cors ) {

			var callback;

			return {
				send: function( headers, complete ) {
					var i,
						xhr = options.xhr(),
						id = ++xhrId;

					// Open the socket
					xhr.open( options.type, options.url, options.async, options.username, options.password );

					// Apply custom fields if provided
					if ( options.xhrFields ) {
						for ( i in options.xhrFields ) {
							xhr[ i ] = options.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( options.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( options.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !options.crossDomain && !headers["X-Requested-With"] ) {
						headers["X-Requested-With"] = "XMLHttpRequest";
					}

					// Set headers
					for ( i in headers ) {
						// Support: IE<9
						// IE's ActiveXObject throws a 'Type Mismatch' exception when setting
						// request header to a null-value.
						//
						// To keep consistent with other XHR implementations, cast the value
						// to string and ignore `undefined`.
						if ( headers[ i ] !== undefined ) {
							xhr.setRequestHeader( i, headers[ i ] + "" );
						}
					}

					// Do send the request
					// This may raise an exception which is actually
					// handled in jQuery.ajax (so no try/catch here)
					xhr.send( ( options.hasContent && options.data ) || null );

					// Listener
					callback = function( _, isAbort ) {
						var status, statusText, responses;

						// Was never called and is aborted or complete
						if ( callback && ( isAbort || xhr.readyState === 4 ) ) {
							// Clean up
							delete xhrCallbacks[ id ];
							callback = undefined;
							xhr.onreadystatechange = jQuery.noop;

							// Abort manually if needed
							if ( isAbort ) {
								if ( xhr.readyState !== 4 ) {
									xhr.abort();
								}
							} else {
								responses = {};
								status = xhr.status;

								// Support: IE<10
								// Accessing binary-data responseText throws an exception
								// (#11426)
								if ( typeof xhr.responseText === "string" ) {
									responses.text = xhr.responseText;
								}

								// Firefox throws an exception when accessing
								// statusText for faulty cross-domain requests
								try {
									statusText = xhr.statusText;
								} catch( e ) {
									// We normalize with Webkit giving an empty statusText
									statusText = "";
								}

								// Filter status for non standard behaviors

								// If the request is local and we have data: assume a success
								// (success with no data won't get notified, that's the best we
								// can do given current implementations)
								if ( !status && options.isLocal && !options.crossDomain ) {
									status = responses.text ? 200 : 404;
								// IE - #1450: sometimes returns 1223 when it should be 204
								} else if ( status === 1223 ) {
									status = 204;
								}
							}
						}

						// Call complete if needed
						if ( responses ) {
							complete( status, statusText, responses, xhr.getAllResponseHeaders() );
						}
					};

					if ( !options.async ) {
						// if we're in sync mode we fire the callback
						callback();
					} else if ( xhr.readyState === 4 ) {
						// (IE6 & IE7) if it's in cache and has been
						// retrieved directly we need to fire the callback
						setTimeout( callback );
					} else {
						// Add to the list of active xhr callbacks
						xhr.onreadystatechange = xhrCallbacks[ id ] = callback;
					}
				},

				abort: function() {
					if ( callback ) {
						callback( undefined, true );
					}
				}
			};
		}
	});
}

// Functions to create xhrs
function createStandardXHR() {
	try {
		return new window.XMLHttpRequest();
	} catch( e ) {}
}

function createActiveXHR() {
	try {
		return new window.ActiveXObject( "Microsoft.XMLHTTP" );
	} catch( e ) {}
}




// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
		s.global = false;
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function(s) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {

		var script,
			head = document.head || jQuery("head")[0] || document.documentElement;

		return {

			send: function( _, callback ) {

				script = document.createElement("script");

				script.async = true;

				if ( s.scriptCharset ) {
					script.charset = s.scriptCharset;
				}

				script.src = s.url;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function( _, isAbort ) {

					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( script.parentNode ) {
							script.parentNode.removeChild( script );
						}

						// Dereference the script
						script = null;

						// Callback if not abort
						if ( !isAbort ) {
							callback( 200, "success" );
						}
					}
				};

				// Circumvent IE6 bugs with base elements (#2709 and #4378) by prepending
				// Use native DOM manipulation to avoid our domManip AJAX trickery
				head.insertBefore( script, head.firstChild );
			},

			abort: function() {
				if ( script ) {
					script.onload( undefined, true );
				}
			}
		};
	}
});




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});




// data: string of html
// context (optional): If specified, the fragment will be created in this context, defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}
	context = context || document;

	var parsed = rsingleTag.exec( data ),
		scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[1] ) ];
	}

	parsed = jQuery.buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


// Keep a copy of the old load method
var _load = jQuery.fn.load;

/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, response, type,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = jQuery.trim( url.slice( off, url.length ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};




jQuery.expr.filters.animated = function( elem ) {
	return jQuery.grep(jQuery.timers, function( fn ) {
		return elem === fn.elem;
	}).length;
};





var docElem = window.document.documentElement;

/**
 * Gets a window from an element
 */
function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}

jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			jQuery.inArray("auto", [ curCSSTop, curCSSLeft ] ) > -1;

		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend({
	offset: function( options ) {
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each(function( i ) {
					jQuery.offset.setOffset( this, options, i );
				});
		}

		var docElem, win,
			box = { top: 0, left: 0 },
			elem = this[ 0 ],
			doc = elem && elem.ownerDocument;

		if ( !doc ) {
			return;
		}

		docElem = doc.documentElement;

		// Make sure it's not a disconnected DOM node
		if ( !jQuery.contains( docElem, elem ) ) {
			return box;
		}

		// If we don't have gBCR, just use 0,0 rather than error
		// BlackBerry 5, iOS 3 (original iPhone)
		if ( typeof elem.getBoundingClientRect !== strundefined ) {
			box = elem.getBoundingClientRect();
		}
		win = getWindow( doc );
		return {
			top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
			left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
		};
	},

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			parentOffset = { top: 0, left: 0 },
			elem = this[ 0 ];

		// fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// we assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();
		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top  += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		return {
			top:  offset.top  - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true)
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position" ) === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent || docElem;
		});
	}
});

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = /Y/.test( prop );

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? (prop in win) ? win[ prop ] :
					win.document.documentElement[ method ] :
					elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : jQuery( win ).scrollLeft(),
					top ? val : jQuery( win ).scrollTop()
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// getComputedStyle returns percent when specified for top/left/bottom/right
// rather than make the css module depend on the offset module, we just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );
				// if curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
});


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
					// unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});


// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	});
}




var
	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in
// AMD (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( typeof noGlobal === strundefined ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;

}));

},{}]},{},[1])