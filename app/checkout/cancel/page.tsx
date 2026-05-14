import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">😔</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          決済がキャンセルされました
        </h1>
        <p className="text-gray-500 mb-8">
          お支払いはキャンセルされました。再度お試しいただけます。
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
