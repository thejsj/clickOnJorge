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

	this.win = function(){
		var sine1 = T("sin", {freq:1200, mul:0.4});
		var sine2 = T("sin", {freq:600, mul:0.99});
		var r = 1200;
		this.playBasicSound(sine1, sine2, r);
	};

	this.playBasicSound = function(sine1, sine2, r){
		this.loseSounds = T("perc", {r:r}, sine1, sine2).on("ended", function() {
		  this.pause();
		});
		this.loseSounds.bang().play();
	}

}