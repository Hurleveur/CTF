#!/usr/bin/env node

/**
 * Webpack Cache Optimization Monitor
 * 
 * This script monitors and reports webpack cache performance issues
 * and provides suggestions for optimization.
 */

const fs = require('fs');
const path = require('path');

function analyzeWebpackCacheIssues() {
  console.log('🔍 Analyzing Webpack Cache Performance Issues...\n');

  // Check for large inline styles and data
  const checks = [
    {
      name: 'Large Inline Styles (style jsx blocks)',
      pattern: /style jsx.*{`[\s\S]{1000,}?`}/g,
      files: ['**/*.tsx', '**/*.jsx'],
      solution: 'Move large CSS blocks to external .css files'
    },
    {
      name: 'Large JSON Objects in Code',
      pattern: /const\s+\w+\s*=\s*{[\s\S]{500,}?}/g,
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      solution: 'Move large data objects to separate JSON files and import dynamically'
    },
    {
      name: 'Large String Literals',
      pattern: /['"`][\s\S]{1000,}?['"`]/g,
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      solution: 'Move large strings to external files or use dynamic imports'
    }
  ];

  const cacheDir = '.next/cache/webpack';
  
  console.log('📊 Cache Directory Analysis:');
  
  if (fs.existsSync(cacheDir)) {
    const stats = getCacheStats(cacheDir);
    console.log(`   Cache Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Cache Files: ${stats.fileCount}`);
    console.log(`   Largest Files: ${stats.largestFiles.slice(0, 3).map(f => `${f.name} (${(f.size / 1024).toFixed(1)}KB)`).join(', ')}`);
  } else {
    console.log('   No webpack cache found (first build)');
  }

  console.log('\n🚀 Optimization Recommendations:');

  // Check Next.js config for cache optimizations
  const nextConfigPath = 'next.config.mjs';
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (!nextConfig.includes('maxSize:')) {
      console.log('   ✅ Added chunk size limits to prevent large serialization');
    } else {
      console.log('   ⚠️  Consider adding maxSize limits to webpack splitChunks config');
    }

    if (nextConfig.includes('compression: \'gzip\'')) {
      console.log('   ✅ Webpack cache compression enabled');
    } else {
      console.log('   ⚠️  Enable webpack cache compression for better performance');
    }
  }

  // Check for style jsx usage
  const assemblyLineFile = 'app/assembly-line/AssemblyLineContent.tsx';
  if (fs.existsSync(assemblyLineFile)) {
    const content = fs.readFileSync(assemblyLineFile, 'utf8');
    
    if (content.includes('assembly-line-styles.css')) {
      console.log('   ✅ Large styles moved to external CSS file');
    } else if (content.includes('style jsx')) {
      console.log('   ⚠️  Large style jsx blocks found - consider moving to external CSS');
    }
  }

  console.log('\n💡 Performance Tips:');
  console.log('   • Use external CSS files instead of large style jsx blocks');
  console.log('   • Keep individual chunks under 200KB to avoid serialization warnings');
  console.log('   • Enable webpack cache compression');
  console.log('   • Use dynamic imports for large data objects');
  console.log('   • Consider using next/dynamic for heavy components');

  console.log('\n🎯 Build Performance Commands:');
  console.log('   npm run build:analyze  - Analyze bundle sizes');
  console.log('   npm run dev:turbo      - Use Turbopack for faster development');
  console.log('   npm run perf:monitor   - Monitor ongoing performance');
}

function getCacheStats(dir) {
  let totalSize = 0;
  let fileCount = 0;
  let largestFiles = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        totalSize += stat.size;
        fileCount++;
        
        if (stat.size > 50000) { // Files larger than 50KB
          largestFiles.push({
            name: path.relative(dir, fullPath),
            size: stat.size
          });
        }
      }
    }
  }

  try {
    traverse(dir);
    largestFiles.sort((a, b) => b.size - a.size);
  } catch (error) {
    console.log('   Error reading cache directory:', error.message);
  }

  return { totalSize, fileCount, largestFiles };
}

// Run the analysis
analyzeWebpackCacheIssues();