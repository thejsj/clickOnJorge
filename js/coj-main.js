/* TODO

+ Browser Testing. 

	- IE10?

+ Mobile: Doesn't set canvas to correct height

+ Mobile: On Click Doesn't Work... 

+ Mobile: Not correct number of blocks

DONE:

- Regenearte Blocks Width and Height on New Game

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