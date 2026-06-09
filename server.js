const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '50mb' }));

app.post('/create-video', async (req, res) => {
  const { audioUrl, matchLabel, predictedScore, group, date } = req.body;

  const tmpDir = '/tmp';
  const audioPath = path.join(tmpDir, 'audio.mp3');
  const bgPath = path.join(tmpDir, 'bg.png');
  const outputPath = path.join(tmpDir, 'output.mp4');

  try {
    // Ses dosyasını indir
    const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(audioPath, audioResponse.data);

    // Arka plan oluştur (siyah + metin)
    const safeMatch = matchLabel.replace(/'/g, '');
    const safeScore = predictedScore.replace(/'/g, '');
    const safeGroup = group.replace(/'/g, '');

    execSync(`ffmpeg -y -f lavfi -i color=c=black:size=1080x1920:rate=30 \
      -vf "drawtext=text='WORLD CUP 2026':fontcolor=gold:fontsize=60:x=(w-text_w)/2:y=200, \
      drawtext=text='${safeMatch}':fontcolor=white:fontsize=50:x=(w-text_w)/2:y=400, \
      drawtext=text='${safeGroup}':fontcolor=cyan:fontsize=40:x=(w-text_w)/2:y=520, \
      drawtext=text='Predicted Score':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=700, \
      drawtext=text='${safeScore}':fontcolor=yellow:fontsize=80:x=(w-text_w)/2:y=780" \
      -t 3 -an ${bgPath.replace('.png', '.mp4')}`);

    // Ses ile birleştir
    execSync(`ffmpeg -y -i ${bgPath.replace('.png', '.mp4')} -i ${audioPath} \
      -c:v copy -c:a aac -shortest ${outputPath}`);

    // Videoyu gönder
    const videoData = fs.readFileSync(outputPath);
    res.set('Content-Type', 'video/mp4');
    res.send(videoData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
