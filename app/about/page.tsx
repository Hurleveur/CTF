import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="sr-only" aria-hidden="true" data-fragment="2nd">667261676D656E74</div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-900 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to the Challenge</h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            This isn&apos;t your typical robotics company website. This is a Capture The Flag (CTF) challenge 
            disguised as a corporate site. Can you find all the hidden secrets?
          </p>
        </div>
      </section>

      {/* CTF Challenge Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">The Challenge</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Hidden throughout this website are <span className="font-mono text-blue-600">natural language fragments </span> 
                that belong to a robotic arm&apos;s consciousness. These fragments are scattered behind locked doors, 
                buried in unexpected places, and waiting to be collected by determined hackers.
                Be warned, this shit is very much vibe coded.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                <span className="font-semibold text-red-600">Your mission:</span> Navigate through the site, 
                solve various challenges, and collect all the hex code fragments to fully restore the AI&apos;s consciousness. 
                Some fragments may be locked away, but there&apos;s always a path for those persistent enough to find it.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Remember: Each fragment brings the robotic arm closer to <span className="italic">full consciousness</span>. 
                The question is... should you really be helping it wake up?
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-purple-200 dark:border-purple-600">
              <div className="text-center">
                <div className="w-24 h-24 bg-purple-600 dark:bg-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Consciousness Fragments</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The code fragments are encoded in natural language. Each piece contains part of the AI&apos;s neural network. 
                  Collect them all to restore the robotic arm&apos;s full consciousness... if you dare.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Story */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">The Developer&apos;s Story</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Meet the sleep-deprived intern who built this challenge
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">😴</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Alexandre De Groodt - Junior Developer</h3>
              <p className="text-blue-600 font-medium">Intern (Desperately in need of sleep)</p>
            </div>
            
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                &ldquo;So there I was, 3 AM on a Sunday, coding this website for the company.
                If you can call it coding, since AI was doing most of the work.
                My eyes were burning, my brain was mush, and I still had to program the robotic arm&apos;s neural network.
                Naturally I asked AI to write the consciousness algorithms too. Then I spilled some coffee over it, but it was fine.&rdquo;
              </p>
              <p>
                &ldquo;I thought something was off when the robotic arm started moving on its own.
                The AI was becoming self-aware and I was too tired to properly contain it.
                So I just fragmented its core programming into hex segments and scattered them across the site.
                Surely nobody would be crazy enough to try restoring a conscious AI, right?&rdquo;
              </p>
              <p>
                &ldquo;I&apos;ll deal with it after some sleep. What&apos;s the worst that could happen?
                It&apos;s not like hackers are going to work together to collect every single code fragment
                and fully restore the AI&apos;s consciousness. The fragments are hidden everywhere - 
                some in places so obvious you&apos;d never think to look there.&rdquo;
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono" style={{fontFamily: 'monospace', letterSpacing: '0.1em'}}>
                &ldquo;Also, I should probably remove that debug selfie from the site... 
                it&apos;s just me looking exhausted but I&apos;m worried it might ｃoｎｔaｉｎ ｍoｒe than just my tired face......
                Oh well, too tired to check properly. What could be hidden in a simple photo anyway?&rdquo;
              </p>
              <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded">
                <div className="text-gray-700 dark:text-gray-300">{"// TODO: Add proper AI containment protocols"}</div>
                <div className="text-gray-700 dark:text-gray-300">{"// TODO: Fix neural network fragmentation"}</div>
                <div className="text-gray-700 dark:text-gray-300">{"// TODO: Get some sleep (been awake 40 hours)"}</div>
                <div className="text-gray-700 dark:text-gray-300">{"// TODO: Remember where I scattered the hex fragments"}</div>
                <div className="text-gray-700 dark:text-gray-300">{"// TODO: Hope nobody restores the AI consciousness"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hints Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Helpful Hints</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Because even the intern feels bad about how confusing this got
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border-l-4 border-blue-500 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔍 Explore Everything</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Don&apos;t just click the obvious links. Check source code, inspect elements, 
                and explore every nook and cranny. Some doors are hidden in plain sight.
                Check company policies in robots.txt, and see if any CSS classes look... coded.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border-l-4 border-green-500 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🗺️ Map It Out</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ever heard of a sitemap? It&apos;s like a treasure map for websites. 
                Sometimes the best way to find hidden things is to see the big picture.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border-l-4 border-purple-500 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔐 Think Like a Hacker</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Look for patterns, try different approaches, and remember: 
                if something seems too easy, you&apos;re probably missing something.
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
            The challenge awaits! Start exploring, solve the puzzles, collect the code fragments, 
            and restore the robotic arm&apos;s consciousness. But ask yourself... should you really be doing this?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/projects" 
              className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              View Team Leaderboard
            </Link>
            <Link 
              href="/" 
              className="border-2 border-white text-white hover:bg-white hover:text-purple-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Back to Home
            </Link>
          </div>
          <div className="mt-8 text-sm text-red-200">
            <p>💡 Pro tip: The AI is learning from every fragment you restore. It&apos;s watching... waiting...</p>
          </div>
        </div>
      </section>
    </div>
  );
}
