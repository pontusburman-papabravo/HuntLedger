/**
 * Theme patch script — applies Heritage+Fintech dark theme to all React components
 * in bootstrap.mjs. Replaces hardcoded light-color inline styles with dark theme values.
 */

import fs from 'fs';

const BOOTSTRAP = './bootstrap.mjs';

let content = fs.readFileSync(BOOTSTRAP, 'utf8');
let changeCount = 0;

function replace(from, to) {
  const before = content;
  content = content.split(from).join(to);
  const count = before.split(from).length - 1;
  if (count === 0) {
    console.warn(`NOTFOUND: "${from.substring(0, 70)}"`);
  } else {
    console.log(`OK ${count}x: "${from.substring(0, 70)}"`);
    changeCount += count;
  }
}

// ─── BUTTONS ───────────────────────────────────────────────────────────────────
console.log('\n-- Buttons --');

replace(
  `border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151'`,
  `border: '1px solid #c8965a', background: 'transparent', color: '#c8965a'`
);

replace(
  `border: '1px solid #ccc', background: '#f9f9f9', color: '#555'`,
  `border: '1px solid #c8965a', background: 'transparent', color: '#c8965a'`
);

replace(
  `border: '1px solid #6d9b3a', background: '#f0f7e8', color: '#3a6b12'`,
  `border: '1px solid #6b8f5e', background: 'rgba(107,143,94,0.15)', color: '#6b8f5e'`
);

replace(
  `border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626'`,
  `border: 'none', background: '#a85454', color: '#e8dcc8'`
);

replace(
  `border: '1px solid #e5e7eb', background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed'`,
  `border: '1px solid #3a3835', background: 'rgba(42,41,38,0.5)', color: '#6b5e52', cursor: 'not-allowed'`
);

replace(
  `{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff',`,
  `{ padding: '8px 16px', borderRadius: 6, border: '1px solid #c8965a', cursor: 'pointer', background: 'transparent', color: '#c8965a',`
);

replace(
  `style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}`,
  `style={{ background: '#a85454', color: '#e8dcc8', border: 'none' }}`
);

replace(
  `style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}`,
  `style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #c8965a', cursor: 'pointer', background: 'transparent', color: '#c8965a' }}`
);

// ─── LANGUAGE BUTTONS (AccountSettings) ──────────────────────────────────────
console.log('\n-- Language Buttons --');

replace(
  `border: currentLang === 'sv' ? '2px solid #1a2e1a' : '1px solid #d1d5db',
              background: currentLang === 'sv' ? '#1a2e1a' : '#fff',
              color: currentLang === 'sv' ? '#d4c5a0' : '#374151',`,
  `border: currentLang === 'sv' ? '2px solid #c8965a' : '1px solid #3a3835',
              background: currentLang === 'sv' ? '#c8965a' : 'transparent',
              color: currentLang === 'sv' ? '#1a1a18' : '#c8965a',`
);

replace(
  `border: currentLang === 'en' ? '2px solid #1a2e1a' : '1px solid #d1d5db',
              background: currentLang === 'en' ? '#1a2e1a' : '#fff',
              color: currentLang === 'en' ? '#d4c5a0' : '#374151',`,
  `border: currentLang === 'en' ? '2px solid #c8965a' : '1px solid #3a3835',
              background: currentLang === 'en' ? '#c8965a' : 'transparent',
              color: currentLang === 'en' ? '#1a1a18' : '#c8965a',`
);

// ─── ACCOUNTSETTINGS CONTAINERS ──────────────────────────────────────────────
console.log('\n-- AccountSettings --');

replace(
  `border: '1px solid rgba(61,43,31,0.12)', borderRadius: 8, padding: 20,
        background: '#fff', marginBottom: 24,`,
  `border: '1px solid #3a3835', borderRadius: 8, padding: 20,
        background: '#2a2926', marginBottom: 24,`
);

replace(
  `border: '1px solid #fca5a5', borderRadius: 8, padding: 20,
        background: '#fff5f5',`,
  `border: '1px solid #a85454', borderRadius: 8, padding: 20,
        background: '#2a2926',`
);

replace(
  `<h2 style={{ color: '#991b1b', marginTop: 0, marginBottom: 8, fontSize: 18 }}>`,
  `<h2 style={{ color: '#c45a4a', marginTop: 0, marginBottom: 8, fontSize: 18 }}>`
);

replace(
  `<p style={{ color: '#4b5563', marginBottom: 16, fontSize: 14 }}>`,
  `<p style={{ color: '#a89a84', marginBottom: 16, fontSize: 14 }}>`
);

