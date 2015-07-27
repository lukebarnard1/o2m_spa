import ko from 'knockout';
import http from 'plugins/http';
import moment from '/lib/moment/moment.js';

function get_from_friend(friend, uri, callback) {
	var url = 'http://' + friend.address + ':' + friend.port + uri;
	http.jsonp(url, {}, 'jsoncallback').then(function(response) {
		return callback(response);
	});
}

function get_content_from_friend(friend, content_id, callback) {
	var content_uri = '/content/' + content_id;

	get_from_friend(friend, content_uri, callback);
}

export default class Link {

	constructor(args){
		// Get html to display for this link (either text or image) and store it
		
		this.creation_time = args.creation_time;
		this.link_server = args.link_server;
		this.friend = args.friend;
		this.content_id = args.content;
		this.level = args.level;
		this.html = ko.observable('Loading...');
		this.is_comment_box_visible = ko.observable(false);

		var that = this;
		get_content_from_friend(this.friend, this.content_id, function(response){
			that.html(response.text);
		});	
	}

	get_human_creation_time(){
		return moment(this.creation_time).fromNow();
	}

	show_comment_box(){
		return function () { this.is_comment_box_visible(!this.is_comment_box_visible()) };
	}
}

function posts_from_friend(friend, callback) {
	var url = 'http://' + friend.address + ':' + friend.port + '/timeline';
	
	http.jsonp(url, {}, 'jsoncallback').then(function(response) {
		var post_trees = response;

		function get_children_indented(children, level) {
			var flat_children = [];

			for (var i = 0; i < children.length; i++){
				var link = children[i];
				link.level = level;

				flat_children.push(link);

				if (link.children.length > 0) {
					flat_children = flat_children.concat(get_children_indented(link.children, level = level + 1));
				}
			}
			return flat_children;
		}

		var flat_children = get_children_indented(post_trees, 0);

		for (var i = 0; i < flat_children.length; i++) {
			flat_children[i].link_server= friend;

			flat_children[i] = new Link(flat_children[i]);
		}
		console.log(flat_children);
		callback(flat_children);
	});
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
		var me = {'address' : '192.168.1.39', 'port' : '8000'}
		
		posts_from_friend(me, that.posts);
	}
}