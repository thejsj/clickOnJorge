
		<div id="top_menu_container" class="top_menu_container">
			<div class="top_menu">
				<div class="right-top-container">
					<a href="#" class="mobile-menu icon-list-2"></a>
					<div id="menu-container">
						<a href="#" id="restart-game" title="Restart Game" class="icon-refresh">
							<span class="text">Restart</span>
						</a>
						<a href="<?php echo get_permalink( 198 ) ?>" id="leaderboard-link" title="High Scores" class="icon-bars">
							<span class="text">High Scores</span>
						</a>
						<a href="<?php echo wp_logout_url( home_url() ); ?>" title="Logout" class="icon-user-3">
							<span class="text">Logout</span>
						</a>
					</div>
				</div>

				<div class="line-container">
					<h1>
						<a href="<?php bloginfo('url'); ?>">
							<img src="<?php bloginfo('template_url'); ?>/img/clickjorge/me_with_clicks_50.png" alt="<?php bloginfo('name'); ?>"/>
						</a>
					</h1>
				</div>
				<div class="left-top-container">
					<div id="game_speed" class="game_stat"><span id="stat_speed" class="stat_num">0</span>Speed</div>
					<div id="game_items" class="game_stat"><span id="stat_items" class="stat_num">0</span>Items</div>
					<div id="game_time" class="game_stat"><span id="stat_time" class="stat_num">0</span>Time</div>
					<div id="game_clicks" class="game_stat"><span id="stat_clicks" class="stat_num">0</span>Clicks</div>
					<div id="game_score" class="game_stat"><span id="stat_score" class="stat_num">0</span>Score</div>
				</div>
			</div><!-- Top Menu -->
		</div><!-- End top Menu container -->
		<div id="button-container">
			<canvas id="main-canvas"></canvas>
			<img id="cj-icon" src="<?php bloginfo('template_url'); ?>/img/clickjorge/me_100.png" style="display: none;" />
			<img id="me-1" src="<?php bloginfo('template_url'); ?>/img/clickjorge/me_1.png" style="display: none;" />
			<img id="me-2" src="<?php bloginfo('template_url'); ?>/img/clickjorge/me_2.png" style="display: none;" />
			<img id="me-3" src="<?php bloginfo('template_url'); ?>/img/clickjorge/me_3.png" style="display: none;" />
			<img id="me-4" src="<?php bloginfo('template_url'); ?>/img/clickjorge/me_4.png" style="display: none;" />
			<img id="me-5" src="<?php bloginfo('template_url'); ?>/img/clickjorge/me_5.png" style="display: none;" />
			<!-- <img id="s-icon" src="<?php bloginfo('template_url'); ?>/img/ss-logo/ss-icon.png" style="display: none;" /> -->
			<img id="1-icon" src="<?php bloginfo('template_url'); ?>/img/1.png" style="display: none;" />
			<img id="2-icon" src="<?php bloginfo('template_url'); ?>/img/2.png" style="display: none;" />
			<img id="3-icon" src="<?php bloginfo('template_url'); ?>/img/3.png" style="display: none;" />
		</div>
		<div id="instructions-dialog" title="Intstructions" class="modal">
			<p>Instructions: Try to click on the Green Share button! If you win, you get to share that you won!</p>
			<h4>Speed: <span id="stat_speed_modal"></span></h4>
			<div id="speed-slider"></div>
			<h4>Blocks: <span id="stat_items_modal"></span></h4>
			<div id="items-slider"></div>
		</div>
		<div id="winning-dialog" title="You Win!" class="modal" data-high-scores-url="<?php echo get_permalink( 198 ) ?>">
			<p>Congrajulations! You Win! Your score will pop up any minute now!</p>
		</div>
		<div id="losing-dialog" title="You Lost" class="modal" data-high-scores-url="<?php echo get_permalink( 198 ) ?>">
			<p>I'm sorry, but you suck! Your score is now 0. You lost. Pretty simple, right?</p>
		</div>
		<noscript>
			<?php showSiteRequirementNotMetMessage(); ?>
		</noscript>
		<div id="site-unavailable-message">
			<?php showSiteRequirementNotMetMessage(); ?>
		</div>