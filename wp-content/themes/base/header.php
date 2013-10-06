<!DOCTYPE html>
<html>
    <head>       
        <title><?php bloginfo('name'); ?> / <?php get_page_subtitle(); ?></title>
        <meta charset="utf-8">  
        <meta name = "viewport" content="width=device-width">
        <?php echo get_page_metatags(); ?>
        <link href='http://fonts.googleapis.com/css?family=Nunito:400,300,700' rel='stylesheet' type='text/css'>
        <link rel="stylesheet" href="<?php bloginfo('stylesheet_url') ?>" />
       <!--  <link rel="stylesheet" href="http://code.jquery.com/mobile/1.3.2/jquery.mobile-1.3.2.min.css" /> -->
        <link rel="stylesheet/less" type="text/css" href="<?php bloginfo('template_url') ?>/style.less" />
        <script type="text/javascript" src="<?php bloginfo('template_url') ?>/js/modernizr.js" ></script>
        <script type="text/javascript">
            less = {
                env: "production", // or "production"
                async: false,       // load imports async
                fileAsync: false,   // load imports async when in a page under
                                    // a file protocol
                poll: 500,         // when in watch mode, time in ms between polls
                functions: {},      // user functions, keyed by name
                dumpLineNumbers: "comments", // or "mediaQuery" or "all"
                relativeUrls: false,// whether to adjust url's to be relative
                                    // if false, url's are already relative to the
                                    // entry less file
            };
        </script>
        <script type="text/javascript" src="<?php bloginfo('template_url') ?>/js/less.js" ></script>
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