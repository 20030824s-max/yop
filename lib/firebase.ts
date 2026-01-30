// ======================================
// 🔥 Firebase設定ファイル
// ======================================
// このファイルでFirebase（データベース）に接続するよ
// Yop カフェ専用のプロジェクト！

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Yop カフェ専用のFirebase設定情報
const firebaseConfig = {
  apiKey: "AIzaSyCOxZbdbsZUSOCFKSnnaF9Fk0I3K-0uNQo",
  authDomain: "yop-cafe.firebaseapp.com",
  projectId: "yop-cafe",
  storageBucket: "yop-cafe.firebasestorage.app",
  messagingSenderId: "625821436762",
  appId: "1:625821436762:web:3319e4d351ca846bfa0163"
};

// Firebaseを初期化（起動）
const app = initializeApp(firebaseConfig);

// Firestore（データベース）を使えるようにする
export const db = getFirestore(app);

// Auth（ログイン機能）を使えるようにする
export const auth = getAuth(app);