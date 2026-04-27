const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying CSS Extraction...\n');

// 1. Check that main.css exists and has content
const cssPath = path.join(__dirname, 'public/css/main.css');
if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const cssLines = cssContent.split('\n').length;
    console.log(`✅ CSS file exists: ${cssLines} lines of CSS extracted`);
} else {
    console.error('❌ CSS file not found');
    process.exit(1);
}

// 2. Check that layout-top.ejs has the link tag and no inline styles
const layoutTopPath = path.join(__dirname, 'views/layout-top.ejs');
const layoutTopContent = fs.readFileSync(layoutTopPath, 'utf8');

if (layoutTopContent.includes('<link rel="stylesheet" href="/css/main.css">')) {
    console.log('✅ layout-top.ejs links to external CSS');
} else {
    console.error('❌ layout-top.ejs missing CSS link');
    process.exit(1);
}

if (layoutTopContent.includes('<style>')) {
    console.error('❌ layout-top.ejs still contains inline <style> tag');
    process.exit(1);
} else {
    console.log('✅ layout-top.ejs has no inline <style> block');
}

// 3. Check each EJS file for remaining inline styles (excluding layout files)
const viewsDir = path.join(__dirname, 'views');
const ejsFiles = fs.readdirSync(viewsDir)
    .filter(f => f.endsWith('.ejs') && \!f.startsWith('layout-'));

let foundInlineStyles = false;
ejsFiles.forEach(file => {
    const filePath = path.join(viewsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const inlineStyleMatches = content.match(/style="[^"]*"/g);
    
    if (inlineStyleMatches && inlineStyleMatches.length > 0) {
        console.warn(`⚠️  ${file} still has inline styles:`, inlineStyleMatches.slice(0, 2).join(', '));
        foundInlineStyles = true;
    }
});

if (\!foundInlineStyles) {
    console.log('✅ All EJS view files have no inline style attributes');
}

// 4. Verify CSS has critical rules
const criticalRules = [
    '--forest',
    '.sidebar',
    '.btn-primary',
    '@media (max-width: 768px)',
    '.hamburger-btn'
];

let missingRules = [];
criticalRules.forEach(rule => {
    if (\!cssContent.includes(rule)) {
        missingRules.push(rule);
    }
});

if (missingRules.length === 0) {
    console.log('✅ CSS contains all critical style rules');
} else {
    console.error('❌ CSS missing critical rules:', missingRules);
    process.exit(1);
}

// 5. Verify utility classes exist
const utilityClasses = [
    '.settings-lang-description',
    '.settings-about-description',
    '.form-inline',
    '.form-inline-flex',
    '.action-btn-full',
    '.reports-list'
];

utilityClasses.forEach(cls => {
    if (cssContent.includes(cls)) {
        console.log(`✅ Utility class ${cls} exists`);
    } else {
        console.warn(`⚠️  Utility class ${cls} might be missing or unused`);
    }
});

console.log('\n✨ CSS extraction verification complete\!');
