<?php
/*
Template Name: High Scores Page
*/
?>
<?php get_header(); ?>
        
       	<a href="<?php bloginfo('url'); ?>">
       		<h1 id="header-logo">Share Share</h1>
       	</a>
        <div id="primary" class="site-content">
			<div id="content" role="main">

				<?php while ( have_posts() ) : the_post(); ?>
					<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
						<header class="entry-header">
							<?php if ( ! is_page_template( 'page-templates/front-page.php' ) ) : ?>
							<?php the_post_thumbnail(); ?>
							<?php endif; ?>
							<h1 class="entry-title"><?php the_title(); ?></h1>
						</header>

						<div class="entry-content">
							<?php the_content(); ?>
							<!-- Display High Scores -->
							<?php $high_scores = get_high_scores(); ?>
							<?php if(count($high_scores)) { ?>
								<table class="high-scores-table">
								<tr>
									<th>Rank</th>
									<th>Name</th>
									<th>Score</th>
									<th>Total Time</th>
									<th>Speed</th>
									<th>Blocks</th>
									<th>Clicks</th>
								</tr>
								<?php for($i = 1; $i < count($high_scores); $i++){ ?>
									<tr>
										<td><?php echo $i; ?></td>
										<td><?php echo $high_scores[$i]->user_link; ?></td>
										<td><?php echo number_format($high_scores[$i]->score); ?></td>
										<td><?php echo $high_scores[$i]->time; ?> ms</td>
										<td><?php echo $high_scores[$i]->speed; ?></td>
										<td><?php echo $high_scores[$i]->blocks; ?></td>
										<td><?php echo $high_scores[$i]->clicks; ?></td>
									</tr>
								<?php } ?>
								</table>
							<?php } else { ?>
								<div class="notice">
									<p>Sorry, no scores could be retrieved at the moment.</p>
								</div>
							<?php } ?>
							<?php wp_link_pages( array( 'before' => '<div class="page-links">' . __( 'Pages:', 'twentytwelve' ), 'after' => '</div>' ) ); ?>
						</div><!-- .entry-content -->
						<footer class="entry-meta">
							<p>A project by <a href="http://thejsj.com">theJSJ</a></p>
						</footer><!-- .entry-meta -->
					</article><!-- #post -->
				<?php endwhile; // end of the loop. ?>

			</div><!-- #content -->
		</div><!-- #primary -->
<?php get_footer(); ?>