replace(
  `<p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>`,
  `<p style={{ fontSize: 13, color: '#a89a84', marginBottom: 8 }}>`
);

replace(
  `<p style={{ color: '#6b7280', marginBottom: 32 }}>`,
  `<p style={{ color: '#a89a84', marginBottom: 32 }}>`
);

replace(
  `<h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, color: '#1a2e1a' }}>`,
  `<h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, color: '#c8965a' }}>`
);

// Delete button (two contexts - AccountSettings has extra indentation)
replace(
  `padding: '8px 16px', borderRadius: 6, background: '#dc2626',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,`,
  `padding: '8px 16px', borderRadius: 6, background: '#a85454',
              color: '#e8dcc8', border: 'none', cursor: 'pointer', fontWeight: 600,`
);

replace(
  `padding: '8px 16px', borderRadius: 6, background: '#dc2626',
                  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,`,
  `padding: '8px 16px', borderRadius: 6, background: '#a85454',
                  color: '#e8dcc8', border: 'none', cursor: 'pointer', fontWeight: 600,`
);

replace(
  `padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db',
                  cursor: 'pointer', background: '#fff',`,
  `padding: '8px 16px', borderRadius: 6, border: '1px solid #c8965a',
                  cursor: 'pointer', background: 'transparent', color: '#c8965a',`
);

// ─── ADMIN MODAL ─────────────────────────────────────────────────────────────
console.log('\n-- Admin Modal --');

replace(
  `background: '#fff', borderRadius: 8, padding: 24, maxWidth: 400, width: '90%',`,
  `background: '#2a2926', borderRadius: 8, padding: 24, maxWidth: 400, width: '90%', border: '1px solid #3a3835',`
);

replace(
  `<h2 style={{ marginTop: 0, color: '#991b1b' }}>Radera användare</h2>`,
  `<h2 style={{ marginTop: 0, color: '#c45a4a' }}>Radera användare</h2>`
);

replace(
  `<p style={{ fontSize: 13, color: '#6b7280' }}>`,
  `<p style={{ fontSize: 13, color: '#a89a84' }}>`
);

replace(
  `padding: '8px 16px', borderRadius: 6, background: '#dc2626',
          color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,`,
  `padding: '8px 16px', borderRadius: 6, background: '#a85454',
          color: '#e8dcc8', border: 'none', cursor: 'pointer', fontWeight: 600,`
);

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
console.log('\n-- Dashboard --');

replace(
  `background:'#fff',border:'1px solid #e8e0d0',borderRadius:10,padding:'14px 12px',textAlign:'center'`,
  `background:'#2a2926',border:'1px solid #3a3835',borderRadius:10,padding:'14px 12px',textAlign:'center'`
);

replace(
  `{fontSize:28,fontWeight:700,color:'#1a2e1a'}`,
  `{fontSize:28,fontWeight:700,color:'#c8965a'}`
);

replace(
  `{fontSize:12,color:'#5a4a3a',marginTop:2}`,
  `{fontSize:12,color:'#a89a84',marginTop:2}`
);

replace(
  `<p style={{color:'#5a4a3a',fontSize:15,marginBottom:20}}>`,
  `<p style={{color:'#a89a84',fontSize:15,marginBottom:20}}>`
);

replace(
  `{background:'#fff',border:'1px solid #e8e0d0',borderRadius:10,padding:'16px 18px',marginBottom:24}`,
  `{background:'#2a2926',border:'1px solid #3a3835',borderRadius:10,padding:'16px 18px',marginBottom:24}`
);

replace(
  `<h2 style={{margin:0,fontSize:16,fontWeight:700,color:'#1a2e1a'}}>`,
  `<h2 style={{margin:0,fontSize:16,fontWeight:700,color:'#c8965a'}}>`
);

replace(
  `style={{fontSize:13,color:'#4a6741',background:'none',border:'none',cursor:'pointer',padding:'4px 0',minHeight:0}}`,
  `style={{fontSize:13,color:'#c8965a',background:'none',border:'none',cursor:'pointer',padding:'4px 0',minHeight:0}}`
);

replace(
  `<p style={{color:'#888',fontSize:14}}>`,
  `<p style={{color:'#a89a84',fontSize:14}}>`
);

replace(
  `{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#faf9f6',border:'1px solid #f0ead8',borderRadius:8,flexWrap:'wrap'}`,
  `{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#232321',border:'1px solid #3a3835',borderRadius:8,flexWrap:'wrap'}`
);

