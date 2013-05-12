# jQuery Tag

A jQuery plugin for creating tags in input fields.

![jQuery Tag](/screenshot.png)

# Usage

Call the `$.fn.tag` method to initialize a tag input field.

```html
<script type="text/javascript">
	$(function() {
		$('#tag-input').tag(['Lady', 'That guy', 'The other guy', 'Test']);
	});
</script>

<div id="tag-input">
	<input type="text">
</div>
```
