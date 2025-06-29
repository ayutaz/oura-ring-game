#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Cloudflare 自動セットアップスクリプト');
console.log('=====================================\n');

// 実行コマンドのヘルパー関数
function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (error) {
    console.error(`エラー: ${command}`);
    console.error(error.message);
    return null;
  }
}

// wrangler.tomlを更新する関数
function updateWranglerConfig(databaseId, kvId) {
  const wranglerPath = join(process.cwd(), 'wrangler.toml');
  let content = readFileSync(wranglerPath, 'utf8');
  
  // D1 database IDを更新
  content = content.replace('database_id = ""', `database_id = "${databaseId}"`);
  
  // KV namespace IDを更新
  content = content.replace('id = ""', `id = "${kvId}"`);
  
  writeFileSync(wranglerPath, content);
  console.log('✅ wrangler.toml を更新しました');
}

async function main() {
  console.log('📊 ステップ1: D1データベースを作成中...');
  const d1Output = exec('wrangler d1 create oura-game-db 2>&1');
  
  if (d1Output) {
    // database_idを抽出
    const dbIdMatch = d1Output.match(/database_id = "([^"]+)"/);
    if (dbIdMatch) {
      const databaseId = dbIdMatch[1];
      console.log(`✅ D1データベース作成完了: ${databaseId}`);
      
      console.log('\n🗄️  ステップ2: KVネームスペースを作成中...');
      const kvOutput = exec('wrangler kv:namespace create CACHE --preview false 2>&1');
      
      if (kvOutput) {
        // KV IDを抽出
        const kvIdMatch = kvOutput.match(/id = "([^"]+)"/);
        if (kvIdMatch) {
          const kvId = kvIdMatch[1];
          console.log(`✅ KVネームスペース作成完了: ${kvId}`);
          
          console.log('\n📝 ステップ3: wrangler.tomlを更新中...');
          updateWranglerConfig(databaseId, kvId);
          
          console.log('\n🔨 ステップ4: D1スキーマを適用中...');
          const schemaResult = exec('wrangler d1 execute oura-game-db --file=./apps/api/src/db/schema.d1.sql --env=production');
          if (schemaResult !== null) {
            console.log('✅ スキーマ適用完了');
          } else {
            console.log('⚠️  スキーマ適用をスキップ（後で手動実行してください）');
          }
          
          console.log('\n✅ 自動セットアップ完了！');
          console.log('\n📋 次の手動作業が必要です:');
          console.log('1. Cloudflareダッシュボードで以下のシークレットを設定:');
          console.log('   - OURA_CLIENT_ID');
          console.log('   - OURA_CLIENT_SECRET');
          console.log('   - JWT_SECRET');
          console.log('\n2. GitHubリポジトリのSecretsに以下を追加:');
          console.log('   - CLOUDFLARE_API_TOKEN (Cloudflareから取得)');
          console.log('\n3. 以下のコマンドでデプロイ:');
          console.log('   git add -A && git commit -m "Setup Cloudflare" && git push');
          
          // 生成されたIDを表示
          console.log('\n📌 生成されたID（記録しておいてください）:');
          console.log(`D1 Database ID: ${databaseId}`);
          console.log(`KV Namespace ID: ${kvId}`);
          
        } else {
          console.error('KV namespace IDの取得に失敗しました');
        }
      } else {
        console.error('KVネームスペースの作成に失敗しました');
      }
    } else {
      console.error('Database IDの取得に失敗しました');
    }
  } else {
    console.error('D1データベースの作成に失敗しました');
    console.log('\nヒント: wrangler loginでCloudflareにログインしているか確認してください');
  }
}

// メイン処理を実行
main().catch(console.error);