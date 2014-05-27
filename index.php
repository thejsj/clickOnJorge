<?php if (is_user_logged_in()) { 
	header( 'Location: ' . get_page_link(691)); ?>
	<!-- Backup -->
	<script>location.href='<?php echo get_page_link(691); ?>'</script>
	<?php
} else { 
	header( 'Location: ' . get_page_link(693)); ?>
	<!-- Backup -->
	<script>location.href='<?php echo get_page_link(693); ?>'</script>
<?php } ?>