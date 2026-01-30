"use client";
// ======================================
// ☕ Yop カフェ 在庫・発注管理システム
// ======================================
// 原材料と消耗品の在庫を管理するアプリ
// ログイン必須！

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function YopCafeDemo() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ----------------------------------------
  // 🔐 ログインチェック
  // ----------------------------------------
  useEffect(() => {
    // 読み込み完了後、ログインしていなければログイン画面へ
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // ----------------------------------------
  // 🎛️ 画面の状態を管理する変数たち
  // ----------------------------------------
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState<string | null>(null);

  // ----------------------------------------
  // 📦 在庫データ（原材料・消耗品）
  // ----------------------------------------
  const [materials, setMaterials] = useState([
    { id: 1, name: 'コーヒー豆', current: 2, threshold: 1, unit: '袋', supplier: '仕入先A', dailyUse: 0.5 },
    { id: 2, name: 'パンケーキ', current: 15, threshold: 20, unit: '個', supplier: '工場から', dailyUse: 10 },
    { id: 3, name: '卵', current: 0, threshold: 1, unit: 'パック', supplier: 'スーパー', dailyUse: 0.5 },
    { id: 4, name: 'オーツミルク', current: 8, threshold: 10, unit: '本', supplier: '仕入先B', dailyUse: 3 },
    { id: 5, name: 'アイスクリームスプーン', current: 2, threshold: 1, unit: '箱', supplier: '備品業者', dailyUse: 0.2 },
  ]);

  // ----------------------------------------
  // 🔧 便利な関数たち
  // ----------------------------------------
  const getStatus = (current: number, threshold: number) => {
    if (current <= threshold) return 'alert';
    if (current <= threshold * 1.5) return 'warning';
    return 'ok';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'alert': return 'bg-pink-500';
      case 'warning': return 'bg-amber-400';
      default: return 'bg-cyan-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'alert': return { bg: 'bg-pink-100', text: 'text-pink-700', label: '🔴 要発注' };
      case 'warning': return { bg: 'bg-amber-100', text: 'text-amber-700', label: '⚠️ 注意' };
      default: return { bg: 'bg-cyan-100', text: 'text-cyan-700', label: '✅ OK' };
    }
  };

  const getDaysRemaining = (current: number, dailyUse: number) => {
    if (dailyUse <= 0) return '∞';
    return Math.floor(current / dailyUse);
  };

  const alertMaterials = materials.filter(m => getStatus(m.current, m.threshold) === 'alert');
  const warningMaterials = materials.filter(m => getStatus(m.current, m.threshold) === 'warning');

  // ログアウト関数
  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut(auth);
      router.push('/');
    }
  };

  // 読み込み中またはログインしていない場合
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">☕</div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // 🏠 ダッシュボード画面
  // ========================================
  const Dashboard = () => (
    <div className="space-y-5">
      {alertMaterials.length > 0 && (
        <div className="bg-pink-50 border-2 border-pink-300 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 text-pink-700 font-bold text-base mb-3">
            🚨 発注が必要です！
          </div>
          <div className="space-y-2">
            {alertMaterials.map(m => {
              const days = getDaysRemaining(m.current, m.dailyUse);
              return (
                <div key={m.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                  <div>
                    <span className="font-bold text-gray-800">{m.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{m.supplier}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-pink-600">{m.current}{m.unit}</div>
                    <div className="text-xs text-gray-500">残り{days}日分</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {warningMaterials.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-3">
            ⚠️ もうすぐ発注が必要
          </div>
          <div className="space-y-2">
            {warningMaterials.map(m => {
              const days = getDaysRemaining(m.current, m.dailyUse);
              return (
                <div key={m.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                  <div>
                    <span className="font-medium text-gray-800">{m.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{m.supplier}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-600">{m.current}{m.unit}</div>
                    <div className="text-xs text-gray-500">残り{days}日分</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <h2 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
          📊 在庫状況
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🚨</div>
            <div className="text-xs text-pink-600">要発注</div>
            <div className="text-2xl font-bold text-pink-700">{alertMaterials.length}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-xs text-amber-600">注意</div>
            <div className="text-2xl font-bold text-amber-700">{warningMaterials.length}</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-xs text-cyan-600">OK</div>
            <div className="text-2xl font-bold text-cyan-700">{materials.length - alertMaterials.length - warningMaterials.length}</div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setShowModal('materials')}
        className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-2xl p-4 text-left shadow-lg active:scale-[0.98] transition"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">📦</div>
          <div>
            <div className="font-bold text-lg">在庫を入力する</div>
            <div className="text-sm opacity-80">原材料・消耗品の数を更新</div>
          </div>
        </div>
      </button>
    </div>
  );

  // ========================================
  // 📦 在庫一覧画面
  // ========================================
  const StockView = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-pink-50">
          <h2 className="font-bold text-gray-800">📦 在庫一覧</h2>
          <button 
            onClick={() => setShowModal('materials')}
            className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow"
          >
            入力
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {materials.map(m => {
            const status = getStatus(m.current, m.threshold);
            const badge = getStatusBadge(status);
            const days = getDaysRemaining(m.current, m.dailyUse);
            return (
              <div key={m.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-gray-900">{m.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({m.supplier})</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getStatusColor(status)}`}
                      style={{ width: `${Math.min((m.current / (m.threshold * 2)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-700">
                      {m.current}/{m.threshold}{m.unit}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({days}日分)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ========================================
  // 📦 在庫入力モーダル
  // ========================================
  const MaterialsModal = () => {
    const [tempValues, setTempValues] = useState(
      materials.reduce((acc, m) => ({ ...acc, [m.id]: m.current }), {} as Record<number, number>)
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
        <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-cyan-50 to-pink-50 rounded-t-3xl">
            <h3 className="font-bold text-lg">📦 在庫入力</h3>
            <button onClick={() => setShowModal(null)} className="text-2xl text-gray-400 hover:text-gray-600">×</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {materials.map(m => {
              const status = getStatus(tempValues[m.id], m.threshold);
              const badge = getStatusBadge(status);
              return (
                <div key={m.id} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-gray-800">{m.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({m.unit})</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                      発注点: {m.threshold}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setTempValues(prev => ({...prev, [m.id]: Math.max(0, prev[m.id] - 1)}))}
                      className="w-14 h-14 bg-gray-200 rounded-full text-2xl font-bold active:bg-gray-300 transition"
                    >−</button>
                    <input
                      type="number"
                      value={tempValues[m.id]}
                      onChange={(e) => setTempValues(prev => ({...prev, [m.id]: parseInt(e.target.value) || 0}))}
                      className="flex-1 text-center text-3xl font-bold border-2 border-gray-200 rounded-xl p-3 focus:border-cyan-400 focus:outline-none"
                    />
                    <button 
                      onClick={() => setTempValues(prev => ({...prev, [m.id]: prev[m.id] + 1}))}
                      className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-full text-2xl font-bold active:opacity-80 transition"
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t bg-gray-50">
            <button 
              onClick={() => {
                setMaterials(materials.map(m => ({ ...m, current: tempValues[m.id] })));
                setShowModal(null);
              }}
              className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:opacity-90 transition"
            >
              保存する
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // 🖥️ メイン画面
  // ========================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-pink-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">☕</span>
            <div>
              <h1 className="font-bold text-lg">Yop カフェ</h1>
              <p className="text-xs text-white/80">在庫・発注管理</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">
                {new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
              </div>
              <div className="text-xs text-white/80">
                {new Date().toLocaleDateString('ja-JP', { weekday: 'short' })}
              </div>
            </div>
            {/* ログアウトボタン */}
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
              title="ログアウト"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="p-4 pb-24">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'stock' && <StockView />}
      </main>

      {/* ボトムナビ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 flex justify-around py-3 z-40 shadow-lg">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center p-2 ${activeTab === 'dashboard' ? 'text-cyan-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">🏠</span>
          <span className="text-xs font-medium">ホーム</span>
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center p-2 ${activeTab === 'stock' ? 'text-cyan-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">📦</span>
          <span className="text-xs font-medium">在庫</span>
        </button>
        <button 
          onClick={() => setShowModal('materials')}
          className="flex flex-col items-center p-2 text-pink-500"
        >
          <span className="text-2xl">✏️</span>
          <span className="text-xs font-medium">入力</span>
        </button>
      </nav>

      {/* モーダル */}
      {showModal === 'materials' && <MaterialsModal />}
    </div>
  );
}