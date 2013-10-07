<div class="top not_signed_in">
	<div class="wrapper">
		<!-- <img src="<?php bloginfo('template_url'); ?>/img/ss-logo-500.png" alt="The Logo"/> -->
		<div id="main_logo">
			<img src="<?php bloginfo('template_url'); ?>/img/clickjorge/me_with_clicks.png" alt="The Logo"/>
			<?php for($i = 0; $i < 15; $i++): 

				$origin = rand(-20,20);// -webkit-transform-origin: <?php echo $origin . "px " . $origin . "px"
				?>
				<div 
					class="icon-cursor color-<?php echo rand(1, 3); ?> animation-<?php echo rand(1, 5); ?>"
					style=" font-size: <?php echo rand(12,36); ?>px">
				</div>
			<?php endfor; ?>			
		</div>
		<h1><?php bloginfo('name'); ?></h1>
		<p class="description"><?php bloginfo('description'); ?></p>
		
		<!-- href="http://thejsj.api.oneall.com/socialize/redirect.html?provider_connection_token=b83cd64f-07d5-4e11-b0f3-b5617927ea40" -->
		<span id="facebook_link">
			<span class="text">Login With Facebook</span>
			<a href="http://clickonjorge.com/wp-login.php?loginFacebook=1&redirect=http://clickonjorge.com/game" 
			onclick="window.location = 'http://clickonjorge.com/wp-login.php?loginFacebook=1&redirect=http://clickonjorge.com/game; return false;">
				<div class="new-fb-btn new-fb-4 new-fb-default-anim"><div class="new-fb-4-1"><div class="new-fb-4-1-1">CONNECT</div></div></div>
			</a>
		</span>
		<p>Yeah, sorry but you'll need facebook for this!</p>

		<?php $highest_score = get_high_scores(true); ?>
		<br/>
		<br/>
		<h3>Top Score</h3>
		<p>The current top score and supreme leader of Click On Jorge is:</p>
		<h4><?php echo $highest_score->user_link; ?></h4>
		<p>with <?php echo number_format($highest_score->score); ?> points.</p>
		<p><a href="<?php echo get_permalink(198); ?>" title="FAQs">
			<span class="text">See High Scores</span>
		</a></p>


	</div>
</div>
