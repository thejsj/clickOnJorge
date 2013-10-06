<?php

add_filter( 'show_admin_bar', '__return_false' );


if ( function_exists('register_sidebar') ){
    register_sidebar(array(
        'name' => 'Login Area',
        'id'=> 'login_area',
        'before_widget' => '<li id="%1$s" class="widget %2$s">',
        'after_widget' => '</li>',
        'before_title' => '<h5 class="widgettitle">',
        'after_title' => '</h5>',
    ));
}

/*

Notice: wp_enqueue_script was called incorrectly. Scripts and styles should not be registered or enqueued until the wp_enqueue_scripts, admin_enqueue_scripts, or login_enqueue_scripts hooks. Please see Debugging in WordPress for more information. (This message was added in version 3.3.) in /home/thejsj/public_html/2013/shareshare/wp-includes/functions.php on line 3012

Notice: Undefined index: action in /home/thejsj/public_html/2013/shareshare/wp-content/themes/base/functions.php on line 22

Notice: Undefined index: action in /home/thejsj/public_html/2013/shareshare/wp-content/themes/base/functions.php on line 25

*/

// jQuery
wp_enqueue_script( 'jquery-ui-dialog',  array( 'jquery' ) );
wp_enqueue_script( 'jquery-ui-slider',  array( 'jquery' ) );
wp_enqueue_script( 'jquery-touch',  get_bloginfo('template_url') . '/js/jquery-touchpunch.min.js', array('jquery', 'jquery-ui-slider', 'jquery-ui-dialog'), false,true);

// embed the javascript file that makes the AJAX request
wp_enqueue_script( 'timbre', get_bloginfo('template_url') . '/js/timbre.js', array('jquery'), false,true);
wp_enqueue_script( 'canvas-class', get_bloginfo('template_url') . '/js/ss-canvas.js', array('jquery'), false,true);
wp_enqueue_script( 'interface-class', get_bloginfo('template_url') . '/js/ss-interface.js', array( 'jquery','canvas-class'), false,true);
wp_enqueue_script( 'game-class', get_bloginfo('template_url') . '/js/ss-game.js', array('jquery','canvas-class','interface-class'),false, true);
wp_enqueue_script( 'sound-class', get_bloginfo('template_url') . '/js/ss-sound.js', array('timbre'), false, true);
wp_enqueue_script( 'main', get_bloginfo('template_url') . '/js/ss-main.js', array('jquery','game-class','canvas-class','interface-class', 'sound-class'), false,true);
 
// declare the URL to the file that handles the AJAX request (wp-admin/admin-ajax.php)
wp_localize_script( 'main', 'MyAjax', array( 'ajaxurl' => admin_url( 'admin-ajax.php' ) ) );

// this hook is fired if the current viewer is not logged in
if(isset($_REQUEST) && array_key_exists('action', $_REQUEST)){
    do_action( 'wp_ajax_nopriv_' . $_REQUEST['action'] );
}
 
// if logged in:
if(isset($_POST) && array_key_exists('action', $_POST)){
    do_action( 'wp_ajax_' . $_POST['action'] );
}


// if both logged in and not logged in users can send this AJAX request,
// add both of these actions, otherwise add only the appropriate one
add_action( 'wp_ajax_nopriv_myajax-submit', 'myajax_submit' );
add_action( 'wp_ajax_myajax-submit', 'myajax_submit' );
 
function myajax_submit() {
        header( "Content-Type: application/json" );

        // get the submitted parameters
        $blocks = $_POST['current_blocks'];
        $speed = $_POST['current_speed'];
        $score = $_POST['current_score'];
        $clicks = $_POST['current_clicks'];
        $jorgeClicks = $_POST['current_jorgeClicks'];

        // generate the response
        $new_post_id  = generate_new_post($blocks, $speed, $score, $clicks, $jorgeClicks);
        $new_post_url = get_permalink($new_post_id);
        $madeHighScore = did_post_make_high_core($new_post_id);
        $response = json_encode(array( 
            'success' => true, 
            'blocks' => $blocks, 
            'speed' => $speed,
            'score' => $score,
            'clicks' => $clicks,
            'jorgeClicks' => $jorgeClicks,
            'made_high_score' => $madeHighScore,
            'new_post_id' => $new_post_id,
            'new_post_url' => $new_post_url,
            ));
 
        // response output
        
        echo $response;
 
        // IMPORTANT: don't forget to "exit"
        exit;
}

