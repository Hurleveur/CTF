import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-900 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to the Challenge</h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            This isn't your typical robotics company website. This is a Capture The Flag (CTF) challenge 
            disguised as a corporate site. Can you find all the hidden secrets?
          </p>
        </div>
      </section>

      {/* CTF Challenge Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">The Challenge</h2>
              <p className="text-lg text-gray-600 mb-6">
                Hidden throughout this website are <span className="font-mono text-blue-600">hexadecimal code segments</span> 
                that form the pieces of a larger puzzle. These codes are scattered behind closed doors, 
                buried in unexpected places, and waiting to be discovered by observant hackers.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                <span className="font-semibold text-red-600">Your mission:</span> Navigate through the site, 
                solve various challenges, and collect all the hex codes to unlock the final secret. 
                Some doors may appear locked, but there's always a way in for those who know where to look.
              </p>
              <p className="text-lg text-gray-600">
                Remember: In CTF challenges, <span className="italic">everything is a clue</span>. 
                Even the most mundane elements might hide something valuable.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Hidden in Plain Sight</h3>
                <p className="text-gray-600">
                  The codes you seek are encoded in hexadecimal format. Look for patterns, 
                  explore every corner, and don't forget to check the obvious places too.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Story */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Developer's Story</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the sleep-deprived intern who built this challenge
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">😴</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Alex Chen - Junior Developer</h3>
              <p className="text-blue-600 font-medium">Intern (Desperately in need of sleep)</p>
            </div>
            
            <div className="space-y-4 text-gray-600">
              <p>
                "So there I was, 3 AM on a Sunday, coding this website for our CTF challenge. 
                My coffee cup was empty, my eyes were bloodshot, and I had this brilliant idea 
                to hide hex codes everywhere. I mean, what could go wrong?"
              </p>
              <p>
                "I was supposed to make a simple robotics company site, but then I thought: 
                'Hey, why not make it interesting?' So I started hiding little secrets in 
                weird places. Some are obvious, some are... well, let's just say you'll need 
                to think outside the box."
              </p>
              <p>
                "I may have gotten a bit carried away with the whole 'hidden doors' thing. 
                And yes, I know some of the navigation doesn't make sense - that's the point! 
                If you're looking for a sitemap, good luck finding it. I may have hidden that too."
              </p>
              <p className="font-mono text-sm bg-gray-100 p-3 rounded">
                // TODO: Add proper error handling<br/>
                // TODO: Fix navigation issues<br/>
                // TODO: Get some sleep<br/>
                // TODO: Remember where I put the hex codes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hints Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Helpful Hints</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Because even the intern feels bad about how confusing this got
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔍 Explore Everything</h3>
              <p className="text-gray-600">
                Don't just click the obvious links. Check source code, inspect elements, 
                and explore every nook and cranny. Some doors are hidden in plain sight.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🗺️ Map It Out</h3>
              <p className="text-gray-600">
                Ever heard of a sitemap? It's like a treasure map for websites. 
                Sometimes the best way to find hidden things is to see the big picture.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl border-l-4 border-purple-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔐 Think Like a Hacker</h3>
              <p className="text-gray-600">
                Look for patterns, try different approaches, and remember: 
                if something seems too easy, you're probably missing something.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What You're Looking For</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The hex codes are hidden in various types of challenges throughout the site
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🔍 Hidden Doors</h3>
              <p className="text-gray-600 mb-4">
                Some pages or sections might appear inaccessible at first glance. 
                Look for alternative ways to reach them - maybe through URL manipulation, 
                or perhaps there's a hidden navigation element somewhere.
              </p>
              <p className="text-gray-600">
                Remember: just because a door appears locked doesn't mean it's impossible to open.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🧩 Puzzle Elements</h3>
              <p className="text-gray-600 mb-4">
                Throughout the site, you'll encounter various puzzles and challenges. 
                Some are obvious, some are subtle, and some are downright devious.
              </p>
              <p className="text-gray-600">
                Pay attention to details, look for inconsistencies, and don't be afraid 
                to try unconventional approaches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Challenge */}
      <section className="py-20 bg-gradient-to-r from-red-900 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Begin?</h2>
          <p className="text-xl text-red-100 mb-8 max-w-3xl mx-auto">
            The challenge awaits! Start exploring, solve the puzzles, collect the hex codes, 
            and unlock the final secret. Good luck, hacker!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/" 
              className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Start Exploring
            </Link>
            <Link 
              href="/assembly-line" 
              className="border-2 border-white text-white hover:bg-white hover:text-purple-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Try Assembly Line
            </Link>
          </div>
          <div className="mt-8 text-sm text-red-200">
            <p>💡 Pro tip: Sometimes the best way to find hidden things is to ask the website nicely</p>
            <p className="mt-2 font-mono">Hint: /sitemap.xml might be worth checking...</p>
          </div>
        </div>
      </section>
    </div>
  );
}
