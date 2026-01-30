"use client";
// ======================================
// 🔐 ログイン管理コンポーネント
// ======================================
// アプリ全体でログイン状態を共有するためのファイル

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// ログイン情報を入れる「箱」を作る
type AuthContextType = {
  user: User | null;      // ログイン中のユーザー情報
  loading: boolean;       // 読み込み中かどうか
};

// 箱を作成
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// 箱の中身を使うための関数
export const useAuth = () => useContext(AuthContext);

// ======================================
// AuthProvider コンポーネント
// ======================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ログイン中のユーザー
  const [user, setUser] = useState<User | null>(null);
  // 読み込み中かどうか
  const [loading, setLoading] = useState(true);

  // ページを開いたときにログイン状態をチェック
  useEffect(() => {
    // Firebaseのログイン状態を監視
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);      // ユーザー情報をセット
      setLoading(false);  // 読み込み完了
    });

    // 画面を離れるときに監視を止める
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}