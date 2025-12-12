import streamlit as st
import pandas as pd
from streamlit_gsheets import GSheetsConnection
import urllib.parse

# ---------------------------------------------------------
# 1. 設定とデータ読み込み
# ---------------------------------------------------------
st.set_page_config(page_title="カフェ在庫管理・発注アプリ", layout="wide")
st.title("☕ カフェ在庫管理・発注アプリ")

# Google Sheetsへの接続
conn = st.connection("gsheets", type=GSheetsConnection)

# データの読み込み関数（キャッシュを使って高速化）
def load_data():
    try:
        # シート名 'master' を指定して全データを読み込む
        df = conn.read(worksheet="master")
        # 数値として扱うべきカラムを強制的に数値変換（エラー回避）
        df["現在在庫"] = pd.to_numeric(df["現在在庫"], errors="coerce").fillna(0).astype(int)
        df["発注点"] = pd.to_numeric(df["発注点"], errors="coerce").fillna(0).astype(int)
        df["商品ID"] = df["商品ID"].astype(str) # IDは文字列として扱う
        return df
    except Exception as e:
        st.error(f"データの読み込みに失敗しました。シート名が 'master' か確認してください。\nエラー: {e}")
        return pd.DataFrame()

# データをロード
df = load_data()

# データが空なら処理を中断
if df.empty:
    st.stop()

# タブの作成
tab1, tab2 = st.tabs(["📋 ① 在庫チェック", "🚀 ② 発注リスト"])

# ---------------------------------------------------------
# 2. タブ①：在庫チェック機能
# ---------------------------------------------------------
with tab1:
    st.header("在庫数の入力・更新")
    
    # フィルタ機能
    categories = ["すべて"] + list(df["分類"].unique())
    selected_category = st.selectbox("📂 分類で絞り込み", categories)

    # 表示用データの作成
    if selected_category == "すべて":
        display_df = df.copy()
    else:
        display_df = df[df["分類"] == selected_category].copy()

    # 在庫入力用のエディタを表示
    # ユーザーが編集できるのは「現在在庫」のみにする設定
    edited_df = st.data_editor(
        display_df,
        column_config={
            "商品ID": st.column_config.TextColumn(disabled=True),
            "分類": st.column_config.TextColumn(disabled=True),
            "商品名": st.column_config.TextColumn(disabled=True),
            "発注点": st.column_config.NumberColumn(disabled=True),
            "現在在庫": st.column_config.NumberColumn(
                "現在在庫 (タップして入力)",
                min_value=0,
                step=1,
                required=True
            ),
            "ステータス": st.column_config.TextColumn(disabled=True),
        },
        hide_index=True,
        use_container_width=True,
        key="inventory_editor"
    )

    # 保存ボタン
    if st.button("💾 在庫数を保存して更新", type="primary"):
        try:
            # 編集された内容（edited_df）を元のデータ（df）に反映させる
            # 商品IDをキーにして在庫数を更新
            for index, row in edited_df.iterrows():
                # 元のデータの該当IDの行を探して更新
                target_id = row["商品ID"]
                new_stock = row["現在在庫"]
                df.loc[df["商品ID"] == target_id, "現在在庫"] = new_stock
                
                # 在庫が発注点より多ければ、ステータスをリセット（任意）
                if new_stock > df.loc[df["商品ID"] == target_id, "発注点"].values[0]:
                    df.loc[df["商品ID"] == target_id, "ステータス"] = "未発注"

            # スプレッドシートを更新
            conn.update(worksheet="master", data=df)
            st.success("✅ スプレッドシートを更新しました！")
            st.rerun() # 画面をリロード
        except Exception as e:
            st.error(f"保存中にエラーが発生しました: {e}")

# ---------------------------------------------------------
# 3. タブ②：発注リスト機能
# ---------------------------------------------------------
with tab2:
    st.header("発注が必要な商品リスト")

    # 発注が必要な商品を抽出
    # 条件: (現在在庫 <= 発注点) かつ (ステータス != 発注済)
    order_list = df[
        (df["現在在庫"] <= df["発注点"]) & 
        (df["ステータス"] != "発注済")
    ].copy()

    if order_list.empty:
        st.info("🎉 現在、発注が必要な商品はありません。")
    else:
        st.write(f"現在 **{len(order_list)}** 件の発注候補があります。")
        
        # 発注先ごとにグループ化して表示
        suppliers = order_list["発注先"].unique()

        for supplier in suppliers:
            with st.expander(f"🏢 **{supplier}** への発注", expanded=True):
                # この業者の商品だけ抽出
                supplier_items = order_list[order_list["発注先"] == supplier]
                
                # 商品リストを表示
                st.dataframe(
                    supplier_items[["商品名", "現在在庫", "発注点", "単位", "備考"]],
                    hide_index=True,
                    use_container_width=True
                )

                # 発注方法の判定（グループ内で最初の1件の設定を採用）
                method = supplier_items.iloc[0]["発注方法"]
                contact = supplier_items.iloc[0]["連絡先/宛先"]

                # 発注テキストの生成
                order_text = "【発注お願いします】\n\n"
                for _, row in supplier_items.iterrows():
                    # 注文数は適当なロジック（例: 発注点 + 10 - 現在在庫）等が一般的ですが、
                    # 今回はシンプルに「発注点」まで回復させる数、あるいは単に商品名をリストアップ
                    shortage = row["発注点"] - row["現在在庫"] + 5 # 余裕を持って+5など
                    order_text += f"・{row['商品名']}: {shortage} {row['単位']}\n"
                order_text += "\nよろしくお願いいたします。"

                # アクションエリア
                c1, c2 = st.columns([2, 1])
                
                with c1:
                    if method == "メール":
                        # メールリンクの生成
                        subject = urllib.parse.quote("発注のお願い")
                        body = urllib.parse.quote(order_text)
                        mailto_link = f"mailto:{contact}?subject={subject}&body={body}"
                        
                        st.markdown(f'''
                            <a href="{mailto_link}" target="_blank" style="text-decoration:none;">
                                <button style="
                                    background-color:#FF4B4B; color:white; border:none; 
                                    padding:10px 20px; border-radius:5px; cursor:pointer;">
                                    📧 メーラーを起動して発注
                                </button>
                            </a>
                            ''', unsafe_allow_html=True)
                    else:
                        # LINEやWeb用
                        st.info(f"発注方法: **{method}** ({contact})")
                        st.text_area("コピー用テキスト", value=order_text, height=150, key=f"text_{supplier}")

                with c2:
                    # 発注完了ボタン
                    if st.button(f"✅ {supplier}の発注完了", key=f"btn_{supplier}"):
                        # ステータスを「発注済」に更新
                        target_ids = supplier_items["商品ID"].tolist()
                        df.loc[df["商品ID"].isin(target_ids), "ステータス"] = "発注済"
                        
                        # スプレッドシート保存
                        conn.update(worksheet="master", data=df)
                        st.success(f"{supplier}の商品を「発注済」にしました！")
                        st.rerun()
