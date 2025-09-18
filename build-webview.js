const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Compile TypeScript
console.log('Compiling webview TypeScript...');
execSync('npx tsc src/webview.ts --outDir out --target ES2020 --lib DOM,ES2020 --module commonjs', {
	stdio: 'inherit',
});

// Read the compiled JavaScript
const compiledJs = fs.readFileSync('out/webview.js', 'utf8');

// Read the HTML template
let htmlContent = fs.readFileSync('src/webview.html', 'utf8');

// Replace the script content with compiled JavaScript
const scriptStart = htmlContent.indexOf('<script>', htmlContent.lastIndexOf('<script>'));
const scriptEnd = htmlContent.indexOf('</script>', scriptStart) + 9;

if (scriptStart !== -1 && scriptEnd !== -1) {
	const beforeScript = htmlContent.substring(0, scriptStart);
	const afterScript = htmlContent.substring(scriptEnd);

	// Remove the comment and add the compiled JS
	const newScript = `<script>
${compiledJs}
		</script>`;

	htmlContent = beforeScript + newScript + afterScript;

	// Write the updated HTML
	fs.writeFileSync('src/webview.html', htmlContent);
	console.log('✅ Webview HTML updated with compiled TypeScript');
} else {
	console.error('❌ Could not find script tags in HTML');
}
