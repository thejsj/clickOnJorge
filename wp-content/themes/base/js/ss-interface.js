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
		jQuery("#final_score_modal").text(finalScore);
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