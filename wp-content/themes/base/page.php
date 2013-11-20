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