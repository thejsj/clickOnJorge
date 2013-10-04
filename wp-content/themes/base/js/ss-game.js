var ShareShareGameInstance= function() {
    "use strict";
    // Game On/Off
    this.keep_going = true;
    this.time_updating = true;
    // Difficulty Settings
    this.speed = 20;
    this.times_changed = 0;
    // Played...
    this.clicks = 0;
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
    this.time_elapsed = 0; 

    this.startNewGame = function () {
        this.keep_going = true;
        this.time_updating = true;
        this.times_changed = 0;
        this.clicks = 0;
        this.start_time = (new Date).getTime();
        this.setTopTime();
    };

    this.increaseClicks = function (){
        this.clicks++; 
        return true;
    }
    this.setTopTime = function () {
        var that = this;
        that.time_elapsed = (new Date).getTime() - that.start_time;
    }
    this.resetTimeCounter = function(){
        this.start_time = (new Date).getTime();
        this.setTopTime();
    };
    this.calculateScore = function () {
        if(this.times_changed < 1){
            this.times_changed = 1;
        }
        var score = Math.floor(this.items * this.speed - (this.time_elapsed / 6)) - (this.clicks * 5) + 50;
        score = score;
        if(score === NaN){
            score = 0;
        }
        if(score <= 0){
            return false;
        }
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
    this.time_interval = function(){
        return this.min_time_interval + (((this.max_time_interval - this.min_time_interval)/this.max_speed) * (this.max_speed - this.speed));
    }
}
