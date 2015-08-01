import ko from 'knockout';
import http from 'plugins/http';
import moment from '/lib/moment/moment.js';

function get_url(friend, uri) {
	return 'http://' + friend.address + ':' + friend.port + uri;
}

function robust_ajax(ajax) {

	var failure = function(){}, success = function(){};
	var call_failure_callback = function() {
		failure();
	}
	t = setTimeout(call_failure_callback, 5000);
	
	ajax.then(function(data){
		clearTimeout(t);
		failure = function(){};
		success(data);
	});

	var set_timeout = function(f) {
		failure = f;
		return t;
	}

	var set_success = function(s) {
		success = s;
		return t;
	}

	var t = {
		timeout: set_timeout,
		success: set_success
	};

	return t;
}

function get_from_friend(friend, uri) {
	var url = get_url(friend, uri);
	console.log('GET' + ' to ' + uri);

	if (url.indexOf('=?') == -1) {
		var callbackParam = 'jsoncallback';

		if (url.indexOf('?') == -1) {
			url += '?';
		} else {
			url += '&';
		}

		url += callbackParam + '=?';
	}
	
	return robust_ajax($.ajax({
		url: url,
		dataType: 'jsonp',
		data: {}
	}));
}

function to_friend(friend, uri, data, method) {
	console.log(method + ' to ' + uri);
	var url = get_url(friend, uri);
	var headers = {};
	return robust_ajax($.ajax({
		url: url,
		data: data,
		processData: true,
		type: method,
		dataType: 'json',
		headers: ko.toJS(headers),
		xhrFields: {
			withCredentials: true
		}
	}));
}

function post_to_friend(friend, uri, data) {
	return to_friend(friend, uri, data, 'POST');
}

function delete_to_friend(friend, uri, data) {
	return to_friend(friend, uri, data, 'DELETE');
}

function get_content_from_friend(friend, content_id) {
	var content_uri = '/content/' + content_id;

	return get_from_friend(friend, content_uri);
}

export default class Link {

	constructor(user, args){
		// Get html to display for this link (either text or image) and store it
		
		this.creation_time = args.creation_time;
		this.link_server = args.link_server;
		this.children = args.children;

		this.friend = args.friend;
		this.content_id = args.content;

		this.level = args.level;
		this.html = ko.observable('Loading...');
		this.is_comment_box_visible = ko.observable(false);

		this.comment_text = ko.observable('');

		this.user = user;

		this.reload();
	}

	get_human_creation_time(){
		return moment(this.creation_time).fromNow();
	}

	show_comment_box(){
		return function () { this.is_comment_box_visible(!this.is_comment_box_visible()) };
	}

	add_comment(){
		//Add content to this user's server, then add a link to the same server as the parent link
		return function() {
			this.html('Adding comment...');
			var that = this;

			var comment_parent_content_id = this.content_id;
			
			var data = {'content_text':this.comment_text()};
			post_to_friend(this.user, '/content/' + comment_parent_content_id, data)
			.success(function(response) {
				console.log(response);
				post_to_friend(
					that.link_server, 
					'/node/' + comment_parent_content_id, 
					response				
				)
				.success(function(){window.location = '/'})
				.timeout(function(){console.log('Failed link comment')})
			}).timeout(function(){
				console.log('Fail to add comment');
			});
		}
	}

	delete_link_content(){
		return function() {
			var that = this;
			delete_to_friend(this.user, '/content/' + this.content_id, this.reload)
			.success(function(){that.html("[deleted]")});
		}
	}

	reload() {
		var that = this;
		get_content_from_friend(this.friend, this.content_id)
		.timeout(
			function() {that.html("Loading... (no response yet)")}
		).success(
			function( data ) {that.html(data.text)}
		);
		// this.reload_children();
	}

	reload_children() {
		//This only reloads existing children, it does not look for potentially new children on the server
		for (let i in this.children) {
			this.children[i].reload();
		}
	}
}

function posts_from_friend(friend, user, callback) {	
	var cb = function(response) {
		var post_trees = response;

		function get_children_indented(children, level) {
			var flat_children = [];

			for (var i = 0; i < children.length; i++){
				var link = children[i];
				link.link_server = friend;
				link.level = level;
				if (link.children.length > 0) {
					link.children = get_children_indented(link.children, level + 1);		
				} else {
					link.children = [];
				}

				link = new Link(user, link);

				flat_children.push(link);
				flat_children = flat_children.concat(link.children);
			}
			return flat_children;
		}

		var flat_children = get_children_indented(post_trees, 0);

		callback(flat_children);
	};

	get_from_friend(friend, '/timeline').success(cb).timeout(function(){callback([])});
}

export default class Home {
	
	constructor(){
		this.title = 'Your feed';
		this.posts = ko.observableArray([]);
	}

	activate(){
		var that = this;
		//login
		//get my posts
		var user = {'address' : '192.168.1.39', 'port' : '8000'}//Known to the browser?... Of course!
		
		posts_from_friend(user, user, that.posts);
	}
}