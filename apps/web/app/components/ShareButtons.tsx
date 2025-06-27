import { useState } from 'react';

interface ShareData {
  character: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
  };
  healthData?: {
    sleep?: { score: number };
    activity?: { steps: number };
    readiness?: { score: number };
  };
  totalAdventures?: number;
  goldEarned?: number;
}

interface ShareButtonsProps {
  shareData: ShareData;
}

export function ShareButtons({ shareData }: ShareButtonsProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { character, healthData, totalAdventures, goldEarned } = shareData;

  // シェア用のテキストを生成
  const generateShareText = () => {
    const lines = [
      `🏃‍♂️ Oura Quest ⚔️`,
      ``,
      `キャラクター: ${character.name} Lv.${character.level}`,
      `HP: ${character.hp}/${character.maxHp} | MP: ${character.mp}/${character.maxMp}`,
      `攻撃力: ${character.attack} | 防御力: ${character.defense}`,
    ];

    if (healthData) {
      lines.push(``);
      lines.push(`今日の健康データ:`);
      if (healthData.sleep) lines.push(`💤 睡眠スコア: ${healthData.sleep.score}`);
      if (healthData.activity) lines.push(`🚶 歩数: ${healthData.activity.steps.toLocaleString()}`);
      if (healthData.readiness) lines.push(`✨ 準備度: ${healthData.readiness.score}`);
    }

    if (totalAdventures) {
      lines.push(``);
      lines.push(`🗡️ 冒険回数: ${totalAdventures}回`);
    }

    if (goldEarned) {
      lines.push(`💰 獲得ゴールド: ${goldEarned.toLocaleString()}`);
    }

    lines.push(``);
    lines.push(`#OuraQuest #健康ゲーム`);

    return lines.join('\n');
  };

  // 画像生成用のキャンバスを作成
  const generateShareImage = async (): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d')!;

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // タイトル
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏃‍♂️ Oura Quest ⚔️', 600, 100);

    // キャラクター情報
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`${character.name} Lv.${character.level}`, 600, 200);

    // ステータス
    ctx.font = '30px sans-serif';
    ctx.fillText(`HP: ${character.hp}/${character.maxHp} | MP: ${character.mp}/${character.maxMp}`, 600, 260);
    ctx.fillText(`攻撃力: ${character.attack} | 防御力: ${character.defense}`, 600, 310);

    // 健康データ
    if (healthData) {
      ctx.font = 'bold 35px sans-serif';
      ctx.fillText('今日の健康データ', 600, 380);

      ctx.font = '30px sans-serif';
      let y = 430;
      if (healthData.sleep) {
        ctx.fillText(`💤 睡眠スコア: ${healthData.sleep.score}`, 600, y);
        y += 50;
      }
      if (healthData.activity) {
        ctx.fillText(`🚶 歩数: ${healthData.activity.steps.toLocaleString()}`, 600, y);
        y += 50;
      }
      if (healthData.readiness) {
        ctx.fillText(`✨ 準備度: ${healthData.readiness.score}`, 600, y);
      }
    }

    // URL
    ctx.font = '25px sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText('https://oura-quest.com', 600, 580);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  };

  // 各SNSへのシェア関数
  const shareToX = async () => {
    const text = encodeURIComponent(generateShareText());
    const url = encodeURIComponent('https://oura-quest.com');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent('https://oura-quest.com');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToInstagram = async () => {
    // Instagramは直接投稿APIがないため、画像をダウンロードしてもらう
    const blob = await generateShareImage();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oura-quest-share.png';
    a.click();
    URL.revokeObjectURL(url);

    alert('画像をダウンロードしました。Instagramアプリで投稿してください。');
  };

  const shareToDiscord = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
      alert('クリップボードにコピーしました。Discordに貼り付けてください。');
    });
  };

  // Web Share API（対応ブラウザのみ）
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Oura Quest - 私の冒険記録',
          text: generateShareText(),
          url: 'https://oura-quest.com',
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span>📤</span>
        <span>シェアする</span>
      </button>

      {showShareMenu && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '0.5rem',
          zIndex: 10,
          minWidth: '200px',
        }}>
          <button
            onClick={shareToX}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            🐦 X (Twitter)
          </button>

          <button
            onClick={shareToFacebook}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            📘 Facebook
          </button>

          <button
            onClick={shareToInstagram}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            📷 Instagram
          </button>

          <button
            onClick={shareToDiscord}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            💬 Discord
          </button>

          {navigator.share && (
            <>
              <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
              <button
                onClick={shareNative}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem',
                  background: 'none',
                  border: 'none',
                  borderRadius: '4px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                📱 その他のアプリ
              </button>
            </>
          )}
        </div>
      )}

      {copySuccess && (
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: 0,
          background: '#10b981',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          fontSize: '0.9rem',
        }}>
          コピーしました！
        </div>
      )}
    </div>
  );
}