function get_page_subtitle(){
    global $post;
    if(is_single()) {
        $title = get_the_title($post->ID);
    }
    else {
        $title = get_bloginfo('$description');
    }
    echo $title;
}

function get_page_metatags(){    
    global $post;
    if(!is_single()) {
        $title = get_bloginfo('name');
        $description = get_bloginfo('$description');
        $url = get_bloginfo('url');
        
    }
    else {
        $title = get_the_title($post->ID);
        $description = get_the_excerpt($post->ID);
        $url = get_permalink($post->ID);
    }

    $img = get_bloginfo('template_url') . "/img/clickjorge/me_with_clickc_share_154.png";

    $string = <<<END
        <!-- Regular meta tags -->
        <meta name="description" content="$description">
        <meta property="title" content="$title" />
        <link rel="image_src" href="$img"/>

        <!-- Facebook Meta Tags -->    
        <meta property="og:title" content="$title" />
        <meta property="og:image" content="$img"/>   
        <meta name="og:description" content="$description">
        <meta property="url" content="$url" />
        <meta property="fb:app_id " content="215782448578399" />

        <!-- for Twitter -->          
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="$title" />
        <meta name="twitter:description" content="$description" />
        <meta name="twitter:image" content="$img"/>
        <meta name="twitter:url" content="$url"/>
END;
    return $string;
}

function generate_new_post($blocks, $speed, $score, $clicks, $jorgeClicks){
    global $post; 

    $current_user = wp_get_current_user();
    $current_user_id = $current_user->ID;

    $post_title = $current_user->user_firstname . " " . $current_user->user_lastname . " scored " . $score . " points on Click On Jorge!";
    $post_content = $current_user->user_firstname . " " . $current_user->user_lastname . " scored " . $score . " points on <a href='" . get_bloginfo('url') . "'>Click On Jorge</a> with " . $blocks . " boxes and a speed of  " . $speed . ". How about you try to beat this score!";
    
    $post = array(
        //'ID'             => [ <post id> ], //Are you updating an existing post?
        //'menu_order'     => [ <order> ], //If new post is a page, it sets the order in which it should appear in the tabs.
        'comment_status' => 'closed', // 'closed' means no comments.
        'ping_status'    => 'open', // 'closed' means pingbacks or trackbacks turned off
        //'pinged'         => [ ? ], //?
        'post_author'    => $current_user_id, //The user ID number of the author.
        //'post_category'  => [ array(<category id>, <...>) ], //post_category no longer exists, try wp_set_post_terms() for setting a post's categories
        'post_content'   => $post_content, //The full text of the post.
        //'post_date'      => [ Y-m-d H:i:s ], //The time post was made.
        //'post_date_gmt'  => [ Y-m-d H:i:s ], //The time post was made, in GMT.
        'post_excerpt'   => $post_content, //For all your post excerpt needs.
        //'post_name'      => [ <the name> ], // The name (slug) for your post
        //'post_parent'    => [ <post ID> ], //Sets the parent of the new post.
        //'post_password'  => [ ? ], //password for post?
        'post_status'    => 'publish', //Set the status of the new post.
        'post_title'     => $post_title, //The title of your post.
        'post_type'      => 'post'//You may want to insert a regular post, page, link, a menu item or some custom post type
        //'tags_input'     => [ '<tag>, <tag>, <...>' ], //For tags.
        //'to_ping'        => [ ? ], //?
        //'tax_input'      => [ array( 'taxonomy_name' => array( 'term', 'term2', 'term3' ) ) ] // support for custom taxonomies. 
    );

    $post_id = wp_insert_post( $post, $wp_error );
    $unique = true;
    // Add Score
    add_post_meta($post_id, "score", $score, $unique);
    // Adde Jorge Clicks
    add_post_meta($post_id, "jorgeClicks", $jorgeClicks, $unique);
    // Add Speed
    add_post_meta($post_id, "speed", $speed, $unique);
    // Add Number of Items
    add_post_meta($post_id, "blocks", $blocks, $unique);
    // Add Clicks
    add_post_meta($post_id, "clicks", $clicks, $unique);

    // Set Categories
    //wp_set_post_terms();

    return $post_id;

}

function show_user_name(){
    $current_user = wp_get_current_user();
    return $current_user->user_firstname;
}

class MyException extends Exception { }

