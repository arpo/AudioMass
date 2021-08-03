(function ( w, d, PKAE ) {
	'use strict';

	// 
	// MAIN UI CLASS
	var PKRegionMate = function( app ) {
		var q = this;

		// this.el = app.el;
		// if mobile add proper class
		// this.el.className += ' pk_app' + (app.isMobile ? ' pk_mob' : '');
		
		// hold refferences to the event functions
		this.fireEvent = app.fireEvent;
		this.listenFor = app.listenFor;
		this.regions = {};

		this.refreshUI = () => {
			for (const key in this.regions) {
				if (Object.hasOwnProperty.call(this.regions, key)) {
					const reg = this.regions[key];
					console.log(reg);
				}
			}
		};

		// keep track of the active UI element
		this.InteractionHandler = {
			on  : false,
			by  : null,
			arr : [],

			check: function ( _name ) {
				if (this.on && this.by !== _name) {
					return (false);
				}
				return (true);
			},

		};

		if (app.isMobile)
		{
			// d.body.className = 'pk_stndln';
			// var fxd = d.createElement ('div');
			// fxd.className = 'pk_fxd';
			// fxd.appendChild (this.el);

			// d.body.appendChild (fxd);

			// _makeMobileScroll (this);
		}

		this.KeyHandler = new app._deps.keyhandler ( this ); // initializing keyhandler

		app.listenFor ('RequestKeyDown', function ( key ) {
			q.KeyHandler.keyDown ( key, null );
			q.KeyHandler.keyUp ( key );
		});
	};


	PKAE._deps.regionMate = PKRegionMate;
	
})( window, document, PKAudioEditor );