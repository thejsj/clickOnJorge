<!DOCTYPE html>
<html>
    <head>       
        <title><?php bloginfo('name'); ?> / <?php get_page_subtitle(); ?></title>
        <meta charset="utf-8">  
        <meta name = "viewport" content="width=device-width">
        <?php echo get_page_metatags(); ?>
        <link href='http://fonts.googleapis.com/css?family=Nunito:400,300,700' rel='stylesheet' type='text/css'>
        <link rel="stylesheet" href="<?php bloginfo('stylesheet_url') ?>" />
        <link rel="stylesheet" type="text/css" href="<?php bloginfo('template_url') ?>/style-less-compiled.css" />
        <script type="text/javascript" src="<?php bloginfo('template_url') ?>/js/modernizr.js" ></script>
        <?php
        /* Always have wp_head() just before the closing </head>
        * tag of your theme, or you will break many plugins, which
        * generally use this hook to add elements to <head> such
        * as styles, scripts, and meta tags.
        */
        wp_head(); ?>
        <link rel="icon" type="image/png" href="<?php bloginfo('template_url') ?>/img/clickjorge/favicon.png" />
    </head>
    <body <?php body_class($class); ?>>    