import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-4">
              <span className="text-gold">Oscar</span> Betting Pool
            </h1>
            <p className="text-xl mb-8">
              Predict the Academy Awards winners and compete with friends!
            </p>
            <Link
              href="/register"
              className="bg-gold text-black px-8 py-4 rounded-lg text-xl font-bold hover:bg-gold-dark transition-colors"
            >
              Start Betting Now
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-gray-900 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-gold">
                Create Games
              </h3>
              <p>
                Set up your own Oscar betting pool and invite friends to join.
                Customize initial balances and track everyone&apos;s bets.
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-gold">Real Odds</h3>
              <p>
                Place bets using real-time odds from Gold Derby. The more
                unlikely the winner, the bigger the potential payout!
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-gold">
                Live Updates
              </h3>
              <p>
                Watch your position on the leaderboard change in real-time as
                the winners are announced during the ceremony.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
