'use client'

type Props = {
  onClose: () => void
}

// 仮のルール（ボードゲームカフェ想定）。管理者が後で内容を差し替え可能。
const RULES: { icon: string; title: string; body: string }[] = [
  {
    icon: '🎲',
    title: 'ゲームは大切に',
    body: 'カード・コマ・説明書は丁寧に扱い、遊び終わったら箱に戻して元の棚へお返しください。',
  },
  {
    icon: '🍽️',
    title: '飲食物の持ち込みはご遠慮ください',
    body: 'お飲み物・お食事は店内メニューからご注文をお願いします。',
  },
  {
    icon: '🔇',
    title: 'みんなが気持ちよく',
    body: '大きな声や長時間の席取りはご遠慮ください。周りのお客様への配慮をお願いします。',
  },
  {
    icon: '🧑‍🏫',
    title: '遊び方が分からないときは',
    body: 'スタッフがルール説明・おすすめゲームのご案内をします。お気軽にお声かけください。',
  },
  {
    icon: '👛',
    title: '貴重品の管理',
    body: '貴重品はご自身での管理をお願いします。紛失・盗難の責任は負いかねます。',
  },
  {
    icon: '🚪',
    title: '退店時',
    body: 'ご利用後はアプリで退室し、お会計はレジまでお越しください。',
  },
]

export function RulesModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(255,248,235,0.98) 0%, rgba(254,243,210,0.98) 100%)',
          border: '1px solid rgba(200,150,80,0.3)',
          maxHeight: '85vh',
        }}
      >
        {/* ヘッダー */}
        <div
          className="px-6 py-4 text-center flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(139,90,43,0.12)' }}
        >
          <h3 className="font-bold text-base" style={{ color: '#3d1f0a' }}>
            📖 のまぼどカフェ ルール
          </h3>
          <p className="text-xs mt-0.5" style={{ color: '#a07040' }}>
            みんなで楽しく過ごすためのお願いです
          </p>
        </div>

        {/* ルール一覧（スクロール） */}
        <div className="px-5 py-4 flex flex-col gap-2.5 overflow-y-auto">
          {RULES.map((rule, i) => (
            <div
              key={i}
              className="flex gap-3 px-3 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(139,90,43,0.15)' }}
            >
              <span className="text-xl flex-shrink-0 leading-none mt-0.5">{rule.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold" style={{ color: '#3d1f0a' }}>{rule.title}</span>
                <span className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6b4a2a' }}>{rule.body}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 閉じるボタン */}
        <div
          className="px-5 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(139,90,43,0.12)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
            style={{ background: 'linear-gradient(160deg, #5c3317 0%, #3d1f0a 100%)', color: '#f5deb3', border: '1px solid rgba(139,90,43,0.4)' }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
