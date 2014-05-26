
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
						<?php try { ?>
						<a href="<?php echo get_permalink(2037); ?>" title="FAQs" class="icon-layers-alt">
							<span class="text">FAQs</span>
						</a>
						<?php } catch (Exception $e) { try { ?>
						<a href="<?php echo get_permalink(2045); ?>" title="FAQs" class="icon-layers-alt">
							<span class="text">FAQs</span>
						</a>
						<?php } catch (Exception $e) {}  } ?>
						<a href="<?php echo wp_logout_url( home_url() ); ?>" title="Logout" class="icon-user-3">
							<span class="text">Logout</span>
						</a>
					</div>
				</div>

				<div class="line-container">
					<h1>
						<a href="<?php bloginfo('url'); ?>">
							<img src="<?php bloginfo('template_url'); ?>/dist/img/clickjorge/me_with_clicks_50.png" alt="<?php bloginfo('name'); ?>"/>
						</a>
					</h1>
				</div>
				<div class="left-top-container">
					<div id="game_speed" class="game_stat"><span id="stat_speed" class="stat_num">0</span>Speed</div>
					<div id="game_items" class="game_stat"><span id="stat_items" class="stat_num">0</span>Items</div>
					<div id="game_time" class="game_stat"><span id="stat_time" class="stat_num">0</span>Time Left</div>
					<div id="game_clicks" class="game_stat"><span id="stat_clicks" class="stat_num">0</span>Clicks</div>
					<div id="game_score" class="game_stat"><span id="stat_score" class="stat_num">0</span>Score</div>
				</div>
			</div><!-- Top Menu -->
		</div><!-- End top Menu container -->
		<div id="button-container">
			<canvas id="main-canvas"></canvas>
			<img id="cj-icon" src="<?php bloginfo('template_url'); ?>/dist/img/clickjorge/me_100.png" style="display: none;" />
			<img id="me-1" src="<?php bloginfo('template_url'); ?>/dist/img/clickjorge/me_1.png" style="display: none;" />
			<img id="me-2" src="<?php bloginfo('template_url'); ?>/dist/img/clickjorge/me_2.png" style="display: none;" />
			<img id="me-3" src="<?php bloginfo('template_url'); ?>/dist/img/clickjorge/me_3.png" style="display: none;" />
			<img id="me-4" src="<?php bloginfo('template_url'); ?>/dist/img/clickjorge/me_4.png" style="display: none;" />
			<img id="me-5" src="<?php bloginfo('template_url'); ?>/dist/img/clickjorge/me_5.png" style="display: none;" />
			<img id="1-icon" src="<?php bloginfo('template_url'); ?>/dist/img/1.png" style="display: none;" />
			<img id="2-icon" src="<?php bloginfo('template_url'); ?>/dist/img/2.png" style="display: none;" />
			<img id="3-icon" src="<?php bloginfo('template_url'); ?>/dist/img/3.png" style="display: none;" />
		</div>
		<div id="instructions-dialog" title="Intstructions" class="modal">
			<p>In <strong>20 seconds</strong> attempt to <strong>click</strong> on the <strong>black</strong> squares with my face as many times as you can.</p>
			<img id="instructions_image" src="<?php bloginfo('template_url'); ?>/dist/img/instructions.png" alt="Click On Jorge's Face"/>
			<h4>Speed: <span id="stat_speed_modal"></span></h4>
			<div id="speed-slider"></div>
			<!-- <input type="range" name="slider-1" id="slider-1" min="0" max="100" value="50"> -->
			<h4>Blocks: <span id="stat_items_modal"></span></h4>
			<div id="items-slider"></div>
		</div>
		<div id="winning-dialog" title="Time's Up!" class="modal" data-high-scores-url="<?php echo get_permalink( 198 ) ?>">
			<p>You had <span id="final_jorge_clicks_modal">0</span> jorge clicks and finished with a score of <span id="final_score_modal">0</span> points!</p>
			<a href="<?php echo get_permalink( 198 ) ?>" id="high_score_modal" class="high_score_modal"></a>
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