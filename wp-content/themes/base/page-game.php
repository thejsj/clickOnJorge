<?php
/*
Template Name: Game
*/
?>
<?php if(!is_user_logged_in()): ?>
	<?php header('Location: ' . get_page_link(693) ); ?>
	<!-- Backup -->
	<script>location.href='<?php echo get_page_link(693); ?>'</script>
<?php endif; ?>
<?php get_header(); ?>
    <?php include("signed-in.php"); ?>
<?php get_footer(); ?>