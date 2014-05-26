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