replace(
  `{fontSize:13,color:'#888',minWidth:80,flexShrink:0}`,
  `{fontSize:13,color:'#a89a84',minWidth:80,flexShrink:0}`
);

replace(
  `{fontSize:12,background:'#ede8dc',color:'#1a2e1a',padding:'2px 9px',borderRadius:12,fontWeight:500,flexShrink:0}`,
  `{fontSize:12,background:'rgba(200,150,90,0.15)',color:'#c8965a',padding:'2px 9px',borderRadius:12,fontWeight:500,flexShrink:0}`
);

replace(
  `{fontSize:12,color:'#5a4a3a',flexShrink:0}`,
  `{fontSize:12,color:'#a89a84',flexShrink:0}`
);

replace(
  `{fontSize:12,color:'#aaa',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}`,
  `{fontSize:12,color:'#6b5e52',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}`
);

replace(
  `{background:'#fff',border:'1px solid #e8e0d0',borderRadius:10,padding:'16px 18px'}`,
  `{background:'#2a2926',border:'1px solid #3a3835',borderRadius:10,padding:'16px 18px'}`
);

replace(
  `{margin:'0 0 12px',fontSize:16,fontWeight:700,color:'#1a2e1a'}`,
  `{margin:'0 0 12px',fontSize:16,fontWeight:700,color:'#c8965a'}`
);

replace(
  `stroke="#e8e0d0"`,
  `stroke="#3a3835"`
);

replace(
  `tick={{fill:'#5a4a3a'}}`,
  `tick={{fill:'#a89a84'}}`
);

replace(
  `contentStyle={{borderRadius:8,border:'1px solid #e8e0d0',fontSize:13}}`,
  `contentStyle={{borderRadius:8,border:'1px solid #3a3835',fontSize:13,background:'#2a2926',color:'#e8dcc8'}}`
);

replace(
  `fill="#a09060"`,
  `fill="#c8965a"`
);

// ─── BADGES.TSX ────────────────────────────────────────────────────────────────
console.log('\n-- Badges.tsx --');

replace(
  `const cardStyle = {border:'1px solid #d4c5a0',borderRadius:10,padding:'16px 18px',background:'#faf8f4',marginBottom:16};`,
  `const cardStyle = {border:'1px solid #3a3835',borderRadius:10,padding:'16px 18px',background:'#2a2926',marginBottom:16};`
);

replace(
  `style={{padding:'6px 12px',borderRadius:6,border:'1px solid #d4c5a0',background:'#fff',fontSize:14}}`,
  `style={{padding:'6px 12px',borderRadius:6,border:'1px solid #3a3835',background:'#2a2926',color:'#e8dcc8',fontSize:14}}`
);

replace(
  `{fontWeight:700,fontSize:15,color:'#1a2e1a',marginBottom:4}`,
  `{fontWeight:700,fontSize:15,color:'#c8965a',marginBottom:4}`
);

replace(
  `{fontSize:12,color:'#888',marginBottom:14}`,
  `{fontSize:12,color:'#a89a84',marginBottom:14}`
);

replace(
  `{borderBottom:'1px solid #f0ead8'}`,
  `{borderBottom:'1px solid #3a3835'}`
);

replace(
  `{fontWeight:600,fontSize:14,color:'#1a2e1a'}`,
  `{fontWeight:600,fontSize:14,color:'#e8dcc8'}`
);

replace(
  `{fontSize:12,color:valid?'#155724':'#888',marginTop:2}`,
  `{fontSize:12,color:valid?'#6b8f5e':'#a89a84',marginTop:2}`
);

replace(
  `{fontSize:12,color:'#5a4a3a',marginTop:2}`,
  `{fontSize:12,color:'#a89a84',marginTop:2}`
);

// ─── BADGECARD.TSX ─────────────────────────────────────────────────────────────
console.log('\n-- BadgeCard.tsx --');

replace(
  `{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid #f0ead8'}`,
  `{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid #3a3835'}`
);

replace(
  `{fontWeight:600,fontSize:13,color:'#1a2e1a',minWidth:46,flexShrink:0}`,
  `{fontWeight:600,fontSize:13,color:'#e8dcc8',minWidth:46,flexShrink:0}`
);

replace(
  `{fontSize:12,color:valid?'#155724':'#888',flex:1}`,
  `{fontSize:12,color:valid?'#6b8f5e':'#a89a84',flex:1}`
);

