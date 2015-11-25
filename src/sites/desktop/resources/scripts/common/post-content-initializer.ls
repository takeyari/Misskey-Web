$ = require 'jquery'
urldecorator = require './urldecorator.js'

module.exports = (post-type, $content) ->
	switch (post-type)
	| \status, \photo =>
		# Init url preview
		$content.find '> .text a:not(.mention):not(.hashtag)' .each ->
			$link = urldecorator $ @
			$.ajax "#{config.web-api-url}/web/analyze-url" {
				type: \get
				data:
					'url': $link.attr \href
				data-type: \text
				xhr-fields: {+with-credentials}}
			.done (html) ->
				$ html .append-to $content .hide!.fade-in 200ms

	switch (post-type)
	| \photo =>
		# Images
		$content.find '> .photos > .photo' .each ->
			$image = $ @
			$img = $image.find \img
			$button = $image.find \button
			$back = $image.find \.background

			$viewer = $ '<div />'

			$image.css {
				'position': 'relative'
			}

			$img.css {
				'cursor': 'zoom-in'
			}

			$img.hover do
				->
					$viewer.css {
						'position': 'absolute'
						'top': $img.position!.top + 'px'
						'left': $img.position!.left + 'px'
						'margin': $img.css \margin
						'width': $img.outer-width! + 'px'
						'height': $img.outer-height! + 'px'
						'background-image': "url(#{$img.attr 'src'})"
						'border-radius': $img.css \border-radius
						'pointer-events': 'none'
					}
					$image.append $viewer
				->
					$viewer.remove!

			$img.mousemove (e) ->
				mouse-x = e.client-x - $img.offset!.left + $ window .scroll-left!
				mouse-y = e.client-y - $img.offset!.top + $ window .scroll-top!
				xp = mouse-x / $img.outer-width! * 100
				yp = mouse-y / $img.outer-height! * 100
				$viewer.css {
					'background-position-x': xp + '%'
					'background-position-y': yp + '%'
				}

			$img.click (e) ->
				e.stop-propagation!
				$back = $ '<div />'
				$back.css {
					'position': 'fixed'
					'z-index': 1024
					'top': 0
					'left': 0
					'width': '100%'
					'height': '100%'
					'background': 'rgba(0, 0, 0, 0.8)'
					'opacity': 0
				}
				$image.append $back
				$back.animate {
					opacity: 1
				} 100ms

				$raw = $ '<img />'
				$raw.attr \src $img.attr \src
				$raw.css {
					'position': 'fixed'
					'z-index': 1025
					'top': 0
					'right': 0
					'bottom': 0
					'left': 0
					'max-width': '100%'
					'max-height': '100%'
					'margin': 'auto'
					'opacity': 0
				}
				$image.append $raw
				$raw.animate {
					opacity: 1
				} 100ms

				$raw.one \click close
				$back.one \click close

				function close(e)
					e.stop-propagation!
					$back.animate {
						opacity: 0
					} 100ms \linear ->
						$back.remove!
					$raw.animate {
						opacity: 0
					} 100ms \linear ->
						$raw.remove!