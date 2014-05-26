<?php get_header(); ?>
        
       	<a href="<?php bloginfo('url'); ?>">
       		<h1 id="header-logo"><?php bloginfo('name'); ?></h1>
       	</a>
        <div id="primary" class="site-content single">
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
							<table class="high-scores-table">
								<?php $this_score = getSingleScore(get_the_id())?>
								<tr>
									<td>Name</td>
									<td><?php echo $this_score->user_link; ?></td>
								</tr>
								<tr>
									<td>Rank</td>
									<td><?php echo $this_score->rank + 1; ?></td>
								</tr>
								<tr>
									<td>Score</td>
									<td><?php echo number_format($this_score->score); ?></td>
								</tr>
								<tr>
									<td>Jorge Clicks</td>
									<td><?php echo $this_score->jorgeClicks; ?></td>
								</tr>
								<tr>
									<td>Clicks</td>
									<td><?php echo $this_score->clicks; ?></td>
								</tr>
								<tr>
									<td>Speed</td>
									<td><?php echo $this_score->speed; ?></td>
								</tr>
								<tr>
									<td>Blocks</td>
									<td><?php echo $this_score->blocks; ?></td>
								</tr>
							</table>
							<?php wp_link_pages( array( 'before' => '<div class="page-links">' . __( 'Pages:', 'twentytwelve' ), 'after' => '</div>' ) ); ?>
							<div style="width: 300px; margin: 0px auto;">
								<p style="text-align: center; font-weight: bold;">Want to beat this score?</p>
								<a href="<?php echo get_page_link(693); ?>"><button>Play Click On Jorge</button></a>
							</div>
						</div><!-- .entry-content -->
						<footer class="entry-meta">
							<p><a href="<?php echo get_permalink(2037); ?>" title="FAQs">
								<span class="text">FAQs</span>
							</a></p>
							<p>A project by <a href="http://thejsj.com">theJSJ</a></p>
						</footer><!-- .entry-meta -->
					</article><!-- #post -->
				<?php endwhile; // end of the loop. ?>

			</div><!-- #content -->
		</div><!-- #primary -->
<?php get_footer(); ?>