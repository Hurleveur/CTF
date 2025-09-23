#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Performance monitoring script for CTF app
console.log('🔍 Starting Performance Analysis...\n');

// Function to measure execution time
function measureTime(label, fn) {
  const start = Date.now();
  const result = fn();
  const end = Date.now();
  const duration = end - start;
  
  console.log(`⏱️  ${label}: ${duration}ms`);
  return { result, duration };
}

// Check Next.js cache status
function checkCache() {
  const cacheDir = path.join(process.cwd(), '.next', 'cache');
  
  if (fs.existsSync(cacheDir)) {
    const stats = fs.statSync(cacheDir);
    const size = getDirectorySize(cacheDir);
    
    console.log(`📦 Next.js Cache:`);
    console.log(`   Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Last Modified: ${stats.mtime.toISOString()}`);
  } else {
    console.log(`📦 Next.js Cache: Not found (first build)`);
  }
}

// Get directory size recursively
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Ignore permission errors
  }
  
  return totalSize;
}

// Check for large dependencies
function checkDependencies() {
  console.log('\n📋 Dependency Analysis:');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Notable dependencies that might affect performance
    const heavyDeps = [
      '@supabase/supabase-js',
      'react',
      'react-dom', 
      'next',
      'tailwindcss',
      'webpack-bundle-analyzer'
    ];
    
    heavyDeps.forEach(dep => {
      if (deps[dep]) {
        console.log(`   ${dep}: ${deps[dep]}`);
      }
    });
    
    console.log(`   Total dependencies: ${Object.keys(deps).length}`);
  } catch (error) {
    console.log('   ❌ Could not read package.json');
  }
}

// Check TypeScript configuration
function checkTypeScriptConfig() {
  console.log('\n⚙️  TypeScript Configuration:');
  
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    const performanceOptions = {
      'incremental': tsConfig.compilerOptions?.incremental,
      'skipLibCheck': tsConfig.compilerOptions?.skipLibCheck,
      'noEmit': tsConfig.compilerOptions?.noEmit,
      'isolatedModules': tsConfig.compilerOptions?.isolatedModules,
    };
    
    Object.entries(performanceOptions).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${key}: ${status} ${value}`);
    });
    
  } catch (error) {
    console.log('   ❌ Could not read tsconfig.json');
  }
}

// Analyze file counts
function analyzeFileStructure() {
  console.log('\n📁 File Structure Analysis:');
  
  const directories = ['app', 'lib', 'pages', '__tests__', 'public'];
  
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      const count = countFiles(dir);
      console.log(`   ${dir}/: ${count} files`);
    }
  });
}

// Count files in directory
function countFiles(dirPath) {
  let count = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        count += countFiles(itemPath);
      } else {
        count++;
      }
    }
  } catch (error) {
    // Ignore permission errors
  }
  
  return count;
}

// Performance recommendations
function generateRecommendations() {
  console.log('\n💡 Performance Recommendations:');
  
  const recommendations = [
    '1. Use `npm run dev:turbo` for faster development builds',
    '2. Run `npm run build:analyze` to analyze bundle size',
    '3. Consider lazy loading heavy components with React.lazy()',
    '4. Use React.memo() for expensive components that re-render frequently',
    '5. Implement proper dependency arrays in useEffect hooks',
    '6. Consider using SWR or React Query for data fetching optimization',
    '7. Enable Next.js Image optimization for better performance',
    '8. Use dynamic imports for code splitting'
  ];
  
  recommendations.forEach(rec => console.log(`   ${rec}`));
}

// Main execution
async function main() {
  // Check cache status
  checkCache();
  
  // Analyze dependencies
  checkDependencies();
  
  // Check TypeScript config
  checkTypeScriptConfig();
  
  // Analyze file structure
  analyzeFileStructure();
  
  // Generate recommendations
  generateRecommendations();
  
  console.log('\n🎯 To improve performance:');
  console.log('   • npm install (install new dependencies)');
  console.log('   • npm run dev:turbo (faster dev server)');
  console.log('   • npm run build:analyze (bundle analysis)');
  console.log('   • Use performance monitoring tools in /lib/performance/');
}

main().catch(console.error);