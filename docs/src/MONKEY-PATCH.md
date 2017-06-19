Some of the documentation assets are monkey-patched, keeping track of these patches here.

1. `node_modules/documentation/default_theme` copied to `./theme`
2. `font-awesome` module downloaded and copied to `./theme/assets`
3. `?v=4.7.0` string occurrences are removed from `font-awesome.min.css` because documentationjs server chokes on it for some reason
4. JSDoc access level icons are added to TOC part of `index._` template
5. `theme/assets/site.js` fixed to perform search over `element.innerText` instead of `element.firstChild.innerHTML`
6. `theme/assets/my.css` `theme/assets/my.js` and `theme/my-tpl.js`created to add additional styles and scripts