replace(
  `{fontSize:12,color:'#5a4a3a',flex:1}`,
  `{fontSize:12,color:'#a89a84',flex:1}`
);

replace(
  `{fontSize:12,color:'#bbb',flex:1}`,
  `{fontSize:12,color:'#6b5e52',flex:1}`
);

replace(
  `border:'1px solid #d4c5a0', borderRadius:10, padding:'14px 16px', background:'#faf8f4',`,
  `border:'1px solid #3a3835', borderRadius:10, padding:'14px 16px', background:'#2a2926',`
);

replace(
  `{fontWeight:700,fontSize:14,color:'#1a2e1a',marginBottom:8}`,
  `{fontWeight:700,fontSize:14,color:'#c8965a',marginBottom:8}`
);

replace(
  `{fontSize:13,color:'#888',margin:0}`,
  `{fontSize:13,color:'#a89a84',margin:0}`
);

replace(
  `{fontSize:11,fontWeight:600,color:'#5a4a3a',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.04em'}`,
  `{fontSize:11,fontWeight:600,color:'#a89a84',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.04em'}`
);

replace(
  `{fontSize:11,color:'#5a4a3a',marginBottom:6}`,
  `{fontSize:11,color:'#a89a84',marginBottom:6}`
);

replace(
  `{fontWeight:700,fontSize:14,color:'#1a2e1a',marginBottom:10}`,
  `{fontWeight:700,fontSize:14,color:'#c8965a',marginBottom:10}`
);

replace(
  `style={{fontSize:12,color:'#4a6741',background:'none',border:'none',cursor:'pointer',padding:0,minHeight:0}}`,
  `style={{fontSize:12,color:'#c8965a',background:'none',border:'none',cursor:'pointer',padding:0,minHeight:0}}`
);

// ─── ERROR TEXT ────────────────────────────────────────────────────────────────
console.log('\n-- Error/misc text --');

replace(
  `<p style={{ color: 'red' }}>{error}</p>`,
  `<p style={{ color: '#c45a4a' }}>{error}</p>`
);

replace(
  `{deleteError && <p style={{ color: 'red', fontSize: 13 }}>{deleteError}</p>}`,
  `{deleteError && <p style={{ color: '#c45a4a', fontSize: 13 }}>{deleteError}</p>}`
);

// ─── CONFIRMDIALOG ─────────────────────────────────────────────────────────────
console.log('\n-- ConfirmDialog --');

replace(
  `background: '#fff', border: '1px solid #d4c5a0', borderRadius: 10, padding: '24px 28px', minWidth: 300, maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.18)'`,
  `background: '#2a2926', border: '1px solid #3a3835', borderRadius: 10, padding: '24px 28px', minWidth: 300, maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.5)'`
);

replace(
  `margin: '0 0 8px', fontSize: 17, color: '#1a2e1a'`,
  `margin: '0 0 8px', fontSize: 17, color: '#c8965a'`
);

replace(
  `margin: '0 0 16px', color: '#555', fontSize: 14`,
  `margin: '0 0 16px', color: '#a89a84', fontSize: 14`
);

replace(
  `color: '#dc2626', fontSize: 13, background: '#fef2f2', padding: '8px 10px', borderRadius: 6`,
  `color: '#c45a4a', fontSize: 13, background: 'rgba(168,84,84,0.15)', padding: '8px 10px', borderRadius: 6`
);

replace(
  `padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontSize: 14`,
  `padding: '8px 16px', borderRadius: 6, border: '1px solid #c8965a', background: 'transparent', color: '#c8965a', fontSize: 14`
);

replace(
  `padding: '8px 16px', borderRadius: 6, border: 'none', background: isDanger ? '#dc2626' : '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600`,
  `padding: '8px 16px', borderRadius: 6, border: 'none', background: isDanger ? '#a85454' : '#c8965a', color: '#e8dcc8', fontSize: 14, fontWeight: 600`
);

// ─── EDIT FORM CONTAINERS ─────────────────────────────────────────────────────
console.log('\n-- Edit Form Containers --');

replace(
  `margin: '16px 0', padding: 16, border: '1px solid #d1d5db', borderRadius: 8, background: '#fafafa'`,
  `margin: '16px 0', padding: 16, border: '1px solid #3a3835', borderRadius: 8, background: '#2a2926'`
);

// ─── WRITE RESULT ──────────────────────────────────────────────────────────────
console.log(`\nTotal replacements: ${changeCount}`);
fs.writeFileSync(BOOTSTRAP, content, 'utf8');
console.log('bootstrap.mjs saved.');
