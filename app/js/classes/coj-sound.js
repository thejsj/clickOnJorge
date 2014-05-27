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

console.log(GameSounds);

module.exports = GameSounds; 