function did_post_make_high_core($new_post_id){

    $args = array(
        'posts_per_page'   => 100,
        'offset'           => 0,
        'post_type'        => 'post',
        'post_status'      => 'publish',
        'suppress_filters' => true );

    $all_posts = get_posts( $args );

    $all_scores = array();
    for($i = 0; $i < count($all_posts); $i++){
        $this_post = (object) array(); 
        $this_post->ID = $all_posts[$i]->ID;
        $this_post->score = floatval(get_post_meta( $this_post->ID, "score", true ));
        array_push($all_scores, $this_post);
    }
    //throw new MyException(var_dump($all_posts));
    function sort_objects_by_total($a, $b) {
        if($a->score == $b->score){ return 0 ; }
        return ($a->score < $b->score) ? -1 : 1;
    }

    usort($all_scores, 'sort_objects_by_total');
    $all_scores = array_reverse($all_scores);
    //
    for($i = 0; $i < count($all_scores); $i++){
        if($all_scores[$i]->ID == $new_post_id){
           // throw new MyException(count($all_scores));
            return $i;
        }
    }
}

function get_high_scores(){
    $args = array(
        'posts_per_page'   => 50,
        'offset'           => 0,
        'post_type'        => 'post',
        'post_status'      => 'publish',
        'suppress_filters' => true );

    $all_posts = get_posts( $args );
    $all_scores = array();
    for($i = 0; $i < count($all_posts); $i++){
        $this_post = (object) array(); 
        $this_post->ID = $all_posts[$i]->ID;

        $this_post->user = $all_posts[$i]->post_author;
        $this_post->user_link = getUserLink($this_post->user);
        $this_post->score = floatval(get_post_meta( $this_post->ID, "score", true ));
        $this_post->jorgeClicks = floatval(get_post_meta( $this_post->ID, "jorgeClicks", true ));
        $this_post->speed = floatval(get_post_meta( $this_post->ID, "speed", true ));
        $this_post->blocks = floatval(get_post_meta( $this_post->ID, "blocks", true ));
        $this_post->clicks = floatval(get_post_meta( $this_post->ID, "clicks", true ));

        array_push($all_scores, $this_post);
    }
    function sort_objects_by_total($a, $b) {
        if($a->score == $b->score){ return 0 ; }
        return ($a->score < $b->score) ? -1 : 1;
    }

    usort($all_scores, 'sort_objects_by_total');
    $all_scores = array_reverse($all_scores);
    // Push them out of her
    return $all_scores;
}

function getSingleScore($post_id){
    $this_post = (object) array(); 
    $this_post->ID = $post_id;
    $post_query = get_post($this_post->ID); 
    $this_post->user_link = getUserLink($post_query->post_author);
    $this_post->rank = did_post_make_high_core($this_post->ID);
    $this_post->score = get_post_meta( $this_post->ID, "score", true ); 
    $this_post->jorgeClicks = get_post_meta( $this_post->ID, "jorgeClicks", true ); 
    $this_post->clicks = get_post_meta( $this_post->ID, "clicks", true ); 
    $this_post->speed = get_post_meta( $this_post->ID, "speed", true ); 
    $this_post->blocks = get_post_meta( $this_post->ID, "blocks", true ); 
    return $this_post;
}

function getUserLink($post_author){
    $current_user = get_userdata( $post_author );
    $this_post->user_firstname = $current_user->user_firstname;
    $this_post->user_lastname = $current_user->user_lastname;
    $this_post->user_name = $this_post->user_firstname . " " . $this_post->user_lastname;
    $this_post->user_url = $current_user->user_url;

    if(!empty($this_post->user_url) || $this_post->user_url != ""){
        return '<a href="' . $this_post->user_url . '">' . $this_post->user_name . '</a>';
    }
    else {
        return $this_post->user_name;
    }
}

function showSiteRequirementNotMetMessage(){
$string = <<<END
    <div class="ui-widget-overlay"></div>
    <div class="ui-dialog ui-widget ui-widget-content ui-corner-all ui-front ui-dialog-buttons ui-draggable ui-resizable" tabindex="-1" role="dialog" aria-describedby="losing-dialog" aria-labelledby="ui-id-3" style="position: relative; height: auto; width: 300px; top: 225px; left: 250px; display: block;">
        <div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">
            <span id="ui-id-3" class="ui-dialog-title">Browser Incompatible</span>
        </div>
        <div id="losing-dialog" class="modal ui-dialog-content ui-widget-content" >
            <p>Sorry, it seems your browser doesn't meet the minimum requierments to view this site. How about you upgrade to a newer browser.</p>
        </div>
    </div>
END;
    echo $string;

}

?>