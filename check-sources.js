#!/usr/bin/env node

/**
 * Source Link Checker for Jeopardy Game
 * Checks all Wikipedia and other source links in data.json
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

// Read data.json
const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));

// Collect all sources
const sources = [];

data.forEach((item, catIndex) => {
  if (item.finalJeopardy) {
    sources.push({
      category: 'FINAL JEOPARDY: ' + item.category,
      question: item.question.substring(0, 50) + '...',
      source: item.source,
      answer: item.answer
    });
  } else if (item.questions) {
    item.questions.forEach((q, qIndex) => {
      sources.push({
        category: item.category,
        question: q.question.substring(0, 50) + '...',
        source: q.source,
        answer: q.answer,
        value: (qIndex + 1) * 100
      });
    });
  }
});

console.log('\n🔍 Checking', sources.length, 'source links...\n');
console.log('='.repeat(60));

// Function to check a single URL
function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)' 
      },
      timeout: 10000
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        checkUrl(res.headers.location).then(resolve);
        return;
      }
      resolve({ 
        status: res.statusCode, 
        ok: res.statusCode >= 200 && res.statusCode < 400 
      });
    });
    
    req.on('error', (err) => {
      resolve({ status: 'ERROR', ok: false, error: err.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', ok: false });
    });
  });
}

// Check all sources
async function checkAllSources() {
  const results = { ok: [], broken: [] };
  
  for (let i = 0; i < sources.length; i++) {
    const item = sources[i];
    const result = await checkUrl(item.source);
    
    const prefix = item.value ? `$${item.value}` : 'FJ';
    const status = result.ok ? '✅' : '❌';
    
    console.log(`${status} [${prefix}] ${item.category}`);
    console.log(`   Q: ${item.question}`);
    console.log(`   A: ${item.answer}`);
    console.log(`   URL: ${item.source}`);
    console.log(`   Status: ${result.status}${result.error ? ' - ' + result.error : ''}`);
    console.log('');
    
    if (result.ok) {
      results.ok.push(item);
    } else {
      results.broken.push({ ...item, status: result.status, error: result.error });
    }
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 SUMMARY\n');
  console.log(`✅ Working links: ${results.ok.length}`);
  console.log(`❌ Broken links: ${results.broken.length}`);
  
  if (results.broken.length > 0) {
    console.log('\n⚠️  BROKEN LINKS TO FIX:\n');
    results.broken.forEach((item, i) => {
      console.log(`${i + 1}. [${item.category}]`);
      console.log(`   Question: ${item.question}`);
      console.log(`   Answer: ${item.answer}`);
      console.log(`   Broken URL: ${item.source}`);
      console.log(`   Error: ${item.status}${item.error ? ' - ' + item.error : ''}`);
      console.log('');
    });
  } else {
    console.log('\n🎉 All links are working!\n');
  }
}

checkAllSources();

